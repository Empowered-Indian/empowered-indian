const { WorksCompleted, WorksRecommended, MP, Expenditure } = require('../models')
const { getLsTermSelection } = require('../utils/lsTerm')
const { ObjectId } = require('mongodb')
const { escapeRegex, validatePagination } = require('../utils/validators')

// GET /api/works/completed - Completed works with filters
const getCompletedWorks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-completedDate',
      mp_id,
      state,
      constituency,
      district,
      category,
      year,
      min_cost,
      max_cost,
      search,
    } = req.query

    // Sanitize pagination
    const { page: safePage, limit: safeLimit, skip } = validatePagination(page, limit)

    // Build match conditions
    const matchConditions = {}

    if (mp_id) {
      // Find MP by ID first to get the actual MP name
      try {
        const mp = await MP.findById(mp_id)
        if (mp) {
          matchConditions.mpName = mp.name
        }
      } catch {
        // If mp_id is not a valid ObjectId, treat it as mpName directly
        matchConditions.mpName = mp_id
      }
    }
    if (state && state.trim()) matchConditions.state = new RegExp(escapeRegex(state.trim()), 'i')
    {
      const cTrim = constituency && constituency.trim()
      const dTrim = district && district.trim()
      if (cTrim && dTrim) {
        if (cTrim.toLowerCase() === dTrim.toLowerCase()) {
          matchConditions.constituency = cTrim
        } else {
          matchConditions.constituency = { $in: [cTrim, dTrim] }
        }
      } else if (cTrim) {
        matchConditions.constituency = cTrim
      } else if (dTrim) {
        matchConditions.constituency = dTrim // district maps to constituency
      }
    }
    if (category && category.trim())
      matchConditions.workCategory = new RegExp(escapeRegex(category), 'i')
    // Year filter applied post-projection to support both completedDate and completion_date

    // Cost range filter
    if (
      (min_cost !== undefined && min_cost !== '') ||
      (max_cost !== undefined && max_cost !== '')
    ) {
      const costFilter = {}
      if (min_cost !== undefined && min_cost !== '') costFilter.$gte = parseFloat(min_cost)
      if (max_cost !== undefined && max_cost !== '') costFilter.$lte = parseFloat(max_cost)
      matchConditions.finalAmount = costFilter
    }

    // Search in work description - combine with existing conditions using $and
    if (search && search.trim()) {
      const searchConditions = {
        $or: [
          { workDescription: new RegExp(escapeRegex(search), 'i') },
          { ida: new RegExp(escapeRegex(search), 'i') },
        ],
      }

      // If there are already conditions, combine them with $and
      if (Object.keys(matchConditions).length > 0) {
        const existingConditions = { ...matchConditions }
        // Clear matchConditions and rebuild with $and
        Object.keys(matchConditions).forEach(key => delete matchConditions[key])
        matchConditions.$and = [existingConditions, searchConditions]
      } else {
        // If no other conditions, just use the search conditions
        matchConditions.$or = searchConditions.$or
      }
    }

    // Apply term/house selection intelligently
    const lsSelC = getLsTermSelection(req)
    const reqHouseC = req.query.house
    const lsGateC =
      reqHouseC === 'Lok Sabha'
        ? {
            house: 'Lok Sabha',
            lsTerm: lsSelC === 'both' ? { $in: [17, 18] } : parseInt(lsSelC, 10),
          }
        : reqHouseC === 'Rajya Sabha'
          ? { house: 'Rajya Sabha' }
          : {
              $or: [
                { house: 'Rajya Sabha' },
                {
                  house: 'Lok Sabha',
                  lsTerm: lsSelC === 'both' ? { $in: [17, 18] } : parseInt(lsSelC, 10),
                },
              ],
            }

    // Apply Lok Sabha term selection (default 18) for mixed-house queries
    const lsSelR = getLsTermSelection(req)
    const _lsGateR = {
      $or: [
        { house: 'Rajya Sabha' },
        {
          house: 'Lok Sabha',
          lsTerm: lsSelR === 'both' ? { $in: [17, 18] } : parseInt(lsSelR, 10),
        },
      ],
    }

    // Sort configuration
    const sortConfig = {}
    if (sort.startsWith('-')) {
      sortConfig[sort.substring(1)] = -1
    } else {
      sortConfig[sort] = 1
    }

    const pipeline = [
      { $match: { $and: [matchConditions, lsGateC] } },
      {
        $project: {
          // Backward-compatible mapping to support old/new field names
          work_id: { $ifNull: ['$workId', '$work_id'] },
          work_description: { $ifNull: ['$workDescription', '$work_description'] },
          work_description_hi: { $ifNull: ['$workDescription', '$work_description'] },
          category: { $ifNull: ['$workCategory', '$category'] },
          category_hi: { $ifNull: ['$workCategory', '$category'] },
          cost: { $toDouble: { $ifNull: ['$finalAmount', '$cost'] } },
          completion_date: { $ifNull: ['$completedDate', '$completion_date'] },
          completion_year: {
            $cond: [
              { $ne: ['$completedDate', null] },
              { $year: '$completedDate' },
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$completion_date', null] },
                      { $eq: [{ $type: '$completion_date' }, 'date'] },
                    ],
                  },
                  { $year: '$completion_date' },
                  null,
                ],
              },
            ],
          },
          location: { $ifNull: ['$ida', '$location'] },
          location_hi: { $ifNull: ['$ida', '$location'] },
          district: { $ifNull: ['$constituency', '$district'] },
          district_hi: { $ifNull: ['$constituency', '$district'] },
          state: 1,
          state_hi: '$state',
          beneficiaries: { $toDouble: { $ifNull: ['$beneficiaries', 0] } },
          mp_details: {
            name: '$mpName',
            name_hi: '$mpName',
            constituency: '$constituency',
            party: '$house',
          },
        },
      },
      // Apply year filter post-projection so it works whether date is in completedDate or completion_date
      ...(year ? [{ $match: { completion_year: parseInt(year) } }] : []),
      { $sort: sortConfig },
      { $skip: skip },
      { $limit: safeLimit },
    ]

    const completedWorks = await WorksCompleted.aggregate(pipeline)
    // Mirror year filtering in count to keep totals in sync
    const countAgg = await WorksCompleted.aggregate([
      { $match: { $and: [matchConditions, lsGateC] } },
      {
        $project: {
          completion_year: {
            $year: { $ifNull: ['$completedDate', { $toDate: '$completion_date' }] },
          },
        },
      },
      ...(year ? [{ $match: { completion_year: parseInt(year) } }] : []),
      { $count: 'total' },
    ])
    const totalCount = countAgg[0]?.total || 0

    // Get summary statistics
    const summaryPipeline = [
      { $match: { $and: [matchConditions, lsGateC] } },
      {
        $project: {
          cost: { $toDouble: { $ifNull: ['$finalAmount', '$cost'] } },
          category: { $ifNull: ['$workCategory', '$category'] },
          constituency: { $ifNull: ['$constituency', '$district'] },
          beneficiaries: { $toDouble: { $ifNull: ['$beneficiaries', 0] } },
          completedDate: { $ifNull: ['$completedDate', '$completion_date'] },
        },
      },
      ...(year
        ? [
            {
              $match: {
                $expr: { $eq: [{ $year: { $toDate: '$completedDate' } }, parseInt(year)] },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          avgCost: { $avg: '$cost' },
          totalWorks: { $sum: 1 },
          uniqueCategories: { $addToSet: '$category' },
          uniqueDistricts: { $addToSet: '$constituency' },
          totalBeneficiaries: { $sum: '$beneficiaries' },
          avgBeneficiaries: { $avg: '$beneficiaries' },
        },
      },
    ]

    const [summary] = await WorksCompleted.aggregate(summaryPipeline)

    res.json({
      success: true,
      data: {
        completedWorks,
        pagination: {
          currentPage: safePage,
          totalPages: Math.ceil(totalCount / safeLimit),
          totalCount,
          hasNext: safePage * safeLimit < totalCount,
          hasPrev: safePage > 1,
        },
        summary: summary || {
          totalCost: 0,
          avgCost: 0,
          totalWorks: 0,
          uniqueCategories: [],
          uniqueDistricts: [],
          totalBeneficiaries: 0,
        },
        filters: {
          mp_id,
          state,
          constituency,
          district,
          category,
          year,
          min_cost,
          max_cost,
          search,
        },
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/works/recommended - Recommended works with filters
const getRecommendedWorks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-recommendationDate',
      mp_id,
      state,
      constituency,
      district,
      category,
      year,
      status,
      min_cost,
      max_cost,
      search,
      has_payments,
    } = req.query

    // Sanitize pagination
    const { page: safePage, limit: safeLimit, skip } = validatePagination(page, limit)

    // Build match conditions
    const matchConditions = {}

    if (mp_id) {
      // Find MP by ID first to get the actual MP name
      try {
        const mp = await MP.findById(mp_id)
        if (mp) {
          matchConditions.mpName = mp.name
        }
      } catch {
        // If mp_id is not a valid ObjectId, treat it as mpName directly
        matchConditions.mpName = mp_id
      }
    }
    if (state && state.trim()) matchConditions.state = new RegExp(escapeRegex(state.trim()), 'i')
    if (constituency && constituency.trim()) {
      // Handle constituency filtering with proper state context
      matchConditions.constituency = constituency.trim()
      // If both state and constituency are provided, ensure they match together
      // This helps disambiguate constituencies with same names in different states
    } else if (district && district.trim()) {
      matchConditions.constituency = district.trim() // district maps to constituency
    }
    if (category && category.trim())
      matchConditions.workCategory = new RegExp(escapeRegex(category.trim()), 'i')
    // Year will be filtered after projection to support date-based documents
    if (status && status.trim()) matchConditions.status = status

    // Cost range filter
    if (
      (min_cost !== undefined && min_cost !== '') ||
      (max_cost !== undefined && max_cost !== '')
    ) {
      const costFilter = {}
      if (min_cost !== undefined && min_cost !== '') costFilter.$gte = parseFloat(min_cost)
      if (max_cost !== undefined && max_cost !== '') costFilter.$lte = parseFloat(max_cost)
      matchConditions.recommendedAmount = costFilter
    }

    // Search in work description - combine with existing conditions using $and
    if (search && search.trim()) {
      const searchConditions = {
        $or: [
          { workDescription: new RegExp(escapeRegex(search), 'i') },
          { ida: new RegExp(escapeRegex(search), 'i') },
        ],
      }

      // If there are already conditions, combine them with $and
      if (Object.keys(matchConditions).length > 0) {
        const existingConditions = { ...matchConditions }
        // Clear matchConditions and rebuild with $and
        Object.keys(matchConditions).forEach(key => delete matchConditions[key])
        matchConditions.$and = [existingConditions, searchConditions]
      } else {
        // If no other conditions, just use the search conditions
        matchConditions.$or = searchConditions.$or
      }
    }

    // Apply term/house selection intelligently
    const lsSelR = getLsTermSelection(req)
    const reqHouseR = req.query.house
    const lsGateR =
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

    // Sort configuration
    const sortConfig = {}
    if (sort.startsWith('-')) {
      sortConfig[sort.substring(1)] = -1
    } else {
      sortConfig[sort] = 1
    }

    // For performance, cap initial scan size to reduce heavy lookups
    const initialLimit = has_payments !== undefined ? 1000 : null // Limit to 1000 works when payment filtering
    const scanCap = has_payments !== undefined ? initialLimit : Math.max(parseInt(limit) * 50, 1000)

    // Fast path: small page, no expensive filters. Avoid heavy aggregation.
    const fastPath = !has_payments && !year && !category && !search && parseInt(limit) <= 5
    if (fastPath) {
      try {
        const baseQuery = { $and: [matchConditions, lsGateR] }
        // Fetch a small buffer to allow exclude-completed filtering
        const bufferSize = Math.max(parseInt(limit) * 3, 20)
        const quickDocs = await WorksRecommended.find(baseQuery)
          .sort(sortConfig)
          .limit(bufferSize)
          .select(
            'house lsTerm workDescription workCategory recommendedAmount recommendationDate ida constituency state expected_beneficiaries priority mpName workId'
          )
          .lean()

        const ids = Array.from(new Set(quickDocs.map(d => d.workId).filter(Boolean)))
        let filtered = quickDocs
        if (ids.length > 0) {
          const houses = Array.from(new Set(quickDocs.map(d => d.house).filter(Boolean)))
          const terms = Array.from(new Set(quickDocs.map(d => d.lsTerm)))
          const completedQuery = {
            workId: { $in: ids },
            ...(houses.length === 1 ? { house: houses[0] } : { house: { $in: houses } }),
            ...(terms.length > 0 ? { lsTerm: { $in: terms } } : {}),
          }
          const completed = await WorksCompleted.find(completedQuery).select('workId').lean()
          const completedIds = new Set(completed.map(c => c.workId))
          filtered = quickDocs.filter(d => !completedIds.has(d.workId))
        }

        const pageItems = filtered.slice(0, parseInt(limit)).map(doc => ({
          house: doc.house,
          lsTerm: doc.lsTerm,
          work_description: doc.workDescription,
          work_description_hi: doc.workDescription,
          category: doc.workCategory,
          category_hi: doc.workCategory,
          estimated_cost: doc.recommendedAmount,
          recommended_date: doc.recommendationDate,
          recommended_year: doc.recommendationDate
            ? new Date(doc.recommendationDate).getFullYear()
            : undefined,
          status: 'Recommended',
          status_hi: 'Recommended',
          location: doc.ida,
          location_hi: doc.ida,
          district: doc.constituency,
          district_hi: doc.constituency,
          state: doc.state,
          state_hi: doc.state,
          expected_beneficiaries: doc.expected_beneficiaries || 0,
          priority: doc.priority,
          mp_details: {
            name: doc.mpName,
            name_hi: doc.mpName,
            constituency: doc.constituency,
            party: doc.house,
          },
          workId: doc.workId,
          hasPayments: false,
          totalPaid: 0,
          paymentCount: 0,
        }))

        // Approximate count but exclude works already completed
        let approxTotal = 0
        try {
          const approxAgg = await WorksRecommended.aggregate([
            { $match: baseQuery },
            {
              $lookup: {
                from: 'works_completed',
                let: { workId: '$workId', house: '$house', lsTerm: '$lsTerm' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$workId', '$$workId'] },
                          { $eq: ['$house', '$$house'] },
                          {
                            $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }],
                          },
                        ],
                      },
                    },
                  },
                ],
                as: 'completedMatch',
              },
            },
            { $match: { completedMatch: { $size: 0 } } },
            { $count: 'total' },
          ])
          approxTotal = approxAgg[0]?.total || 0
        } catch {
          approxTotal = 0
        }

        return res.json({
          success: true,
          data: {
            recommendedWorks: pageItems,
            pagination: {
              currentPage: parseInt(page),
              totalPages: Math.ceil(approxTotal / safeLimit),
              totalCount: approxTotal,
              hasNext: parseInt(page) * safeLimit < approxTotal,
              hasPrev: parseInt(page) > 1,
            },
            summary: {
              totalEstimatedCost: pageItems.reduce((s, w) => s + (w.estimated_cost || 0), 0),
              avgEstimatedCost: pageItems.length
                ? pageItems.reduce((s, w) => s + (w.estimated_cost || 0), 0) / pageItems.length
                : 0,
              totalWorks: approxTotal,
              uniqueCategories: [],
              uniqueDistricts: [],
              statusDistribution: [],
            },
            filters: {
              mp_id,
              state,
              constituency,
              district,
              category,
              year,
              status,
              min_cost,
              max_cost,
              search,
              has_payments,
            },
            lastUpdated: new Date().toISOString(),
          },
        })
      } catch {
        // fall through to heavy pipeline
      }
    }

    const pipeline = [
      { $match: { $and: [matchConditions, lsGateR] } },
      ...(scanCap ? [{ $limit: scanCap }] : []),
      // Exclude works that are already completed (by identity)
      {
        $lookup: {
          from: 'works_completed',
          let: { workId: '$workId', house: '$house', lsTerm: '$lsTerm' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$workId', '$$workId'] },
                    { $eq: ['$house', '$$house'] },
                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] },
                  ],
                },
              },
            },
          ],
          as: 'completedMatch',
        },
      },
      { $match: { completedMatch: { $size: 0 } } },
      {
        $lookup: {
          from: 'mps',
          localField: 'mp_id',
          foreignField: '_id',
          as: 'mp_details',
        },
      },
      { $unwind: { path: '$mp_details', preserveNullAndEmptyArrays: true } },
      // Add payment information lookup if payment filtering is needed
      ...(has_payments !== undefined
        ? [
            {
              $lookup: {
                from: 'expenditures',
                let: { workId: '$workId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$workId', '$$workId'] },
                          { $eq: ['$paymentStatus', 'Payment Success'] },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      totalPaid: { $sum: '$expenditureAmount' },
                      paymentCount: { $sum: 1 },
                    },
                  },
                ],
                as: 'payment_data',
              },
            },
          ]
        : []),
      {
        $project: {
          house: 1,
          lsTerm: 1,
          work_description: { $ifNull: ['$workDescription', '$work_description'] },
          work_description_hi: { $ifNull: ['$workDescription', '$work_description'] },
          category: { $ifNull: ['$workCategory', '$category'] },
          category_hi: { $ifNull: ['$workCategory', '$category'] },
          estimated_cost: { $toDouble: { $ifNull: ['$recommendedAmount', '$estimated_cost'] } },
          recommended_date: { $ifNull: ['$recommendationDate', '$recommended_date'] },
          recommended_year: {
            $year: { $ifNull: ['$recommendationDate', { $toDate: '$recommended_date' }] },
          },
          status: { $ifNull: ['$status', 'Recommended'] },
          status_hi: { $ifNull: ['$status', 'Recommended'] },
          location: { $ifNull: ['$ida', '$location'] },
          location_hi: { $ifNull: ['$ida', '$location'] },
          district: { $ifNull: ['$constituency', '$district'] },
          district_hi: { $ifNull: ['$constituency', '$district'] },
          state: 1,
          state_hi: '$state',
          expected_beneficiaries: { $toDouble: { $ifNull: ['$expected_beneficiaries', 0] } },
          priority: 1,
          mp_details: {
            name: '$mpName',
            name_hi: '$mpName',
            constituency: '$constituency',
            party: '$house',
          },
          // Payment information
          workId: 1,
          // Add payment fields when payment lookup is performed
          ...(has_payments !== undefined
            ? {
                hasPayments: { $gt: [{ $size: '$payment_data' }, 0] },
                totalPaid: { $ifNull: [{ $arrayElemAt: ['$payment_data.totalPaid', 0] }, 0] },
                paymentCount: { $ifNull: [{ $arrayElemAt: ['$payment_data.paymentCount', 0] }, 0] },
              }
            : {}),
        },
      },
      ...(year ? [{ $match: { recommended_year: parseInt(year) } }] : []),
      // Apply payment filtering after projection but before sorting/pagination
      ...(has_payments !== undefined
        ? [
            {
              $match: {
                hasPayments: has_payments === 'true' || has_payments === '1',
              },
            },
          ]
        : []),
      { $sort: sortConfig },
      { $skip: skip },
      { $limit: safeLimit },
    ]

    let recommendedWorks = []
    try {
      recommendedWorks = await WorksRecommended.aggregate(pipeline).option({
        allowDiskUse: true,
        maxTimeMS: 5000,
      })
    } catch {
      // Fallback: return empty page quickly if heavy pipeline times out
      recommendedWorks = []
    }

    // Compute totalCount using the same filtering logic as main pipeline
    const totalCountPipeline = [
      { $match: { $and: [matchConditions, lsGateR] } },
      ...(initialLimit ? [{ $limit: initialLimit }] : []),
      // Exclude completed works in count as well
      {
        $lookup: {
          from: 'works_completed',
          let: { workId: '$workId', house: '$house', lsTerm: '$lsTerm' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$workId', '$$workId'] },
                    { $eq: ['$house', '$$house'] },
                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] },
                  ],
                },
              },
            },
          ],
          as: 'completedMatch',
        },
      },
      { $match: { completedMatch: { $size: 0 } } },
      // Add payment lookup for count calculation if payment filtering is applied
      ...(has_payments !== undefined
        ? [
            {
              $lookup: {
                from: 'expenditures',
                let: { workId: '$workId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$workId', '$$workId'] },
                          { $eq: ['$paymentStatus', 'Payment Success'] },
                        ],
                      },
                    },
                  },
                ],
                as: 'payment_data',
              },
            },
          ]
        : []),
      {
        $project: {
          recommended_date: { $ifNull: ['$recommendationDate', '$recommended_date'] },
          // Add hasPayments field for filtering if payment filtering is applied
          ...(has_payments !== undefined
            ? {
                hasPayments: { $gt: [{ $size: '$payment_data' }, 0] },
              }
            : {}),
        },
      },
      ...(year
        ? [
            {
              $match: {
                $expr: { $eq: [{ $year: { $toDate: '$recommended_date' } }, parseInt(year)] },
              },
            },
          ]
        : []),
      // Apply payment filtering for count calculation
      ...(has_payments !== undefined
        ? [
            {
              $match: {
                hasPayments: has_payments === 'true' || has_payments === '1',
              },
            },
          ]
        : []),
      { $count: 'total' },
    ]

    let totalCount = 0
    try {
      const totalCountAgg = await WorksRecommended.aggregate(totalCountPipeline).option({
        allowDiskUse: true,
        maxTimeMS: 5000,
      })
      totalCount = totalCountAgg[0]?.total || 0
    } catch {
      // Approximate fallback without exclude-completed (fast)
      totalCount = await WorksRecommended.countDocuments({ $and: [matchConditions, lsGateR] })
    }

    // Get summary statistics - include payment filtering if applied
    const summaryPipeline = [
      { $match: { $and: [matchConditions, lsGateR] } },
      ...(initialLimit ? [{ $limit: initialLimit }] : []),
      // Exclude completed works in summary
      {
        $lookup: {
          from: 'works_completed',
          let: { workId: '$workId', house: '$house', lsTerm: '$lsTerm' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$workId', '$$workId'] },
                    { $eq: ['$house', '$$house'] },
                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] },
                  ],
                },
              },
            },
          ],
          as: 'completedMatch',
        },
      },
      { $match: { completedMatch: { $size: 0 } } },
      // Add payment lookup for summary calculation if payment filtering is applied
      ...(has_payments !== undefined
        ? [
            {
              $lookup: {
                from: 'expenditures',
                let: { workId: '$workId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$workId', '$$workId'] },
                          { $eq: ['$paymentStatus', 'Payment Success'] },
                        ],
                      },
                    },
                  },
                ],
                as: 'payment_data',
              },
            },
          ]
        : []),
      {
        $project: {
          recommendedAmount: 1,
          workCategory: 1,
          constituency: 1,
          status: 1,
          expected_beneficiaries: 1,
          // Add hasPayments field for filtering if payment filtering is applied
          ...(has_payments !== undefined
            ? {
                hasPayments: { $gt: [{ $size: '$payment_data' }, 0] },
              }
            : {}),
        },
      },
      // Apply payment filtering for summary calculation
      ...(has_payments !== undefined
        ? [
            {
              $match: {
                hasPayments: has_payments === 'true' || has_payments === '1',
              },
            },
          ]
        : []),
      {
        $group: {
          _id: null,
          totalEstimatedCost: { $sum: { $toDouble: { $ifNull: ['$recommendedAmount', 0] } } },
          avgEstimatedCost: { $avg: { $toDouble: { $ifNull: ['$recommendedAmount', 0] } } },
          totalWorks: { $sum: 1 },
          uniqueCategories: { $addToSet: '$workCategory' },
          uniqueDistricts: { $addToSet: '$constituency' },
          statusDistribution: { $push: { $ifNull: ['$status', 'Recommended'] } },
          totalExpectedBeneficiaries: {
            $sum: { $toDouble: { $ifNull: ['$expected_beneficiaries', 0] } },
          },
        },
      },
    ]

    let summaryArr = []
    try {
      summaryArr = await WorksRecommended.aggregate(summaryPipeline).option({
        allowDiskUse: true,
        maxTimeMS: 5000,
      })
    } catch {
      summaryArr = []
    }
    const [summary] = summaryArr

    // Get status distribution - include payment filtering if applied
    const statusDistributionPipeline = [
      { $match: { $and: [matchConditions, lsGateR] } },
      ...(initialLimit ? [{ $limit: initialLimit }] : []),
      // Exclude completed works in status distribution
      {
        $lookup: {
          from: 'works_completed',
          let: { workId: '$workId', house: '$house', lsTerm: '$lsTerm' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$workId', '$$workId'] },
                    { $eq: ['$house', '$$house'] },
                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] },
                  ],
                },
              },
            },
          ],
          as: 'completedMatch',
        },
      },
      { $match: { completedMatch: { $size: 0 } } },
      // Add payment lookup for status distribution if payment filtering is applied
      ...(has_payments !== undefined
        ? [
            {
              $lookup: {
                from: 'expenditures',
                let: { workId: '$workId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$workId', '$$workId'] },
                          { $eq: ['$paymentStatus', 'Payment Success'] },
                        ],
                      },
                    },
                  },
                ],
                as: 'payment_data',
              },
            },
          ]
        : []),
      {
        $project: {
          status: 1,
          recommendedAmount: 1,
          // Add hasPayments field for filtering if payment filtering is applied
          ...(has_payments !== undefined
            ? {
                hasPayments: { $gt: [{ $size: '$payment_data' }, 0] },
              }
            : {}),
        },
      },
      // Apply payment filtering for status distribution
      ...(has_payments !== undefined
        ? [
            {
              $match: {
                hasPayments: has_payments === 'true' || has_payments === '1',
              },
            },
          ]
        : []),
      {
        $group: {
          _id: { $ifNull: ['$status', 'Recommended'] },
          count: { $sum: 1 },
          totalCost: { $sum: { $toDouble: { $ifNull: ['$recommendedAmount', 0] } } },
        },
      },
    ]

    let statusDistribution = []
    try {
      statusDistribution = await WorksRecommended.aggregate(statusDistributionPipeline).option({
        allowDiskUse: true,
        maxTimeMS: 5000,
      })
    } catch {
      statusDistribution = []
    }

    // Add payment information to recommended works that don't have payment filtering applied
    const worksWithPayments =
      has_payments !== undefined
        ? recommendedWorks // Payment data already included in aggregation pipeline
        : await Promise.all(
            recommendedWorks.map(async work => {
              if (work.workId) {
                try {
                  const payments = await Expenditure.find({
                    workId: work.workId,
                    paymentStatus: 'Payment Success',
                    house: work.house,
                    ...(work.house === 'Lok Sabha' ? { lsTerm: work.lsTerm } : {}),
                  }).select('expenditureAmount')

                  const totalPaid = payments.reduce(
                    (sum, payment) => sum + (payment.expenditureAmount || 0),
                    0
                  )
                  const paymentCount = payments.length

                  return {
                    ...work,
                    hasPayments: paymentCount > 0,
                    totalPaid: totalPaid,
                    paymentCount: paymentCount,
                  }
                } catch (error) {
                  console.error('Error fetching payments for work:', work.workId, error)
                }
              }

              return {
                ...work,
                hasPayments: false,
                totalPaid: 0,
                paymentCount: 0,
              }
            })
          )

    // No need for JavaScript filtering - it's now handled in the database aggregation pipeline
    const filteredWorks = worksWithPayments

    res.json({
      success: true,
      data: {
        recommendedWorks: filteredWorks,
        pagination: {
          currentPage: safePage,
          totalPages: Math.ceil(totalCount / safeLimit),
          totalCount,
          hasNext: safePage * safeLimit < totalCount,
          hasPrev: safePage > 1,
        },
        summary: summary
          ? {
              ...summary,
              statusDistribution,
            }
          : {
              totalEstimatedCost: 0,
              avgEstimatedCost: 0,
              totalWorks: 0,
              uniqueCategories: [],
              uniqueDistricts: [],
              statusDistribution: [],
              totalExpectedBeneficiaries: 0,
            },
        filters: {
          mp_id,
          state,
          constituency,
          district,
          category,
          year,
          status,
          min_cost,
          max_cost,
          search,
          has_payments,
        },
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/works/categories - Get work categories for both completed and recommended
// GET /api/works/constituencies - Get all unique constituencies
const getConstituencies = async (req, res, next) => {
  try {
    const { state, house } = req.query
    const lsSel = getLsTermSelection(req)

    let matchStage = {}
    if (state) matchStage.state = new RegExp(escapeRegex(state), 'i')
    if (house === 'Lok Sabha') {
      Object.assign(
        matchStage,
        { house: 'Lok Sabha' },
        lsSel === 'both' ? { lsTerm: { $in: [17, 18] } } : { lsTerm: parseInt(lsSel, 10) }
      )
    } else if (house === 'Rajya Sabha') {
      Object.assign(matchStage, { house: 'Rajya Sabha' })
    }

    // Build aggregation pipeline for both collections
    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: {
            constituency: '$constituency',
            state: '$state',
          },
          projectCount: { $sum: 1 },
          totalAmount: {
            $sum: {
              $toDouble: {
                $ifNull: [
                  '$finalAmount', // works_completed field
                  '$recommendedAmount', // works_recommended field
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          constituency: '$_id.constituency',
          state: '$_id.state',
          projectCount: 1,
          totalAmount: { $round: ['$totalAmount', 2] },
        },
      },
    ]

    // Run both aggregations in parallel for efficiency
    const [completedConstituencies, recommendedConstituencies] = await Promise.all([
      WorksCompleted.aggregate(pipeline),
      WorksRecommended.aggregate(pipeline),
    ])

    // Merge and deduplicate constituencies
    const constituencyMap = new Map()

    // Add completed works constituencies
    completedConstituencies.forEach(c => {
      const key = `${c.constituency}|${c.state}`
      constituencyMap.set(key, {
        constituency: c.constituency,
        state: c.state,
        projectCount: c.projectCount,
        totalAmount: c.totalAmount,
      })
    })

    // Merge recommended works constituencies
    recommendedConstituencies.forEach(c => {
      const key = `${c.constituency}|${c.state}`
      if (constituencyMap.has(key)) {
        // Combine counts and amounts if constituency already exists
        const existing = constituencyMap.get(key)
        existing.projectCount += c.projectCount
        existing.totalAmount += c.totalAmount // Accumulate without rounding
      } else {
        // Add new constituency
        constituencyMap.set(key, {
          constituency: c.constituency,
          state: c.state,
          projectCount: c.projectCount,
          totalAmount: c.totalAmount,
        })
      }
    })

    // Convert map to sorted array and round totalAmount at output
    const constituencies = Array.from(constituencyMap.values())
      .map(c => ({
        ...c,
        totalAmount: Math.round(c.totalAmount * 100) / 100,
      }))
      .sort((a, b) => a.constituency.localeCompare(b.constituency))

    // Get states list from both collections and combine
    const [completedStates, recommendedStates] = await Promise.all([
      WorksCompleted.distinct('state'),
      WorksRecommended.distinct('state'),
    ])

    const uniqueStates = [...new Set([...completedStates, ...recommendedStates])]
    uniqueStates.sort()

    res.json({
      success: true,
      data: {
        constituencies,
        states: uniqueStates,
        totalConstituencies: constituencies.length,
        totalStates: uniqueStates.length,
      },
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
}

const getWorkCategories = async (req, res, next) => {
  try {
    const { state, house } = req.query
    const lsSel = getLsTermSelection(req)
    const matchStage = {}
    if (state) matchStage.state = new RegExp(escapeRegex(state), 'i')
    if (house === 'Lok Sabha') {
      Object.assign(
        matchStage,
        { house: 'Lok Sabha' },
        lsSel === 'both' ? { lsTerm: { $in: [17, 18] } } : { lsTerm: parseInt(lsSel, 10) }
      )
    } else if (house === 'Rajya Sabha') {
      Object.assign(matchStage, { house: 'Rajya Sabha' })
    }

    const [completedCategories, recommendedCategories] = await Promise.all([
      WorksCompleted.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $project: {
            category: { $ifNull: ['$workCategory', '$category'] },
            cost: { $toDouble: { $ifNull: ['$finalAmount', '$cost'] } },
          },
        },
        {
          $group: {
            _id: '$category',
            totalCost: { $sum: '$cost' },
            workCount: { $sum: 1 },
            avgCost: { $avg: '$cost' },
          },
        },
        {
          $project: {
            category: '$_id',
            category_hi: '$_id', // Placeholder
            totalCost: { $round: ['$totalCost', 2] },
            workCount: 1,
            avgCost: { $round: ['$avgCost', 2] },
          },
        },
        { $sort: { totalCost: -1 } },
      ]),
      WorksRecommended.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $project: {
            category: { $ifNull: ['$workCategory', '$category'] },
            estimated_cost: { $toDouble: { $ifNull: ['$recommendedAmount', '$estimated_cost'] } },
          },
        },
        {
          $group: {
            _id: '$category',
            totalEstimatedCost: { $sum: '$estimated_cost' },
            workCount: { $sum: 1 },
            avgEstimatedCost: { $avg: '$estimated_cost' },
          },
        },
        {
          $project: {
            category: '$_id',
            category_hi: '$_id', // Placeholder
            totalEstimatedCost: { $round: ['$totalEstimatedCost', 2] },
            workCount: 1,
            avgEstimatedCost: { $round: ['$avgEstimatedCost', 2] },
          },
        },
        { $sort: { totalEstimatedCost: -1 } },
      ]),
    ])

    res.json({
      success: true,
      data: {
        completed: {
          categories: completedCategories,
          totalCategories: completedCategories.length,
        },
        recommended: {
          categories: recommendedCategories,
          totalCategories: recommendedCategories.length,
        },
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/works/completed/:id - Get individual completed work details
const getCompletedWorkDetails = async (req, res, next) => {
  try {
    const { id } = req.params

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid work ID format',
      })
    }

    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'mps',
          localField: 'mpName', // fallback when mp_id is not present
          foreignField: 'name',
          as: 'mp_details',
        },
      },
      { $unwind: { path: '$mp_details', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          work_id: { $ifNull: ['$workId', '$work_id'] },
          work_description: { $ifNull: ['$workDescription', '$work_description'] },
          work_description_hi: { $ifNull: ['$workDescription', '$work_description'] },
          category: { $ifNull: ['$workCategory', '$category'] },
          category_hi: { $ifNull: ['$workCategory', '$category'] },
          cost: { $toDouble: { $ifNull: ['$finalAmount', '$cost'] } },
          completion_date: { $ifNull: ['$completedDate', '$completion_date'] },
          completion_year: {
            $cond: [
              { $ne: ['$completedDate', null] },
              { $year: '$completedDate' },
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$completion_date', null] },
                      { $eq: [{ $type: '$completion_date' }, 'date'] },
                    ],
                  },
                  { $year: '$completion_date' },
                  null,
                ],
              },
            ],
          },
          location: { $ifNull: ['$ida', '$location'] },
          location_hi: { $ifNull: ['$ida', '$location'] },
          district: { $ifNull: ['$constituency', '$district'] },
          district_hi: { $ifNull: ['$constituency', '$district'] },
          state: 1,
          state_hi: '$state',
          beneficiaries: { $toInt: { $ifNull: ['$beneficiaries', 0] } },
          implementing_agency: { $ifNull: ['$implementing_agency', null] },
          implementing_agency_hi: { $ifNull: ['$implementing_agency', null] },
          photos: {
            before: { $ifNull: ['$before_photos', []] },
            after: { $ifNull: ['$after_photos', []] },
          },
          gps_coordinates: {
            latitude: '$latitude',
            longitude: '$longitude',
          },
          status_timeline: '$timeline',
          quality_rating: { $toDouble: { $ifNull: ['$quality_rating', 0] } },
          impact_metrics: {
            schools_connected: '$schools_connected',
            roads_length_km: '$roads_length_km',
            water_connections: '$water_connections',
            beneficiary_households: '$beneficiary_households',
          },
          mp_details: {
            _id: '$mp_details._id',
            name: '$mp_details.name',
            name_hi: '$mp_details.name',
            constituency: '$mp_details.constituency',
            constituency_hi: '$mp_details.constituency',
            house: '$mp_details.house',
          },
          created_at: { $ifNull: ['$created_at', '$createdAt'] },
          updated_at: { $ifNull: ['$updated_at', '$updatedAt'] },
        },
      },
    ]

    const [work] = await WorksCompleted.aggregate(pipeline)

    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Completed work not found',
      })
    }

    res.json({
      success: true,
      data: work,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/works/recommended/:id - Get individual recommended work details
const getRecommendedWorkDetails = async (req, res, next) => {
  try {
    const { id } = req.params

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid work ID format',
      })
    }

    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'mps',
          localField: 'mpName',
          foreignField: 'name',
          as: 'mp_details',
        },
      },
      { $unwind: { path: '$mp_details', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          work_id: { $ifNull: ['$workId', '$work_id'] },
          work_description: { $ifNull: ['$workDescription', '$work_description'] },
          work_description_hi: { $ifNull: ['$workDescription', '$work_description'] },
          category: { $ifNull: ['$workCategory', '$category'] },
          category_hi: { $ifNull: ['$workCategory', '$category'] },
          estimated_cost: { $toDouble: { $ifNull: ['$recommendedAmount', '$estimated_cost'] } },
          recommended_date: { $ifNull: ['$recommendationDate', '$recommended_date'] },
          recommended_year: {
            $year: { $ifNull: ['$recommendationDate', { $toDate: '$recommended_date' }] },
          },
          status: { $ifNull: ['$status', 'Recommended'] },
          status_hi: { $ifNull: ['$status', 'Recommended'] },
          location: { $ifNull: ['$ida', '$location'] },
          location_hi: { $ifNull: ['$ida', '$location'] },
          district: { $ifNull: ['$constituency', '$district'] },
          district_hi: { $ifNull: ['$constituency', '$district'] },
          state: 1,
          state_hi: '$state',
          expected_beneficiaries: { $toInt: { $ifNull: ['$expected_beneficiaries', 0] } },
          priority: 1,
          priority_hi: '$priority',
          implementing_agency: { $ifNull: ['$implementing_agency', null] },
          implementing_agency_hi: { $ifNull: ['$implementing_agency', null] },
          gps_coordinates: {
            latitude: '$latitude',
            longitude: '$longitude',
          },
          status_timeline: '$timeline',
          approval_status: '$approval_details',
          expected_completion_date: { $ifNull: ['$expected_completion_date', null] },
          funding_source: { $ifNull: ['$funding_source', null] },
          environmental_clearance: { $ifNull: ['$environmental_clearance', null] },
          technical_feasibility: { $ifNull: ['$technical_feasibility', null] },
          mp_details: {
            _id: '$mp_details._id',
            name: '$mp_details.name',
            name_hi: '$mp_details.name',
            constituency: '$mp_details.constituency',
            constituency_hi: '$mp_details.constituency',
            house: '$mp_details.house',
          },
          created_at: { $ifNull: ['$created_at', '$createdAt'] },
          updated_at: { $ifNull: ['$updated_at', '$updatedAt'] },
        },
      },
    ]

    const [work] = await WorksRecommended.aggregate(pipeline)

    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Recommended work not found',
      })
    }

    res.json({
      success: true,
      data: work,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/works/:workId/payments - Get payment details for a specific work
const getWorkPayments = async (req, res, next) => {
  try {
    const { workId, recommendationId } = req.params

    // Find all payments for this work ID or recommendation ID
    let query
    if (workId) {
      // Try to parse as number first, fallback to string if it fails
      const wid = parseInt(workId, 10)
      if (!Number.isNaN(wid)) {
        query = { workId: wid }
      } else {
        // If workId contains non-numeric characters, try exact string match
        query = { workId: workId }
      }
    } else if (recommendationId) {
      const rid = parseInt(recommendationId, 10)
      if (!Number.isNaN(rid)) {
        // Expenditures join on workId for recommended works as well
        query = { workId: rid }
      } else {
        // Exact string match for recommendationId
        query = { workId: recommendationId }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either workId or recommendationId is required',
      })
    }

    const payments = await Expenditure.find(query)
      .sort({ expenditureDate: -1 }) // Latest payments first
      .select({
        expenditureAmount: 1,
        expenditureDate: 1,
        paymentStatus: 1,
        vendor: 1,
        ida: 1,
        work: 1,
        mpName: 1,
        constituency: 1,
      })

    if (!payments || payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No payment records found for this work',
      })
    }

    // Calculate payment summary with proper validation
    const totalPaid = payments.reduce((sum, payment) => {
      const amount = parseFloat(payment.expenditureAmount) || 0
      return sum + (Number.isFinite(amount) ? amount : 0)
    }, 0)
    const successfulPayments = payments.filter(p => p.paymentStatus === 'Payment Success')
    const pendingPayments = payments.filter(p => p.paymentStatus !== 'Payment Success')

    // Group payments by date for better visualization
    const paymentsByDate = payments.reduce((acc, payment) => {
      const date = payment.expenditureDate
        ? payment.expenditureDate.toISOString().split('T')[0]
        : 'Unknown'
      if (!acc[date]) {
        acc[date] = {
          date,
          payments: [],
          totalAmount: 0,
          count: 0,
        }
      }
      acc[date].payments.push({
        amount: payment.expenditureAmount,
        vendor: payment.vendor,
        status: payment.paymentStatus,
        ida: payment.ida,
      })
      acc[date].totalAmount += payment.expenditureAmount || 0
      acc[date].count += 1
      return acc
    }, {})

    const paymentTimeline = Object.values(paymentsByDate).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )

    res.json({
      success: true,
      data: {
        workId: workId ? parseInt(workId, 10) : parseInt(recommendationId, 10),
        workDetails: {
          description: payments[0]?.work,
          mpName: payments[0]?.mpName,
          constituency: payments[0]?.constituency,
          ida: payments[0]?.ida,
        },
        summary: {
          totalInstallments: payments.length,
          totalAmountPaid: totalPaid,
          successfulPayments: successfulPayments.length,
          pendingPayments: pendingPayments.length,
          firstPaymentDate: payments[payments.length - 1]?.expenditureDate,
          lastPaymentDate: payments[0]?.expenditureDate,
        },
        paymentTimeline,
        allPayments: payments.map(payment => ({
          amount: payment.expenditureAmount,
          date: payment.expenditureDate,
          status: payment.paymentStatus,
          vendor: payment.vendor,
          ida: payment.ida,
        })),
      },
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getCompletedWorks,
  getRecommendedWorks,
  getWorkCategories,
  getConstituencies,
  getCompletedWorkDetails,
  getRecommendedWorkDetails,
  getWorkPayments,
}
