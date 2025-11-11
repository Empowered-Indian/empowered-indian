const { getCollection } = require('../utils/database')
const { Parser } = require('json2csv')
const { secureLogger } = require('../utils/logger')
const { getLsTermSelection } = require('../utils/lsTerm')
const { escapeRegex } = require('../utils/validators')

// Export completed works as CSV
const exportCompletedWorksCSV = async (req, res) => {
  try {
    const { mp_id, state, district, category, year, min_cost, max_cost } = req.query

    // Build match conditions (same as getCompletedWorks)
    const matchConditions = {}

    if (mp_id) matchConditions.mp_id = mp_id
    if (state) matchConditions.state = new RegExp(escapeRegex(state), 'i')
    if (district) matchConditions.constituency = district
    if (category) matchConditions.workCategory = new RegExp(escapeRegex(category), 'i')
    // year filter applied after projecting year from completedDate for compatibility

    if (min_cost !== undefined || max_cost !== undefined) {
      const costFilter = {}
      if (min_cost !== undefined) costFilter.$gte = parseFloat(min_cost)
      if (max_cost !== undefined) costFilter.$lte = parseFloat(max_cost)
      matchConditions.cost = costFilter
    }

    const worksCollection = await getCollection('works_completed')
    const _mpsCollection = await getCollection('mps')

    // Apply house/term gating consistent with API controllers
    const reqHouse = req.query.house
    const lsSel = getLsTermSelection(req)
    const houseGate =
      reqHouse === 'Lok Sabha'
        ? { house: 'Lok Sabha', lsTerm: lsSel === 'both' ? { $in: [17, 18] } : parseInt(lsSel, 10) }
        : reqHouse === 'Rajya Sabha'
          ? { house: 'Rajya Sabha' }
          : {
              $or: [
                { house: 'Rajya Sabha' },
                {
                  house: 'Lok Sabha',
                  lsTerm: lsSel === 'both' ? { $in: [17, 18] } : parseInt(lsSel, 10),
                },
              ],
            }

    const pipeline = [
      { $match: { $and: [matchConditions, houseGate] } },
      {
        $lookup: {
          from: 'mps',
          localField: 'mpName',
          foreignField: 'name',
          as: 'mp_details',
        },
      },
      {
        $unwind: {
          path: '$mp_details',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'Work ID': { $ifNull: ['$workId', '$work_id'] },
          'Work Description': { $ifNull: ['$workDescription', '$work_description'] },
          Category: { $ifNull: ['$workCategory', '$category'] },
          'MP Name': '$mpName',
          Constituency: '$constituency',
          State: '$state',
          House: '$house',
          'Final Amount (₹)': { $ifNull: ['$finalAmount', '$cost'] },
          'Completed Date': { $ifNull: ['$completedDate', '$completion_date'] },
          'Has Images': '$hasImage',
          'Average Rating': '$averageRating',
          IDA: '$ida',
        },
      },
      ...(year
        ? [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $year: { $toDate: { $ifNull: ['$completedDate', '$completion_date'] } } },
                    parseInt(year),
                  ],
                },
              },
            },
          ]
        : []),
    ]

    const works = await worksCollection.aggregate(pipeline, { allowDiskUse: true }).toArray()

    if (works.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No completed works found with the specified criteria',
      })
    }

    // Convert to CSV
    const fields = [
      'Work ID',
      'Work Description',
      'Category',
      'MP Name',
      'Constituency',
      'State',
      'House',
      'Final Amount (₹)',
      'Completed Date',
      'Has Images',
      'Average Rating',
      'IDA',
    ]

    const json2csvParser = new Parser({ fields })
    const csv = json2csvParser.parse(works)

    // Set headers for file download
    const filename = `mplads_completed_works_${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf8'))

    res.status(200).send(csv)
  } catch (error) {
    secureLogger.error(
      'Error exporting completed works',
      {
        category: 'export',
        type: 'export_completed_works_error',
        error: error.message,
        filters: req.query,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to export completed works',
    })
  }
}

// Export recommended works as CSV
const exportRecommendedWorksCSV = async (req, res) => {
  try {
    const { mp_id, state, district, category, year, status, min_cost, max_cost } = req.query

    // Build match conditions
    const matchConditions = {}

    if (mp_id) matchConditions.mp_id = mp_id
    if (state) matchConditions.state = new RegExp(escapeRegex(state), 'i')
    if (district) matchConditions.constituency = district
    if (category) matchConditions.workCategory = new RegExp(escapeRegex(category), 'i')
    // year filter applied after projecting from recommendationDate
    if (status) matchConditions.status = status

    if (min_cost !== undefined || max_cost !== undefined) {
      const costFilter = {}
      if (min_cost !== undefined) costFilter.$gte = parseFloat(min_cost)
      if (max_cost !== undefined) costFilter.$lte = parseFloat(max_cost)
      matchConditions.recommendedAmount = costFilter
    }

    const worksCollection = await getCollection('works_recommended')

    // Apply house/term gating consistent with API controllers
    const reqHouseR = req.query.house
    const lsSelR = getLsTermSelection(req)
    const houseGateR =
      reqHouseR === 'Lok Sabha'
        ? {
            house: 'Lok Sabha',
            lsTerm: lsSelR === 'both' ? { $in: [17, 18] } : parseInt(lsSelR, 10),
          }
        : reqHouseR === 'Rajya Sabha'
          ? { house: 'Rajya Sabha' }
          : {
              $or: [
                { house: 'Rajya Sabha' },
                {
                  house: 'Lok Sabha',
                  lsTerm: lsSelR === 'both' ? { $in: [17, 18] } : parseInt(lsSelR, 10),
                },
              ],
            }

    const pipeline = [
      { $match: { $and: [matchConditions, houseGateR] } },
      {
        $lookup: {
          from: 'mps',
          localField: 'mpName',
          foreignField: 'name',
          as: 'mp_details',
        },
      },
      {
        $unwind: {
          path: '$mp_details',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'Work ID': { $ifNull: ['$workId', '$work_id'] },
          'Work Description': { $ifNull: ['$workDescription', '$work_description'] },
          Category: { $ifNull: ['$workCategory', '$category'] },
          'MP Name': '$mpName',
          Constituency: '$constituency',
          State: '$state',
          House: '$house',
          'Recommended Amount (₹)': { $ifNull: ['$recommendedAmount', '$estimated_cost'] },
          'Recommendation Date': { $ifNull: ['$recommendationDate', '$recommended_date'] },
          'Has Images': '$hasImage',
          IDA: '$ida',
        },
      },
      ...(year
        ? [
            {
              $match: {
                $expr: {
                  $eq: [
                    {
                      $year: { $toDate: { $ifNull: ['$recommendationDate', '$recommended_date'] } },
                    },
                    parseInt(year),
                  ],
                },
              },
            },
          ]
        : []),
    ]

    const works = await worksCollection.aggregate(pipeline, { allowDiskUse: true }).toArray()

    if (works.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No recommended works found with the specified criteria',
      })
    }

    // Convert to CSV
    const fields = [
      'Work ID',
      'Work Description',
      'Category',
      'MP Name',
      'Constituency',
      'State',
      'House',
      'Recommended Amount (₹)',
      'Recommendation Date',
      'Has Images',
      'IDA',
    ]

    const json2csvParser = new Parser({ fields })
    const csv = json2csvParser.parse(works)

    // Set headers for file download
    const filename = `mplads_recommended_works_${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf8'))

    res.status(200).send(csv)
  } catch (error) {
    secureLogger.error(
      'Error exporting recommended works',
      {
        category: 'export',
        type: 'export_recommended_works_error',
        error: error.message,
        filters: req.query,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to export recommended works',
    })
  }
}

// Export expenditures as CSV
const exportExpendituresCSV = async (req, res) => {
  try {
    const { mp_id, state, year, payment_status, min_amount, max_amount } = req.query

    // Build match conditions
    const matchConditions = {}

    if (mp_id) matchConditions.mp_id = mp_id
    if (state) matchConditions.state = new RegExp(escapeRegex(state), 'i')
    if (payment_status) matchConditions.paymentStatus = payment_status

    if (year) {
      const yearInt = parseInt(year)
      matchConditions.expenditureDate = {
        $gte: new Date(`${yearInt}-01-01`),
        $lt: new Date(`${yearInt + 1}-01-01`),
      }
    }

    if (min_amount !== undefined || max_amount !== undefined) {
      const amountFilter = {}
      if (min_amount !== undefined) amountFilter.$gte = parseFloat(min_amount)
      if (max_amount !== undefined) amountFilter.$lte = parseFloat(max_amount)
      matchConditions.expenditureAmount = amountFilter
    }

    const expendituresCollection = await getCollection('expenditures')

    // Apply house/term gating consistent with API controllers
    const reqHouseE = req.query.house
    const lsSelE = getLsTermSelection(req)
    const houseGateE =
      reqHouseE === 'Lok Sabha'
        ? {
            house: 'Lok Sabha',
            lsTerm: lsSelE === 'both' ? { $in: [17, 18] } : parseInt(lsSelE, 10),
          }
        : reqHouseE === 'Rajya Sabha'
          ? { house: 'Rajya Sabha' }
          : {
              $or: [
                { house: 'Rajya Sabha' },
                {
                  house: 'Lok Sabha',
                  lsTerm: lsSelE === 'both' ? { $in: [17, 18] } : parseInt(lsSelE, 10),
                },
              ],
            }

    const pipeline = [
      { $match: { $and: [matchConditions, houseGateE] } },
      {
        $lookup: {
          from: 'mps',
          localField: 'mp_id',
          foreignField: '_id',
          as: 'mp_details',
        },
      },
      {
        $unwind: {
          path: '$mp_details',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'MP Name': { $ifNull: ['$mpName', '$mp_details.name'] },
          Constituency: { $ifNull: ['$constituency', '$mp_details.constituency'] },
          State: { $ifNull: ['$state', '$mp_details.state'] },
          House: { $ifNull: ['$house', '$mp_details.house'] },
          'Work Description': { $ifNull: ['$work', '$description'] },
          Vendor: '$vendor',
          IDA: '$ida',
          'Expenditure Amount (₹)': { $ifNull: ['$expenditureAmount', '$amount'] },
          'Expenditure Date': { $ifNull: ['$expenditureDate', '$date'] },
          'Payment Status': '$paymentStatus',
        },
      },
    ]

    const expenditures = await expendituresCollection
      .aggregate(pipeline, { allowDiskUse: true })
      .toArray()

    if (expenditures.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No expenditures found with the specified criteria',
      })
    }

    // Convert to CSV
    const fields = [
      'MP Name',
      'Constituency',
      'State',
      'House',
      'Work Description',
      'Vendor',
      'IDA',
      'Expenditure Amount (₹)',
      'Expenditure Date',
      'Payment Status',
    ]

    const json2csvParser = new Parser({ fields })
    const csv = json2csvParser.parse(expenditures)

    // Set headers for file download
    const filename = `mplads_expenditures_${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf8'))

    res.status(200).send(csv)
  } catch (error) {
    secureLogger.error(
      'Error exporting expenditures',
      {
        category: 'export',
        type: 'export_expenditures_error',
        error: error.message,
        filters: req.query,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to export expenditures',
    })
  }
}

// Export MP summary as CSV
const exportMPSummaryCSV = async (req, res) => {
  try {
    const { state, house, min_utilization, max_utilization } = req.query

    // Build match conditions
    const matchConditions = { type: 'mp_summary' }

    if (state) matchConditions.state = new RegExp(escapeRegex(state), 'i')
    // House and LS-term gating: if LS, apply selected term; if RS, leave lsTerm unconstrained; if both/unspecified, mix
    const sel = getLsTermSelection(req)
    if (house === 'Lok Sabha') {
      matchConditions.house = 'Lok Sabha'
      matchConditions.lsTerm = sel === 'both' ? { $in: [17, 18] } : parseInt(sel, 10)
    } else if (house === 'Rajya Sabha') {
      matchConditions.house = 'Rajya Sabha'
    } else {
      // Both houses: represent as $or of RS and LS(selection)
      // We will handle this via an aggregate $match with $or for consistency
    }

    if (min_utilization !== undefined || max_utilization !== undefined) {
      const utilizationFilter = {}
      if (min_utilization !== undefined) utilizationFilter.$gte = parseFloat(min_utilization)
      if (max_utilization !== undefined) utilizationFilter.$lte = parseFloat(max_utilization)
      matchConditions.utilizationPercentage = utilizationFilter
    }

    const summariesCollection = await getCollection('summaries')

    let summaries
    if (!house || house === 'Both Houses') {
      // Need to mix RS + LS(term) explicitly in aggregation
      summaries = await summariesCollection
        .aggregate([
          {
            $match: {
              type: 'mp_summary',
              ...(state ? { state: new RegExp(escapeRegex(state), 'i') } : {}),
            },
          },
          {
            $match: {
              $or: [
                { house: 'Rajya Sabha' },
                {
                  house: 'Lok Sabha',
                  lsTerm: sel === 'both' ? { $in: [17, 18] } : parseInt(sel, 10),
                },
              ],
            },
          },
          { $sort: { utilizationPercentage: -1 } },
        ])
        .toArray()
    } else {
      summaries = await summariesCollection
        .find(matchConditions)
        .sort({ utilizationPercentage: -1 })
        .toArray()
    }

    if (summaries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No MP summaries found with the specified criteria',
      })
    }

    // Format data for CSV
    const csvData = summaries.map(summary => ({
      'MP Name': summary.mpName,
      Constituency: summary.constituency,
      State: summary.state,
      House: summary.house,
      'Allocated Amount (₹)': summary.allocatedAmount,
      'Total Expenditure (₹)': summary.totalExpenditure,
      'Utilization %': Math.round((summary.utilizationPercentage || 0) * 100) / 100,
      'Completed Works': summary.completedWorksCount,
      'Recommended Works': summary.recommendedWorksCount,
      'Completion Rate %': Math.round((summary.completionRate || 0) * 100) / 100,
      'Unspent Amount (₹)': summary.unspentAmount,
      'Transaction Count': summary.transactionCount,
      'Successful Payments': summary.successfulPayments,
      'Pending Payments': summary.pendingPayments,
      'Average Rating': summary.avgRating || 'N/A',
    }))

    // Convert to CSV
    const fields = [
      'MP Name',
      'Constituency',
      'State',
      'House',
      'Allocated Amount (₹)',
      'Total Expenditure (₹)',
      'Utilization %',
      'Completed Works',
      'Recommended Works',
      'Completion Rate %',
      'Unspent Amount (₹)',
      'Transaction Count',
      'Successful Payments',
      'Pending Payments',
      'Average Rating',
    ]

    const json2csvParser = new Parser({ fields })
    const csv = json2csvParser.parse(csvData)

    // Set headers for file download
    const filename = `mplads_mp_summary_${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf8'))

    res.status(200).send(csv)
  } catch (error) {
    secureLogger.error(
      'Error exporting MP summary',
      {
        category: 'export',
        type: 'export_mp_summary_error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to export MP summary',
    })
  }
}

module.exports = {
  exportCompletedWorksCSV,
  exportRecommendedWorksCSV,
  exportExpendituresCSV,
  exportMPSummaryCSV,
}
