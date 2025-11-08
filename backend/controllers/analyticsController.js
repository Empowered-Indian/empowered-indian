const { Expenditure, WorksCompleted, Summary } = require('../models');
const { getLsTermSelection } = require('../utils/lsTerm');
const { escapeRegex } = require('../utils/validators');

// GET /api/analytics/trends - Time-based utilization trends
const getUtilizationTrends = async (req, res, next) => {
  try {
    const {
      start_year = 2014,
      end_year = new Date().getFullYear(),
      state,
      house,
      granularity = 'yearly' // yearly, quarterly, monthly
    } = req.query;

    // Build base match conditions (non-house filters)
    const matchConditions = {};
    if (state) matchConditions.state = new RegExp(escapeRegex(state), 'i');

    // Apply house/term gating consistently across pipelines
    const lsSel = getLsTermSelection(req);
    let houseGate;
    if (house === 'Lok Sabha') {
      houseGate = { house: 'Lok Sabha', lsTerm: lsSel === 'both' ? { $in: [17, 18] } : parseInt(lsSel, 10) };
    } else if (house === 'Rajya Sabha') {
      houseGate = { house: 'Rajya Sabha' };
    } else {
      // Both Houses or unspecified: mix RS + LS(term)
      houseGate = { $or: [ { house: 'Rajya Sabha' }, { house: 'Lok Sabha', lsTerm: lsSel === 'both' ? { $in: [17, 18] } : parseInt(lsSel, 10) } ] };
    }

    // Yearly utilization trends
    const yearlyTrends = await Expenditure.aggregate([
      { $match: { $and: [matchConditions, houseGate] } },
      { $project: {
          amount: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } },
          year: { $ifNull: ['$year', { $year: { $ifNull: ['$expenditureDate', '$date'] } }] },
          mp_id: 1
      }},
      { $match: { year: { $gte: parseInt(start_year), $lte: parseInt(end_year) } } },
      { $lookup: { from: 'mps', localField: 'mp_id', foreignField: '_id', as: 'mp_details' } },
      { $unwind: { path: '$mp_details', preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: {
            year: '$year',
            state: state ? '$mp_details.state' : null,
            house: house ? '$mp_details.house' : null
          },
          totalExpenditure: { $sum: '$amount' },
          uniqueMPs: { $addToSet: '$mp_id' },
          transactionCount: { $sum: 1 },
          avgExpenditurePerMP: { $avg: '$amount' }
      }},
      { $project: {
          year: '$_id.year',
          state: '$_id.state',
          house: '$_id.house',
          totalExpenditure: { $round: ['$totalExpenditure', 2] },
          uniqueMPCount: { $size: '$uniqueMPs' },
          transactionCount: 1,
          avgExpenditurePerMP: { $round: ['$avgExpenditurePerMP', 2] }
      }},
      { $sort: { year: 1 } }
    ]);

    // Monthly trends for the last 2 years (if granularity is monthly)
    let monthlyTrends = [];
    if (granularity === 'monthly') {
      monthlyTrends = await Expenditure.aggregate([
        { $match: { $and: [matchConditions, houseGate] } },
        { $project: {
            amount: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } },
            year: { $ifNull: ['$year', { $year: { $ifNull: ['$expenditureDate', '$date'] } }] },
            month: { $ifNull: ['$month', { $month: { $ifNull: ['$expenditureDate', '$date'] } }] }
        }},
        { $match: { year: { $gte: parseInt(end_year) - 1 } } },
        { $group: { _id: { year: '$year', month: '$month' }, totalExpenditure: { $sum: '$amount' }, transactionCount: { $sum: 1 } } },
        { $project: { year: '$_id.year', month: '$_id.month', totalExpenditure: { $round: ['$totalExpenditure', 2] }, transactionCount: 1 } },
        { $sort: { year: 1, month: 1 } }
      ]);
    }

    // Category-wise trends
    const categoryTrends = await Expenditure.aggregate([
      { $match: { $and: [matchConditions, houseGate] } },
      { $project: {
          amount: { $toDouble: { $ifNull: ['$expenditureAmount', '$amount'] } },
          year: { $ifNull: ['$year', { $year: { $ifNull: ['$expenditureDate', '$date'] } }] },
          category: { $ifNull: ['$category', '$expenditureCategory'] }
      }},
      { $match: { year: { $gte: parseInt(start_year), $lte: parseInt(end_year) } } },
      { $group: { _id: { year: '$year', category: '$category' }, totalExpenditure: { $sum: '$amount' }, transactionCount: { $sum: 1 } } },
      { $group: { _id: '$_id.category', yearlyData: { $push: { year: '$_id.year', totalExpenditure: { $round: ['$totalExpenditure', 2] }, transactionCount: '$transactionCount' } }, totalAcrossYears: { $sum: '$totalExpenditure' } } },
      { $sort: { totalAcrossYears: -1 } },
      { $limit: 10 }
    ]);

    // Works completion trends
    const worksTrends = await WorksCompleted.aggregate([
      { $match: { $and: [matchConditions, houseGate] } },
      { $project: {
          year: { $ifNull: ['$completion_year', { $year: { $ifNull: ['$completedDate', '$completion_date'] } }] },
          cost: { $toDouble: { $ifNull: ['$finalAmount', '$cost'] } },
          beneficiaries: { $toDouble: { $ifNull: ['$beneficiaries', 0] } }
      }},
      { $match: { year: { $gte: parseInt(start_year), $lte: parseInt(end_year) } } },
      { $group: { _id: '$year', totalWorksCompleted: { $sum: 1 }, totalCost: { $sum: '$cost' }, avgCostPerWork: { $avg: '$cost' }, totalBeneficiaries: { $sum: '$beneficiaries' } } },
      { $project: { year: '$_id', totalWorksCompleted: 1, totalCost: { $round: ['$totalCost', 2] }, avgCostPerWork: { $round: ['$avgCostPerWork', 2] }, totalBeneficiaries: 1 } },
      { $sort: { year: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        utilization: {
          yearly: yearlyTrends,
          monthly: monthlyTrends,
          categories: categoryTrends
        },
        works: worksTrends,
        period: {
          start_year: parseInt(start_year),
          end_year: parseInt(end_year),
          granularity
        },
        filters: {
          state,
          house
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/top-performers - Top performing MPs (term-aware via summaries)
const getTopPerformers = async (req, res, next) => {
  try {
    const {
      top_n = 10,
      state,
      house,
      metric = 'utilization', // utilization, expenditure, works_completed
      year,
    } = req.query;

    // Build term-aware match on summaries (mp_summary)
    const match = { type: 'mp_summary' };
    if (state) match.state = new RegExp(escapeRegex(state), 'i');
    if (house === 'Lok Sabha') {
      const sel = getLsTermSelection(req);
      Object.assign(match, { house: 'Lok Sabha' }, sel === 'both' ? { lsTerm: { $in: [17, 18] } } : { lsTerm: parseInt(sel, 10) });
    } else if (house === 'Rajya Sabha') {
      Object.assign(match, { house: 'Rajya Sabha' });
    }

    // Map metric to summary fields
    const metricMap = {
      utilization: 'utilizationPercentage',
      expenditure: 'totalExpenditure',
      works_completed: 'completedWorksCount'
    };
    const sortField = metricMap[metric] || metricMap.utilization;

    const topPerformers = await Summary.find(match)
      .select('mpName constituency state house utilizationPercentage totalExpenditure completedWorksCount allocatedAmount')
      .sort({ [sortField]: -1 })
      .limit(parseInt(top_n))
      .lean();

    // Comparison stats over the filtered set
    const comparisonAgg = await Summary.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avgUtilization: { $avg: { $ifNull: ['$utilizationPercentage', 0] } },
          totalMPs: { $sum: 1 },
          avgAllocation: { $avg: { $ifNull: ['$allocatedAmount', 0] } },
          avgExpenditure: { $avg: { $ifNull: ['$totalExpenditure', 0] } }
        }
      }
    ]);

    // State-wise top performer (by chosen metric)
    const stateWiseTopPerformers = await Summary.aggregate([
      { $match: match },
      { $addFields: { _metric: { $ifNull: ['$' + sortField, 0] } } },
      { $sort: { state: 1, _metric: -1 } },
      {
        $group: {
          _id: '$state',
          top: { $first: '$$ROOT' },
          avgUtilization: { $avg: { $ifNull: ['$utilizationPercentage', 0] } },
          totalMPs: { $sum: 1 }
        }
      },
      { $sort: { 'top._metric': -1 } }
    ]);

    res.json({
      success: true,
      data: {
        topPerformers,
        comparisonStats: comparisonAgg[0] || {},
        stateWiseTopPerformers,
        metric,
        parameters: { top_n: parseInt(top_n), state, house, year },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/performance-distribution - Distribution (term-aware via summaries)
const getPerformanceDistribution = async (req, res, next) => {
  try {
    const { state, house } = req.query;

    // Term-aware match on summaries
    const match = { type: 'mp_summary' };
    if (state) match.state = new RegExp(escapeRegex(state), 'i');
    const sel = getLsTermSelection(req);
    if (house === 'Lok Sabha') {
      Object.assign(match, { house: 'Lok Sabha' }, sel === 'both' ? { lsTerm: { $in: [17, 18] } } : { lsTerm: parseInt(sel, 10) });
    } else if (house === 'Rajya Sabha') {
      Object.assign(match, { house: 'Rajya Sabha' });
    } else {
      // Default when house unspecified: include RS + LS(selected term; defaults to 18)
      Object.assign(match, {
        $or: [
          { house: 'Rajya Sabha' },
          { house: 'Lok Sabha', ...(sel === 'both' ? { lsTerm: { $in: [17, 18] } } : { lsTerm: parseInt(sel, 10) }) }
        ]
      });
    }

    // Utilization distribution buckets (over summaries)
    const utilizationDistribution = await Summary.aggregate([
      { $match: match },
      {
        $bucket: {
          groupBy: { $ifNull: ['$utilizationPercentage', 0] },
          boundaries: [0, 25, 50, 75, 90, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
            avgUtilization: { $avg: { $ifNull: ['$utilizationPercentage', 0] } },
            avgAllocation: { $avg: { $ifNull: ['$allocatedAmount', 0] } },
            avgExpenditure: { $avg: { $ifNull: ['$totalExpenditure', 0] } }
          }
        }
      }
    ]);

    // House-wise comparison (if not filtered by house)
    let houseComparison = [];
    if (!house) {
      houseComparison = await Summary.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$house',
            avgUtilization: { $avg: { $ifNull: ['$utilizationPercentage', 0] } },
            totalMPs: { $sum: 1 },
            totalAllocation: { $sum: { $ifNull: ['$allocatedAmount', 0] } },
            totalExpenditure: { $sum: { $ifNull: ['$totalExpenditure', 0] } }
          }
        },
        {
          $project: {
            house: '$_id',
            house_hi: '$_id',
            avgUtilization: { $round: ['$avgUtilization', 2] },
            totalMPs: 1,
            totalAllocation: { $round: ['$totalAllocation', 2] },
            totalExpenditure: { $round: ['$totalExpenditure', 2] }
          }
        }
      ]);
    }

    res.json({
      success: true,
      data: {
        utilizationDistribution,
        houseComparison,
        filters: {
          state,
          house,
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUtilizationTrends,
  getTopPerformers,
  getPerformanceDistribution
};
