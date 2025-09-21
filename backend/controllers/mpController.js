const { MP, Summary, Expenditure, WorksCompleted, WorksRecommended } = require('../models');
const { getLsTermSelection } = require('../utils/lsTerm');
const mongoose = require('mongoose');
const { escapeRegex, validatePagination, isValidObjectId } = require('../utils/validators');

// GET /api/mps/:id - Individual MP details
const getMPDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // First try to find in Summary collection by ID
    let mpSummary = null;
    if (isValidObjectId(id)) {
      mpSummary = await Summary.findOne({ _id: id, type: 'mp_summary' });
    }
    
    // If not found in Summary, fallback to MP collection
    let mp = null;
    if (!mpSummary && isValidObjectId(id)) {
      mp = await MP.findById(id);
    }
    
    if (!mpSummary && !mp) {
      return res.status(404).json({
        success: false,
        error: 'MP not found'
      });
    }
    
    // Use summary data if available, otherwise use MP data
    const mpData = mpSummary || mp;
    const mpId = mp ? mp._id.toString() : null;
    const mpName = mpSummary ? mpSummary.mpName : mp.name;
    const mpConstituency = mpSummary ? mpSummary.constituency : mp.constituency;
    const mpState = mpSummary ? mpSummary.state : mp.state;
    const mpHouse = mpSummary ? mpSummary.house : mp?.house;
    const lsSel = getLsTermSelection(req);

    // Get expenditure details for this MP
    // Build an expenditure match that supports either mp_id or mpName+constituency
    const expOrClauses = [];
    if (mpId) expOrClauses.push({ mp_id: mpId });
    expOrClauses.push({ mpName: mpName, constituency: mpConstituency });
    const expenditureMatch = expOrClauses.length > 1 ? { $or: expOrClauses } : expOrClauses[0];
    // Constrain to this MP's house and LS term if applicable
    if (mpHouse) {
      expenditureMatch.house = mpHouse;
      if (mpHouse === 'Lok Sabha') {
        Object.assign(expenditureMatch, lsSel === 'both' ? { lsTerm: { $in: [17, 18] } } : { lsTerm: parseInt(lsSel, 10) });
      }
    }

    const expenditureStats = await Expenditure.aggregate([
      { $match: expenditureMatch },
      { $limit: 10000 }, // Prevent memory issues with large datasets
      {
        $group: {
          _id: null,
          totalExpenditure: { $sum: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } },
          totalEntries: { $sum: 1 },
          avgExpenditure: { $avg: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } },
          categories: { $addToSet: '$category' }
        }
      }
    ]);

    // Get yearly expenditure trend
    const yearlyExpenditure = await Expenditure.aggregate([
      { $match: expenditureMatch },
      { $limit: 10000 }, // Prevent memory issues
      {
        $group: {
          _id: { $ifNull: ['$year', { $year: { $ifNull: ['$expenditureDate', '$date'] } }] },
          totalAmount: { $sum: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 20 } // Limit to 20 years of data
    ]);

    // Get category-wise expenditure
    const categoryExpenditure = await Expenditure.aggregate([
      { $match: expenditureMatch },
      { $limit: 10000 }, // Prevent memory issues
      {
        $group: {
          _id: { $ifNull: ['$category', '$expenditureCategory'] },
          totalAmount: { $sum: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 50 } // Limit to top 50 categories
    ]);

    // Get works statistics - use exact match for mpName and constituency since works data doesn't have mp_id field
    const worksCountQuery = {
      mpName: mpName,
      constituency: mpConstituency
    };
    if (mpHouse) {
      worksCountQuery.house = mpHouse;
      if (mpHouse === 'Lok Sabha') {
        worksCountQuery.lsTerm = lsSel === 'both' ? { $in: [17, 18] } : parseInt(lsSel, 10);
      }
    }
    
    const [completedWorksCount, recommendedWorksCount] = await Promise.all([
      WorksCompleted.countDocuments(worksCountQuery),
      WorksRecommended.countDocuments(worksCountQuery)
    ]);

    // Get recent works
    const recentWorks = await WorksCompleted.find(worksCountQuery)
      .sort({ completedDate: -1 })
      .limit(5)
      .select('workDescription finalAmount completedDate workCategory');

    res.json({
      success: true,
      data: {
        mp: {
          id: mpSummary ? mpSummary._id : mp._id,
          name: mpName,
          constituency: mpConstituency,
          state: mpState,
          house: mpSummary ? mpSummary.house : mp?.house,
          allocatedAmount: mpSummary ? mpSummary.allocatedAmount : mp?.allocated_limit,
          totalExpenditure: mpSummary ? mpSummary.totalExpenditure : expenditureStats[0]?.totalExpenditure || 0,
          utilizationPercentage: mpSummary ? mpSummary.utilizationPercentage : 
            (() => {
              const totalExpenditure = expenditureStats[0]?.totalExpenditure || 0;
              const allocatedAmount = mpSummary?.allocatedAmount || mp?.allocated_limit || 0;
              
              // Guard against division by zero
              if (allocatedAmount === 0) {
                return totalExpenditure > 0 ? 100 : 0; // 100% if spent without allocation, 0% if nothing spent
              }
              
              const percentage = (totalExpenditure / allocatedAmount) * 100;
              // Cap at 100% for display purposes, but allow over-spending to be tracked
              return Math.min(percentage, 999.99); // Cap at 999.99% to avoid display issues
            })(),
          completedWorksCount: mpSummary ? mpSummary.completedWorksCount : completedWorksCount,
          recommendedWorksCount: mpSummary ? mpSummary.recommendedWorksCount : recommendedWorksCount,
          // Additional metrics
          completedWorksValue: mpSummary?.completedWorksValue || mpSummary?.totalCompletedAmount || 0,
          inProgressPayments: mpSummary?.inProgressPayments || 0,
          paymentGapPercentage: mpSummary?.paymentGapPercentage || 0,
          completionRate: mpSummary?.completionRate || ((completedWorksCount / ((completedWorksCount + recommendedWorksCount) || 1)) * 100),
          pendingWorks: mpSummary?.pendingWorks || (recommendedWorksCount - completedWorksCount),
          unspentAmount: mpSummary?.unspentAmount || 0,
          totalRecommendedAmount: mpSummary?.totalRecommendedAmount || 0,
          name_hi: mpName, // Placeholder for Hindi translation
          constituency_hi: mpConstituency,
          state_hi: mpState
        },
        expenditure: {
          summary: expenditureStats[0] || {
            totalExpenditure: 0,
            totalEntries: 0,
            avgExpenditure: 0,
            categories: []
          },
          yearlyTrend: yearlyExpenditure,
          categoryBreakdown: categoryExpenditure
        },
        works: {
          completedCount: completedWorksCount,
          recommendedCount: recommendedWorksCount,
          recentCompleted: recentWorks
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/mplads/mps/:id/works - MP works data
const getMPWorks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'all', category, has_payments } = req.query;

    // First try to find in Summary collection by ID
    let mpSummary = null;
    if (isValidObjectId(id)) {
      mpSummary = await Summary.findOne({ _id: id, type: 'mp_summary' });
    }
    
    // If not found in Summary, fallback to MP collection
    let mp = null;
    if (!mpSummary && isValidObjectId(id)) {
      mp = await MP.findById(id);
    }
    
    if (!mpSummary && !mp) {
      return res.status(404).json({
        success: false,
        error: 'MP not found'
      });
    }
    
    // Use MP name and constituency to find works
    const mpName = mpSummary ? mpSummary.mpName : mp.name;
    const mpConstituency = mpSummary ? mpSummary.constituency : mp.constituency;
    const mpHouse = mpSummary ? mpSummary.house : mp?.house;
    const lsSel = getLsTermSelection(req);
    const mpId = mp ? mp._id.toString() : null;

    // Validate and sanitize pagination
    const { page, limit, skip } = validatePagination(req.query.page || 1, req.query.limit || 50000);
    let works = [];
    let totalCount = 0;
    let totalCost = 0;

    // Build category filter - works data uses 'workCategory' field
    const categoryFilter = category ? { workCategory: { $regex: escapeRegex(category), $options: 'i' } } : {};
    
    // Build works query - use exact match for mpName and constituency (works data doesn't have mp_id field)
    const worksQuery = {
      mpName: mpName,
      constituency: mpConstituency
    };
    if (mpHouse) {
      worksQuery.house = mpHouse;
      if (mpHouse === 'Lok Sabha') {
        worksQuery.lsTerm = lsSel === 'both' ? { $in: [17, 18] } : parseInt(lsSel, 10);
      }
    }

    if (status === 'completed' || status === 'all') {
      const completedWorks = await WorksCompleted.find({ 
        ...worksQuery,
        ...categoryFilter
      })
      .sort({ completedDate: -1 })
      .skip(status === 'completed' ? skip : 0)
      .limit(status === 'completed' ? parseInt(limit) : Math.floor(parseInt(limit) / 2))
      .lean();

      works = works.concat(completedWorks.map(work => ({
        ...work,
        status: 'completed',
        date: work.completedDate
      })));

      if (status === 'completed') {
        const completedStats = await WorksCompleted.aggregate([
          { $match: { ...worksQuery, ...categoryFilter } },
          { $group: {
              _id: null,
              totalCount: { $sum: 1 },
              totalCost: { $sum: { $toDouble: { $ifNull: ['$finalAmount', 0] } } }
          }}
        ]);
        const stats = completedStats[0] || { totalCount: 0, totalCost: 0 };
        totalCount = stats.totalCount;
        totalCost = stats.totalCost;
      }
    }

    if (status === 'recommended' || status === 'all') {
      // Use aggregation pipeline to filter out works that exist in completed collection
      const recommendedWorksAggregation = [
        { $match: { ...worksQuery, ...categoryFilter } },
        // Remove works that exist in completed with same workId
        { $lookup: {
            from: 'works_completed',
            let: { workId: '$workId', mpName: mpName, constituency: mpConstituency, house: mpHouse, lsTerm: (mpHouse === 'Lok Sabha' ? (lsSel === 'both' ? { $literal: [17, 18] } : parseInt(lsSel, 10)) : null) },
            pipeline: [
              { $match: { 
                $expr: { 
                  $and: [
                    { $eq: ['$workId', '$$workId'] },
                    { $eq: ['$mpName', '$$mpName'] },
                    { $eq: ['$constituency', '$$constituency'] },
                    ...(mpHouse ? [{ $eq: ['$house', '$$house'] }] : []),
                    ...(mpHouse === 'Lok Sabha' ? [
                      // If both, allow in [17,18]; else exact
                      { $cond: [
                        { $isArray: '$$lsTerm' },
                        { $in: ['$lsTerm', '$$lsTerm'] },
                        { $eq: ['$lsTerm', '$$lsTerm'] }
                      ] }
                    ] : [])
                  ]
                }
              }}
            ],
            as: 'completedMatch'
        }},
        { $match: { completedMatch: { $size: 0 } } }, // Only works NOT in completed
        // Attach payments summary via single lookup (avoids N+1)
        {
          $lookup: {
            from: 'expenditures',
            let: { workId: '$workId', house: '$house', lsTerm: '$lsTerm' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$workId', '$$workId'] },
                      { $eq: ['$paymentStatus', 'Payment Success'] },
                      { $eq: ['$house', '$$house'] },
                      { $eq: [ { $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] } ] }
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  totalPaid: { $sum: { $toDouble: { $ifNull: ['$expenditureAmount', 0] } } },
                  paymentCount: { $sum: 1 }
                }
              }
            ],
            as: 'payment_data'
          }
        },
        {
          $project: {
            mpName: 1,
            constituency: 1,
            house: 1,
            lsTerm: 1,
            workId: 1,
            workDescription: 1,
            workCategory: 1,
            recommendationDate: 1,
            recommendedAmount: 1,
            state: 1,
            ida: 1,
            // Payment fields
            hasPayments: { $gt: [{ $size: '$payment_data' }, 0] },
            totalPaid: { $ifNull: [{ $arrayElemAt: ['$payment_data.totalPaid', 0] }, 0] },
            paymentCount: { $ifNull: [{ $arrayElemAt: ['$payment_data.paymentCount', 0] }, 0] }
          }
        },
        { $sort: { recommendationDate: -1 } }
      ];

      // If payment filter requested, apply it now and then paginate
      if (has_payments !== undefined) {
        const want = (has_payments === 'true' || has_payments === '1');
        recommendedWorksAggregation.push({ $match: { hasPayments: want } });
      }

      // Apply pagination depending on status
      if (status === 'recommended') {
        recommendedWorksAggregation.push(
          { $skip: skip },
          { $limit: parseInt(limit) }
        );
      } else {
        // For 'all' status, limit recommended half-page (completed gets the other half)
        recommendedWorksAggregation.push(
          { $limit: Math.floor(parseInt(limit) / 2) }
        );
      }

      const recommendedWorks = await WorksRecommended.aggregate(recommendedWorksAggregation);
      // Compose works list with status/date unified
      works = works.concat(recommendedWorks.map(w => ({
        ...w,
        status: 'recommended',
        date: w.recommendationDate
      })));

      if (status === 'recommended') {
        // Calculate correct total count and cost after deduplication
        const statsAggregation = [
          { $match: { ...worksQuery, ...categoryFilter } },
          { $lookup: {
              from: 'works_completed',
              let: { workId: '$workId' },
              pipeline: [
                { $match: { 
                  $expr: { 
                    $and: [
                      { $eq: ['$workId', '$$workId'] },
                      { $eq: ['$mpName', mpName] },
                      { $eq: ['$constituency', mpConstituency] }
                    ]
                  }
                }}
              ],
              as: 'completedMatch'
          }},
          { $match: { completedMatch: { $size: 0 } } },
          // Include payment filtering in stats if requested
          ...(has_payments !== undefined ? [{
            $lookup: {
              from: 'expenditures',
              let: { workId: '$workId', house: '$house', lsTerm: '$lsTerm' },
              pipeline: [
                { $match: { $expr: { $and: [
                  { $eq: ['$workId', '$$workId'] },
                  { $eq: ['$paymentStatus', 'Payment Success'] },
                  { $eq: ['$house', '$$house'] },
                  { $eq: [ { $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] } ] }
                ] } } }
              ],
              as: 'payment_data'
            }
          }, { $addFields: { hasPayments: { $gt: [{ $size: '$payment_data' }, 0] } } }, { $match: { hasPayments: (has_payments === 'true' || has_payments === '1') } }] : []),
          { $group: {
              _id: null,
              totalCount: { $sum: 1 },
              totalCost: { $sum: { $toDouble: { $ifNull: ['$recommendedAmount', 0] } } }
          }}
        ];
        
        const statsResult = await WorksRecommended.aggregate(statsAggregation);
        const stats = statsResult[0] || { totalCount: 0, totalCost: 0 };
        
        totalCount = stats.totalCount;
        totalCost = stats.totalCost;
      }
    }

    if (status === 'all') {
      // Calculate proper total count for all works
      const completedCountPromise = WorksCompleted.countDocuments({ ...worksQuery, ...categoryFilter });
      const recommendedCountPromise = WorksRecommended.aggregate([
        { $match: { ...worksQuery, ...categoryFilter } },
        {
          $lookup: {
            from: 'works_completed',
            let: { workId: '$workId', house: '$house', lsTerm: '$lsTerm' },
            pipeline: [
              { $match: { $expr: { $and: [
                { $eq: ['$workId', '$$workId'] },
                { $eq: ['$house', '$$house'] },
                { $eq: [ { $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] } ] }
              ] } } }
            ],
            as: 'completedMatch'
          }
        },
        { $match: { completedMatch: { $size: 0 } } },
        { $count: 'total' }
      ]).then(r => r[0]?.total || 0);

      const [completedCount, recommendedCount] = await Promise.all([
        completedCountPromise,
        recommendedCountPromise
      ]);
      totalCount = completedCount + recommendedCount;
      // Sort combined works list by date and paginate
      works = works.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(skip, skip + parseInt(limit));
    }

    // Apply payment filtering if requested
    if (has_payments !== undefined && status === 'recommended') {
      const hasPaymentsBool = has_payments === 'true' || has_payments === '1';
      const filteredWorks = works.filter(work => 
        hasPaymentsBool ? work.hasPayments : !work.hasPayments
      );
      
      // Update counts and costs to reflect filtered results
      totalCount = filteredWorks.length;
      totalCost = filteredWorks.reduce((sum, work) => 
        sum + (work.recommendedAmount || work.estimated_cost || 0), 0
      );
      
      // Now apply pagination to the filtered results
      const startIndex = skip;
      const endIndex = skip + parseInt(limit);
      works = filteredWorks.slice(startIndex, endIndex);
    }

    res.json({
      success: true,
      data: {
        works,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalCount: totalCount,
          pages: Math.ceil(totalCount / limit),
          currentPage: parseInt(page),
          hasNext: parseInt(page) < Math.ceil(totalCount / limit),
          hasPrev: parseInt(page) > 1
        },
        summary: {
          totalCost: totalCost,
          totalWorks: totalCount
        },
        filters: {
          status,
          category: category || 'all'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/mplads/search?q=:query - Search MPs (robust: Summary + MP collections)
const searchMPs = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    // Validate and sanitize pagination
    const { page, limit, skip } = validatePagination(req.query.page || 1, req.query.limit || 20);
    
    // Escape regex special characters to prevent ReDoS attacks
    const escapedQuery = escapeRegex(q.trim());
    const searchRegex = { $regex: escapedQuery, $options: 'i' };
    
    // Create flexible name search conditions for names like "modi narendra" vs "narendra modi"
    const buildNameSearchConditions = (fieldName) => {
      const words = q.trim().split(/\s+/);
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

    // Build search queries for both collections with flexible name matching
    const mpQuery = {
      $or: [
        ...buildNameSearchConditions('name'),
        { constituency: searchRegex },
        { state: searchRegex }
      ]
    };

    const summaryQuery = {
      type: 'mp_summary',
      $or: [
        ...buildNameSearchConditions('mpName'),
        { constituency: searchRegex },
        { state: searchRegex }
      ]
    };
    // Term-aware gating: respect house filter if provided
    const houseParam = req.query.house;
    const lsSelSearch = getLsTermSelection(req);
    if (houseParam === 'Lok Sabha') {
      summaryQuery.house = 'Lok Sabha';
      summaryQuery.lsTerm = lsSelSearch === 'both' ? { $in: [17, 18] } : parseInt(lsSelSearch, 10);
    } else if (houseParam === 'Rajya Sabha') {
      summaryQuery.house = 'Rajya Sabha';
    } else {
      // Mixed case: include RS + LS(term)
      const lsGateSearch = { $or: [ { house: 'Rajya Sabha' }, { house: 'Lok Sabha', lsTerm: lsSelSearch === 'both' ? { $in: [17, 18] } : parseInt(lsSelSearch, 10) } ] };
      summaryQuery.$and = [lsGateSearch];
    }

    // Prefer Summary collection (fresher, denormalized), then fill from MP
    const summaryDocs = await Summary.find(summaryQuery)
      .select('_id mpName constituency state house allocatedAmount')
      .sort({ mpName: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Build a de-duplication key based on entity identity rather than document _id
    // since the same MP exists in both Summary and MP collections with different _ids
    const buildEntityKey = (name, constituency, state) => {
      const normalize = (v) => (v || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
      return [normalize(name), normalize(constituency), normalize(state)].join('|');
    };

    const summaryKeys = new Set(
      summaryDocs.map(d => buildEntityKey(d.mpName, d.constituency, d.state))
    );

    // If we did not reach the limit with Summary, fetch from MP collection
    const remaining = Math.max(parseInt(limit) - summaryDocs.length, 0);
    let mpDocs = [];
    if (remaining > 0) {
      mpDocs = await MP.find(mpQuery)
        .select('_id name constituency state house allocated_limit')
        .sort({ name: 1 })
        .limit(remaining)
        .lean();
    }

    // Normalize and merge results (avoid duplicates)
    const normalizedFromSummary = summaryDocs.map(d => ({
      _id: d._id,
      name: d.mpName,
      constituency: d.constituency,
      state: d.state,
      house: d.house,
      allocated_limit: d.allocatedAmount,
      source: 'summary'
    }));

    // Filter out MPs that are already present in Summary by entity identity
    const normalizedFromMP = mpDocs
      .filter(d => !summaryKeys.has(buildEntityKey(d.name, d.constituency, d.state)))
      .map(d => ({
        _id: d._id,
        name: d.name,
        constituency: d.constituency,
        state: d.state,
        house: d.house,
        allocated_limit: d.allocated_limit,
        source: 'mp'
      }));

    let merged = [...normalizedFromSummary, ...normalizedFromMP];

    // Extra safety: de-duplicate the merged array by the same entity key
    const seen = new Set();
    merged = merged.filter(item => {
      const key = buildEntityKey(item.name, item.constituency, item.state);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Compute an approximate total (use Summary count primarily, then add MP count)
    const [summaryCount, mpCount] = await Promise.all([
      Summary.countDocuments(summaryQuery),
      MP.countDocuments(mpQuery)
    ]);
    const totalCount = summaryCount + mpCount;

    res.json({
      success: true,
      data: {
        mps: merged,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        query: q
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/mplads/constituencies/:id - Constituency details
const getConstituencyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find MP by constituency name
  const mp = await MP.findOne({ 
      $or: [
        { constituency: { $regex: escapeRegex(id), $options: 'i' } },
        { _id: isValidObjectId(id) ? id : null }
      ]
    });

    if (!mp) {
      return res.status(404).json({
        success: false,
        error: 'Constituency not found'
      });
    }

    // Term-aware gating
    const sel = getLsTermSelection(req);
    const lsGate = mp.house === 'Lok Sabha'
      ? (sel === 'both' ? { lsTerm: { $in: [17, 18] } } : { lsTerm: parseInt(sel, 10) })
      : {};

    // Get expenditure data for this constituency (mp_id or name+constituency) + house/term gating
    const consExpMatch = { $and: [
      { $or: [
          { mp_id: mp._id.toString() },
          { mpName: mp.name, constituency: mp.constituency }
        ]
      },
      { house: mp.house },
      lsGate
    ]};
    const expenditureData = await Expenditure.aggregate([
      { $match: consExpMatch },
      { $limit: 10000 }, // Prevent memory issues
      {
        $group: {
          _id: null,
          totalExpenditure: { $sum: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } },
          transactionCount: { $sum: 1 },
          avgTransaction: { $avg: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } }
        }
      }
    ]);

    // Get works data (respect house/term)
    const worksFilterBase = { mpName: mp.name, constituency: mp.constituency, house: mp.house, ...(mp.house === 'Lok Sabha' ? lsGate : {}) };
    const [completedWorks, recommendedWorks] = await Promise.all([
      WorksCompleted.countDocuments(worksFilterBase),
      WorksRecommended.countDocuments(worksFilterBase)
    ]);

    // Allocation (from summaries, term-aware)
    const summaryMatch = { type: 'mp_summary', mpName: mp.name, constituency: mp.constituency, house: mp.house, ...(mp.house === 'Lok Sabha' ? lsGate : {}) };
    const mpSummaryOne = await Summary.findOne(summaryMatch).select('allocatedAmount').lean();
    const allocatedAmount = mpSummaryOne?.allocatedAmount || 0;

    res.json({
      success: true,
      data: {
        constituency: {
          name: mp.constituency,
          state: mp.state,
          mp: {
            name: mp.name,
            house: mp.house
          },
          allocatedLimit: allocatedAmount
        },
        performance: {
          expenditure: expenditureData[0] || {
            totalExpenditure: 0,
            transactionCount: 0,
            avgTransaction: 0
          },
          works: {
            completed: completedWorks,
            recommended: recommendedWorks,
            completionRate: (completedWorks + recommendedWorks) > 0 ? (completedWorks / (completedWorks + recommendedWorks) * 100) : 0
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/mplads/sectors - Sector-wise allocation data
const getSectorWiseData = async (req, res, next) => {
  try {
    const { house } = req.query;

    // Build query for house filter (ignore 'Both Houses')
    let mpQuery = {};
    if (house === 'Lok Sabha' || house === 'Rajya Sabha') {
      mpQuery.house = house;
    }

    // Get all MPs matching the filter
  const mps = await MP.find(mpQuery).select('_id name constituency').lean();
  const mpIds = mps.map(mp => mp._id.toString());
  const mpNames = mps.map(mp => mp.name);

    // Get sector-wise expenditure data
    const selSec = getLsTermSelection(req);
    const lsGateSec = house === 'Lok Sabha' ? { lsTerm: selSec === 'both' ? { $in: [17, 18] } : parseInt(selSec, 10) } : {};

    const sectorExpenditure = await Expenditure.aggregate([
      { $match: { mp_id: { $in: mpIds }, ...(house ? { house } : {}), ...lsGateSec } },
      { $limit: 50000 }, // Higher limit for multiple MPs
      {
        $group: {
          _id: { $ifNull: ['$category', '$expenditureCategory'] },
          totalAmount: { $sum: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 100 } // Limit to top 100 sectors
    ]);

    // Get sector-wise works data
    const sectorWorks = await WorksCompleted.aggregate([
      { $match: { mpName: { $in: mpNames }, ...(house ? { house } : {}), ...lsGateSec } },
      { $limit: 50000 }, // Higher limit for multiple MPs
      {
        $group: {
          _id: { $ifNull: ['$workCategory', '$category'] },
          worksCount: { $sum: 1 },
          totalCost: { $sum: { $toDouble: { $ifNull: ['$finalAmount', '$cost'] } } },
          avgCost: { $avg: { $toDouble: { $ifNull: ['$finalAmount', '$cost'] } } }
        }
      },
      { $sort: { worksCount: -1 } },
      { $limit: 100 } // Limit to top 100 sectors
    ]);

    // Merge expenditure and works data
    const sectors = {};
    
    sectorExpenditure.forEach(sector => {
      sectors[sector._id] = {
        name: sector._id,
        expenditure: {
          total: sector.totalAmount,
          transactions: sector.transactionCount,
          average: sector.avgAmount
        },
        works: {
          count: 0,
          totalCost: 0,
          avgCost: 0
        }
      };
    });

    sectorWorks.forEach(sector => {
      if (sectors[sector._id]) {
        sectors[sector._id].works = {
          count: sector.worksCount,
          totalCost: sector.totalCost,
          avgCost: sector.avgCost
        };
      } else {
        sectors[sector._id] = {
          name: sector._id,
          expenditure: {
            total: 0,
            transactions: 0,
            average: 0
          },
          works: {
            count: sector.worksCount,
            totalCost: sector.totalCost,
            avgCost: sector.avgCost
          }
        };
      }
    });

    res.json({
      success: true,
      data: {
        sectors: Object.values(sectors),
        summary: {
          totalSectors: Object.keys(sectors).length,
          filters: { house: house || 'all' }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/mplads/trends - Year-wise expenditure trends
const getYearWiseTrends = async (req, res, next) => {
  try {
    const { house, state } = req.query;

    // Build MP query for filters
    let mpQuery = {};
    if (house) mpQuery.house = house;
    if (state) mpQuery.state = { $regex: escapeRegex(state), $options: 'i' };

    // Get filtered MPs
  const mps = await MP.find(mpQuery).select('_id name house').lean();
  const mpIds = mps.map(mp => mp._id.toString());
  const mpNames = mps.map(mp => mp.name);
  const selTrend = getLsTermSelection(req);
  const lsGateTrend = { $or: [ { house: 'Rajya Sabha' }, { house: 'Lok Sabha', lsTerm: selTrend === 'both' ? { $in: [17, 18] } : parseInt(selTrend, 10) } ] };

    // Get year-wise expenditure trends
    const yearlyTrends = await Expenditure.aggregate([
      { $match: { $and: [ { $or: [ { mp_id: { $in: mpIds } }, { mpName: { $in: mpNames } } ] }, lsGateTrend ] } },
      { $limit: 100000 }, // Higher limit for trend analysis
      {
        $group: {
          _id: { $ifNull: ['$year', { $year: { $ifNull: ['$expenditureDate', '$date'] } }] },
          totalExpenditure: { $sum: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } },
          transactionCount: { $sum: 1 },
          avgExpenditure: { $avg: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } } },
          uniqueMPs: { $addToSet: '$mp_id' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 50 } // Limit to 50 years of data
    ]);

    // Get year-wise works completion trends
    const worksTrends = await WorksCompleted.aggregate([
      { $match: { $and: [ { mpName: { $in: mpNames } }, lsGateTrend ] } },
      { $limit: 100000 }, // Higher limit for trend analysis
      {
        $project: {
          year: { $year: { $ifNull: ['$completedDate', { $dateFromString: { dateString: '$completion_date' } }] } },
          amount: { $toDouble: { $ifNull: ['$finalAmount', '$cost'] } }
        }
      },
      {
        $group: {
          _id: '$year',
          worksCompleted: { $sum: 1 },
          totalCost: { $sum: '$amount' },
          avgCost: { $avg: '$amount' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 50 } // Limit to 50 years of data
    ]);

    // Merge trends data
    const trendsByYear = {};
    
    yearlyTrends.forEach(trend => {
      trendsByYear[trend._id] = {
        year: trend._id,
        expenditure: {
          total: trend.totalExpenditure,
          transactions: trend.transactionCount,
          average: trend.avgExpenditure,
          activeMPs: trend.uniqueMPs.length
        },
        works: {
          completed: 0,
          totalCost: 0,
          avgCost: 0
        }
      };
    });

    worksTrends.forEach(trend => {
      if (trendsByYear[trend._id]) {
        trendsByYear[trend._id].works = {
          completed: trend.worksCompleted,
          totalCost: trend.totalCost,
          avgCost: trend.avgCost
        };
      }
    });

    const trends = Object.values(trendsByYear).sort((a, b) => a.year - b.year);

    res.json({
      success: true,
      data: {
        trends,
        summary: {
          totalYears: trends.length,
          filters: {
            house: house || 'all',
            state: state || 'all'
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMPDetails,
  getMPWorks,
  searchMPs,
  getConstituencyDetails,
  getSectorWiseData,
  getYearWiseTrends
};

// GET /api/mplads/terms - Available Lok Sabha terms with counts
async function getAvailableTerms(req, res, next) {
  try {
    const terms = await Summary.aggregate([
      { $match: { type: 'mp_summary', house: 'Lok Sabha' } },
      { $group: { _id: '$lsTerm', mpCount: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const details = await Promise.all(terms.map(async t => {
      const term = t._id;
      const [allocs, exps, wc, wr] = await Promise.all([
        mongoose.connection.collection('allocations').countDocuments({ house: 'Lok Sabha', lsTerm: term }),
        mongoose.connection.collection('expenditures').countDocuments({ house: 'Lok Sabha', lsTerm: term }),
        mongoose.connection.collection('works_completed').countDocuments({ house: 'Lok Sabha', lsTerm: term }),
        mongoose.connection.collection('works_recommended').countDocuments({ house: 'Lok Sabha', lsTerm: term })
      ]);
      return {
        lsTerm: term,
        mps: t.mpCount,
        allocations: allocs,
        expenditures: exps,
        worksCompleted: wc,
        worksRecommended: wr
      };
    }));

    res.json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
}

module.exports.getAvailableTerms = getAvailableTerms;
