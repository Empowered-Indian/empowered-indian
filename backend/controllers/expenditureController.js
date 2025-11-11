const { Expenditure } = require('../models')
const { getLsTermSelection } = require('../utils/lsTerm')
const { ObjectId } = require('mongodb')
const { escapeRegex, validatePagination } = require('../utils/validators')

// GET /api/expenditures - Expenditure list with filters
const getExpenditures = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-amount',
      mp_id,
      state,
      year,
      min_amount,
      max_amount,
      category,
      search,
    } = req.query

    // Sanitize pagination
    const { page: safePage, limit: safeLimit, skip } = validatePagination(page, limit)

    // Build match conditions
    const plainMatch = {}
    const andClauses = []

    if (mp_id) {
      // Support both string and ObjectId storage of mp_id
      andClauses.push({ $or: [{ mp_id: mp_id }, { mp_id: new ObjectId(mp_id) }] })
    }
    if (state) plainMatch.state = new RegExp(escapeRegex(state), 'i')
    // Defer year filter to after projection so it works for both expenditureDate/date fields
    const yearVal = year ? parseInt(year) : null
    if (category) plainMatch.category = new RegExp(escapeRegex(category), 'i')

    // Amount range filter with validation – applied after projection on normalized amount
    let normalizedAmountFilter = null
    if (min_amount !== undefined || max_amount !== undefined) {
      const amountFilter = {}
      if (min_amount !== undefined) {
        const minVal = parseFloat(min_amount)
        if (!isNaN(minVal) && minVal >= 0) amountFilter.$gte = minVal
      }
      if (max_amount !== undefined) {
        const maxVal = parseFloat(max_amount)
        if (!isNaN(maxVal) && maxVal >= 0) amountFilter.$lte = maxVal
      }
      if (Object.keys(amountFilter).length > 0) {
        normalizedAmountFilter = amountFilter
      }
    }

    // Search in description or MP name - escape regex to prevent injection attacks
    if (search) {
      const escapedSearch = escapeRegex(search.trim())
      andClauses.push({
        $or: [
          { work: new RegExp(escapedSearch, 'i') },
          { vendor: new RegExp(escapedSearch, 'i') },
          { ida: new RegExp(escapedSearch, 'i') },
          { mpName: new RegExp(escapedSearch, 'i') },
        ],
      })
    }

    // Apply house/term gating
    const house = req.query.house
    const lsSel = getLsTermSelection(req)
    let houseGate
    if (house === 'Lok Sabha') {
      houseGate = {
        house: 'Lok Sabha',
        lsTerm: lsSel === 'both' ? { $in: [17, 18] } : parseInt(lsSel, 10),
      }
    } else if (house === 'Rajya Sabha') {
      houseGate = { house: 'Rajya Sabha' }
    } else {
      // Both Houses or unspecified: mix RS + LS(term)
      houseGate = {
        $or: [
          { house: 'Rajya Sabha' },
          {
            house: 'Lok Sabha',
            lsTerm: lsSel === 'both' ? { $in: [17, 18] } : parseInt(lsSel, 10),
          },
        ],
      }
    }

    // Sort configuration
    const requestedSortField = sort.startsWith('-') ? sort.substring(1) : sort
    const requestedSortDir = sort.startsWith('-') ? -1 : 1
    // Map sort by 'amount' to normalized field 'amountNorm'
    const sortField = requestedSortField === 'amount' ? 'amountNorm' : requestedSortField
    const sortConfig = { [sortField]: requestedSortDir }

    // Consolidate plain and AND clauses
    if (Object.keys(plainMatch).length > 0) andClauses.push(plainMatch)

    const pipeline = [
      { $match: { $and: [...andClauses, houseGate] } },
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
          amountNorm: { $toDouble: { $ifNull: ['$amount', '$expenditureAmount'] } },
          year: { $ifNull: ['$year', { $year: { $ifNull: ['$expenditureDate', '$date'] } }] },
          description: { $ifNull: ['$work', '$description'] },
          description_hi: { $ifNull: ['$work', '$description'] }, // Alias work for display
          category: 1,
          category_hi: '$category', // Placeholder
          quarter: 1,
          date: 1,
          mp_details: {
            name: '$mp_details.name',
            name_hi: '$mp_details.name',
            constituency: '$mp_details.constituency',
            state: '$mp_details.state',
          },
        },
      },
      ...(yearVal ? [{ $match: { year: yearVal } }] : []),
      ...(normalizedAmountFilter ? [{ $match: { amountNorm: normalizedAmountFilter } }] : []),
      { $sort: sortConfig },
      { $skip: skip },
      { $limit: safeLimit },
    ]

    const expenditures = await Expenditure.aggregate(pipeline)
    // Compute totalCount using same normalized amount filtering
    const countPipeline = [
      { $match: { $and: [...andClauses, houseGate] } },
      {
        $project: {
          amountNorm: { $toDouble: { $ifNull: ['$amount', '$expenditureAmount'] } },
          year: { $ifNull: ['$year', { $year: { $ifNull: ['$expenditureDate', '$date'] } }] },
        },
      },
      ...(yearVal ? [{ $match: { year: yearVal } }] : []),
      ...(normalizedAmountFilter ? [{ $match: { amountNorm: normalizedAmountFilter } }] : []),
      { $count: 'total' },
    ]
    const countAgg = await Expenditure.aggregate(countPipeline)
    const totalCount = countAgg[0]?.total || 0

    // Get summary statistics for current filters
    const summaryPipeline = [
      { $match: { $and: [...andClauses, houseGate] } },
      {
        $project: {
          amountNorm: { $toDouble: { $ifNull: ['$amount', '$expenditureAmount'] } },
          category: 1,
          mp_id: 1,
          year: { $ifNull: ['$year', { $year: { $ifNull: ['$expenditureDate', '$date'] } }] },
        },
      },
      ...(yearVal ? [{ $match: { year: yearVal } }] : []),
      ...(normalizedAmountFilter ? [{ $match: { amountNorm: normalizedAmountFilter } }] : []),
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amountNorm' },
          avgAmount: { $avg: '$amountNorm' },
          totalTransactions: { $sum: 1 },
          uniqueCategories: { $addToSet: '$category' },
          uniqueMPs: { $addToSet: '$mp_id' },
        },
      },
    ]

    const [summary] = await Expenditure.aggregate(summaryPipeline)

    res.json({
      success: true,
      data: {
        expenditures,
        pagination: {
          currentPage: safePage,
          totalPages: Math.ceil(totalCount / safeLimit),
          totalCount,
          hasNext: safePage * safeLimit < totalCount,
          hasPrev: safePage > 1,
        },
        summary: summary || {
          totalAmount: 0,
          avgAmount: 0,
          totalTransactions: 0,
          uniqueCategories: [],
          uniqueMPs: [],
        },
        filters: {
          mp_id,
          state,
          year,
          min_amount,
          max_amount,
          category,
          search,
        },
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/expenditures/categories - Get all expenditure categories
const getExpenditureCategories = async (req, res, next) => {
  try {
    const categories = await Expenditure.aggregate([
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: { $toDouble: { $ifNull: ['$amount', '$expenditureAmount'] } } },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: { $toDouble: { $ifNull: ['$amount', '$expenditureAmount'] } } },
        },
      },
      {
        $project: {
          category: '$_id',
          category_hi: '$_id', // Placeholder
          totalAmount: { $round: ['$totalAmount', 2] },
          transactionCount: 1,
          avgAmount: { $round: ['$avgAmount', 2] },
        },
      },
      { $sort: { totalAmount: -1 } },
    ])

    res.json({
      success: true,
      data: {
        categories,
        totalCategories: categories.length,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getExpenditures,
  getExpenditureCategories,
}
