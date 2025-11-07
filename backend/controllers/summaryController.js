const { Summary } = require('../models');
const { getLsTermSelection, buildLsTermFindFilter, buildMixedHouseOrFilter } = require('../utils/lsTerm');
const { secureLogger } = require('../utils/logger');
const { escapeRegex } = require('../utils/validators');

// Get overall dashboard overview (house + term aware; consistent response shape)
const getOverview = async (req, res) => {
  try {
    const lsSel = getLsTermSelection(req);
    const house = req.query.house;

    // Build match for mp_summary with house/term logic
    let match = { type: 'mp_summary' };
    if (house === 'Lok Sabha') {
      match = {
        ...match,
        house: 'Lok Sabha',
        ...(lsSel === 'both' ? { lsTerm: { $in: [17, 18] } } : { lsTerm: parseInt(lsSel, 10) })
      };
    } else if (house === 'Rajya Sabha') {
      match = { ...match, house: 'Rajya Sabha' };
    } else if (house === 'Both Houses' || !house) {
      match.$or = buildMixedHouseOrFilter(lsSel);
    }

    const agg = await Summary.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          mpKeySet: { $addToSet: { $concat: [
            { $ifNull: ['$mpName', ''] }, '::',
            { $ifNull: ['$house', ''] }, '::',
            { $ifNull: ['$state', ''] }, '::',
            { $ifNull: ['$constituency', ''] }
          ] } },
          // Allocation can be stored as allocatedAmount or totalAllocated on mp_summary
          totalAllocated: { 
            $sum: { 
              $ifNull: [
                '$allocatedAmount', 
                { $ifNull: [ '$totalAllocated', 0 ] }
              ] 
            } 
          },
          totalExpenditure: { $sum: { $ifNull: ['$totalExpenditure', 0] } },
          totalTransactions: { $sum: { $ifNull: ['$transactionCount', 0] } },
          avgAllocation: { $avg: { $ifNull: ['$allocatedAmount', { $ifNull: ['$totalAllocated', 0] }] } },
          totalWorksCompleted: { $sum: { $ifNull: ['$completedWorksCount', 0] } },
          totalWorksRecommended: { $sum: { $ifNull: ['$recommendedWorksCount', 0] } },
          totalRecommendedAmount: { $sum: { $ifNull: ['$totalRecommendedAmount', 0] } },
          // Completed value: prefer completedWorksValue, then totalCompletedAmount, then totalCompletedWorksValue
          totalCompletedWorksValue: {
            $sum: {
              $ifNull: [
                '$completedWorksValue',
                { $ifNull: [ '$totalCompletedAmount', { $ifNull: ['$totalCompletedWorksValue', 0] } ] }
              ]
            }
          },
          totalInProgressPayments: { $sum: { $ifNull: ['$inProgressPayments', { $ifNull: ['$totalInProgressPayments', 0] }] } },
          avgCompletionRate: { $avg: { $ifNull: ['$completionRate', 0] } }
        }
      },
      {
        $addFields: {
          totalMPs: { $size: { $ifNull: ['$mpKeySet', []] } },
          utilizationPercentage: {
            $cond: [
              { $or: [{ $eq: ['$totalAllocated', 0] }, { $eq: ['$totalAllocated', null] }] },
              0,
              {
                $cond: [
                  { $or: [{ $eq: ['$totalExpenditure', null] }, { $eq: ['$totalExpenditure', 0] }] },
                  0,
                  { $min: [{ $multiply: [{ $divide: [{ $ifNull: ['$totalExpenditure', 0] }, '$totalAllocated'] }, 100] }, 100] }
                ]
              }
            ]
          },
          paymentGap: {
            $cond: [
              { $or: [{ $eq: ['$totalExpenditure', 0] }, { $eq: ['$totalExpenditure', null] }] },
              0,
              {
                $cond: [
                  { $or: [{ $eq: ['$totalInProgressPayments', null] }, { $eq: ['$totalInProgressPayments', 0] }] },
                  0,
                  { $min: [{ $multiply: [{ $divide: [{ $ifNull: ['$totalInProgressPayments', 0] }, '$totalExpenditure'] }, 100] }, 100] }
                ]
              }
            ]
          },
          completionRate: {
            $cond: [
              { $or: [{ $eq: ['$totalWorksRecommended', 0] }, { $eq: ['$totalWorksRecommended', null] }] },
              0,
              { $multiply: [{ $divide: ['$totalWorksCompleted', '$totalWorksRecommended'] }, 100] }
            ]
          }
        }
      }
    ]);

    const doc = agg[0];
    if (!doc) {
      return res.status(200).json({ success: true, data: {
        totalAllocated: 0,
        totalExpenditure: 0,
        utilizationPercentage: 0,
        totalMPs: 0,
        totalWorksCompleted: 0,
        totalWorksRecommended: 0,
        completionRate: 0,
        totalTransactions: 0,
        avgAllocation: 0,
        pendingWorks: 0,
        paymentGap: 0,
        completedWorksValue: 0,
        inProgressPayments: 0
      }});
    }

    return res.json({ success: true, data: {
      totalAllocated: doc.totalAllocated || 0,
      totalExpenditure: doc.totalExpenditure || 0,
      utilizationPercentage: doc.utilizationPercentage || 0,
      totalMPs: doc.totalMPs || 0,
      totalWorksCompleted: doc.totalWorksCompleted || 0,
      totalWorksRecommended: doc.totalWorksRecommended || 0,
      completionRate: doc.completionRate || 0,
      totalTransactions: doc.totalTransactions || 0,
      avgAllocation: doc.avgAllocation || 0,
      pendingWorks: Math.max(0, (doc.totalWorksRecommended || 0) - (doc.totalWorksCompleted || 0)),
      paymentGap: doc.paymentGap || 0,
      completedWorksValue: doc.totalCompletedWorksValue || 0,
      inProgressPayments: doc.totalInProgressPayments || 0
    }});
  } catch (error) {
    secureLogger.error('Error fetching overview data', {
      category: 'controller',
      type: 'overview_fetch_error',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// Get state-wise summary
const getStateSummary = async (req, res) => {
  try {
    const { house, state, limit = 50, sortBy = 'utilizationPercentage', order = 'desc' } = req.query;
    const lsSel = getLsTermSelection(req);
    
    // Build query
    const query = { type: 'state_summary' };
    if (state) query.state = state;
    if (house) {
      query.house = house;
      if (house === 'Lok Sabha') {
        Object.assign(query, lsSel === 'both' ? { lsTerm: { $in: [17, 18] } } : { lsTerm: parseInt(lsSel, 10) });
      }
    } else {
      // No house specified: mix RS + LS-term selection
      query.$or = buildMixedHouseOrFilter(lsSel);
    }
    
    // If no house is specified, aggregate data across both houses
    if (!house) {
      // Build match stage for aggregation
      const matchStage = { type: 'state_summary' };
      if (state) matchStage.state = state;
      // Apply mixed house/term filter
      matchStage.$or = buildMixedHouseOrFilter(lsSel);
      
      const aggregatedStates = await Summary.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$state',
            totalAllocated: { $sum: '$totalAllocated' },
            totalExpenditure: { $sum: '$totalExpenditure' },
            mpCount: { $sum: '$mpCount' },
            houses: { $push: '$house' }
          }
        },
        {
          $addFields: {
            utilizationPercentage: {
              $cond: {
                if: { $or: [{ $eq: ['$totalAllocated', 0] }, { $eq: ['$totalAllocated', null] }] },
                then: 0,
                else: {
                  $cond: {
                    if: { $or: [{ $eq: ['$totalExpenditure', null] }, { $eq: ['$totalExpenditure', 0] }] },
                    then: 0,
                    else: { $min: [{ $multiply: [{ $divide: [{ $ifNull: ['$totalExpenditure', 0] }, '$totalAllocated'] }, 100] }, 100] }
                  }
                }
              }
            },
            state: '$_id'
          }
        },
        { $sort: { [sortBy]: order === 'desc' ? -1 : 1 } },
        { $limit: parseInt(limit) }
      ]);

      // Get completion data from MP summaries
      const completionMatchStage = { type: 'mp_summary' };
      if (state) completionMatchStage.state = state;
      completionMatchStage.$or = buildMixedHouseOrFilter(lsSel);
      
      const completionData = await Summary.aggregate([
        { $match: completionMatchStage },
        {
          $group: {
            _id: '$state',
            completedWorksCount: { $sum: '$completedWorksCount' },
            recommendedWorksCount: { $sum: '$recommendedWorksCount' }
          }
        }
      ]);

      const completionMap = {};
      completionData.forEach(item => {
        completionMap[item._id] = {
          completedWorksCount: item.completedWorksCount,
          recommendedWorksCount: item.recommendedWorksCount
        };
      });

      res.json({
        success: true,
        data: aggregatedStates.map(state => ({
          state: state.state,
          totalAllocated: state.totalAllocated || 0,
          totalExpenditure: state.totalExpenditure || 0,
          utilizationPercentage: state.utilizationPercentage || 0,
          mpCount: state.mpCount || 0,
          totalMPs: state.mpCount || 0,
          totalWorksCompleted: completionMap[state.state]?.completedWorksCount || 0,
          completedWorksCount: completionMap[state.state]?.completedWorksCount || 0,
          recommendedWorksCount: completionMap[state.state]?.recommendedWorksCount || 0
        })),
        count: aggregatedStates.length
      });
    } else {
      // Fetch state summaries for specific house
      const stateSummaries = await Summary
        .find(query)
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .limit(parseInt(limit));
      
      res.json({
        success: true,
        data: stateSummaries.map(state => ({
          state: state.state,
          house: state.house,
          totalAllocated: state.totalAllocated || 0,
          totalExpenditure: state.totalExpenditure || 0,
          utilizationPercentage: state.utilizationPercentage || 0,
          mpCount: state.mpCount || 0,
          totalMPs: state.mpCount || 0,
          totalWorksCompleted: state.completedWorksCount || 0
        })),
        count: stateSummaries.length
      });
    }
  } catch (error) {
    secureLogger.error('Error fetching state summary data', {
      category: 'controller',
      type: 'state_summary_fetch_error',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// Get MP-wise summary with pagination
const getMPSummary = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      state, 
      house,
      sortBy = 'utilizationPercentage',
      order = 'desc'
    } = req.query;
    
    // Build query
    const lsSel = getLsTermSelection(req);
    const baseConditions = [{ type: 'mp_summary' }];
    const searchTerm = typeof search === 'string' ? search.trim() : '';
    
    if (searchTerm) {
      // Escape regex special characters to prevent ReDoS attacks
      const escapedQuery = escapeRegex(searchTerm);
      const searchRegex = { $regex: escapedQuery, $options: 'i' };
      
      // Create flexible name search conditions for names like "modi narendra" vs "narendra modi"
      const buildNameSearchConditions = (fieldName) => {
        const words = searchTerm.split(/\s+/);
        const conditions = [];
        
        // Original query pattern
        conditions.push({ [fieldName]: searchRegex });
        
        // If we have exactly 2 words, add reversed pattern
        if (words.length === 2) {
          const reversedQuery = `${words[1]} ${words[0]}`;
          const reversedEscaped = escapeRegex(reversedQuery);
          conditions.push({ [fieldName]: { $regex: reversedEscaped, $options: 'i' } });
        }
        
        // Add individual word patterns (all words must be present in the field)
        if (words.length >= 2) {
          const wordConditions = words.map(word => ({
            [fieldName]: { $regex: escapeRegex(word.trim()), $options: 'i' }
          }));
          conditions.push({ $and: wordConditions });
        }
        
        return conditions;
      };

      baseConditions.push({
        $or: [
          ...buildNameSearchConditions('mpName'),
          { constituency: searchRegex },
          { state: searchRegex }
        ]
      });
    }
    
    if (state) {
      baseConditions.push({ state });
    }

    const houseFilter = (() => {
      if (house === 'Lok Sabha') {
        const termFilter = lsSel === 'both'
          ? { lsTerm: { $in: [17, 18] } }
          : { lsTerm: parseInt(lsSel, 10) };
        return { house: 'Lok Sabha', ...termFilter };
      }
      if (house === 'Rajya Sabha') {
        return { house: 'Rajya Sabha' };
      }
      // Treat explicit "Both Houses" the same as default (undefined)
      return { $or: buildMixedHouseOrFilter(lsSel) };
    })();
    baseConditions.push(houseFilter);

    const query = baseConditions.length === 1 ? baseConditions[0] : { $and: baseConditions };
    
    // Get total count
    const totalCount = await Summary.countDocuments(query);
    
    // Fetch MP summaries with pagination
    const mpSummaries = await Summary
      .find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    res.json({
      success: true,
      data: mpSummaries.map(mp => ({
        id: mp._id,
        mpName: mp.mpName,
        house: mp.house,
        state: mp.state,
        constituency: mp.constituency,
        allocatedAmount: mp.allocatedAmount || 0,
        totalExpenditure: mp.totalExpenditure || 0,
        utilizationPercentage: mp.utilizationPercentage || 0,
        completedWorksCount: mp.completedWorksCount || 0,
        recommendedWorksCount: mp.recommendedWorksCount || 0,
        completionRate: mp.completionRate || 0,
        pendingWorks: mp.pendingWorks || 0,
        unspentAmount: mp.unspentAmount || 0,
        // Additional metrics
        completedWorksValue: mp.completedWorksValue || 0,
        totalCompletedAmount: mp.totalCompletedAmount || 0,
        inProgressPayments: mp.inProgressPayments || 0,
        paymentGapPercentage: mp.paymentGapPercentage || 0
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    secureLogger.error('Error fetching MP summary data', {
      category: 'controller',
      type: 'mp_summary_fetch_error',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// Get constituency-wise summary for a state
const getConstituencySummary = async (req, res) => {
  try {
    const { state, limit = 50, sortBy = 'utilizationPercentage', order = 'desc' } = req.query;
    const lsSel = getLsTermSelection(req);
    
    if (!state) {
      return res.status(400).json({ 
        error: 'State parameter is required',
        message: 'Please provide a state name to get constituency summary' 
      });
    }

    // Get constituency data from MP summaries collection (pre-computed real data)
    const query = { type: 'mp_summary', state: state };
    query.$or = buildMixedHouseOrFilter(lsSel);
    
    const constituencyData = await Summary.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$constituency',
          mpName: { $first: '$mpName' },
          house: { $first: '$house' },
          totalAllocated: { $sum: '$allocatedAmount' },
          totalExpenditure: { $sum: '$totalExpenditure' },
          totalWorksCompleted: { $sum: '$completedWorksCount' },
          totalWorksRecommended: { $sum: '$recommendedWorksCount' },
          totalMPs: { $sum: 1 }
        }
      },
      {
        $addFields: {
          utilizationPercentage: {
            $cond: {
              if: { $or: [{ $eq: ['$totalAllocated', 0] }, { $eq: ['$totalAllocated', null] }] },
              then: 0,
              else: { $multiply: [{ $divide: ['$totalExpenditure', '$totalAllocated'] }, 100] }
            }
          },
          constituency: '$_id'
        }
      },
      { $sort: { [sortBy]: order === 'desc' ? -1 : 1 } },
      { $limit: parseInt(limit) }
    ]);

    // Calculate summary statistics
    const totalConstituencies = constituencyData.length;
    const totalAllocated = constituencyData.reduce((sum, c) => sum + (c.totalAllocated || 0), 0);
    const totalExpenditure = constituencyData.reduce((sum, c) => sum + (c.totalExpenditure || 0), 0);
    const totalWorks = constituencyData.reduce((sum, c) => sum + (c.totalWorksCompleted || 0), 0);
    const avgUtilization = totalConstituencies > 0 ? 
      constituencyData.reduce((sum, c) => sum + (c.utilizationPercentage || 0), 0) / totalConstituencies : 0;

    res.json({
      success: true,
      data: constituencyData.map(constituency => ({
        id: constituency._id,
        name: constituency.constituency,
        mpName: constituency.mpName,
        house: constituency.house,
        totalMPs: constituency.totalMPs || 0,
        totalAllocated: constituency.totalAllocated || 0,
        totalExpenditure: constituency.totalExpenditure || 0,
        utilizationPercentage: constituency.utilizationPercentage || 0,
        totalWorksCompleted: constituency.totalWorksCompleted || 0,
        totalWorksRecommended: constituency.totalWorksRecommended || 0
      })),
      summary: {
        totalConstituencies,
        totalAllocated,
        totalExpenditure,
        avgUtilization,
        totalWorks
      },
      count: constituencyData.length
    });
  } catch (error) {
    secureLogger.error('Error fetching constituency summary data', {
      category: 'controller',
      type: 'constituency_summary_fetch_error',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

module.exports = {
  getOverview,
  getStateSummary,
  getMPSummary,
  getConstituencySummary
};
