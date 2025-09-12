const { MongoClient } = require('mongodb');
const MPLADSApiClient = require('./mplads-api-client');
const { transformAllData } = require('./data-transformer');
const { validateAllData } = require('./data-validator');
const { updateDataSyncMetadata } = require('./metadata-manager');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/empowered_indian';
const DATABASE_NAME = process.env.DATABASE_NAME || 'empowered_indian_db';

// Collection names (same as existing system)
const COLLECTIONS = {
    MPs: 'mps',
    ALLOCATIONS: 'allocations',
    EXPENDITURES: 'expenditures',
    WORKS_COMPLETED: 'works_completed',
    WORKS_RECOMMENDED: 'works_recommended',
    SUMMARIES: 'summaries'
};

/**
 * Validation function to check if a record is valid (same as existing CSV uploader)
 */
function isValidRecord(record) {
    const state = (record.state || '').toString().trim();
    const mpName = (record.mpName || '').toString().trim();
    const house = (record.house || '').toString().trim();
    
    // Must have valid state, MP name, and house
    if (!state || !mpName || !house) {
        return false;
    }
    
    // State and MP name must be more than just whitespace
    if (state.length <= 1 || mpName.length <= 1) {
        return false;
    }
    
    // Check for Grand Total or summary rows
    if (state.toLowerCase().includes('total') || 
        mpName.toLowerCase().includes('total') ||
        state.toLowerCase().includes('grand')) {
        return false;
    }
    
    return true;
}

/**
 * Upload MPs data (extracted from allocations) - same logic as CSV uploader
 */
async function uploadMPs(db, allAllocations) {
    const mpsCollection = db.collection(COLLECTIONS.MPs);
    
    // Extract unique MPs
    const mpsMap = new Map();
    
    allAllocations.forEach(allocation => {
        // Include constituency or state in the key to avoid name collisions
        const scope = allocation.constituency || allocation.state || '';
        const key = `${allocation.mpName}|${allocation.house}|${scope}`;
        if (!mpsMap.has(key)) {
            mpsMap.set(key, {
                name: allocation.mpName,
                house: allocation.house,
                state: allocation.state,
                constituency: allocation.constituency
            });
        }
    });
    
    const mps = Array.from(mpsMap.values());
    
    // Clear existing data only for the houses we're updating to avoid wiping unrelated data on partial runs
    const housesPresent = Array.from(new Set(mps.map(m => m.house))).filter(Boolean);
    for (const house of housesPresent) {
        await mpsCollection.deleteMany({ house });
    }
    if (mps.length > 0) {
        await mpsCollection.insertMany(mps);
        console.log(`✅ Uploaded ${mps.length} MPs`);
    }
    
    // Create indexes for faster queries (with error handling)
    try {
        await mpsCollection.createIndex({ name: 1, house: 1 }, { background: true });
    } catch (indexError) {
        console.warn('Warning: Could not create MP index:', indexError.message);
    }
    
    return mps;
}

/**
 * Upload allocation data - same logic as CSV uploader
 */
async function uploadAllocations(db, transformedData) {
    const collection = db.collection(COLLECTIONS.ALLOCATIONS);
    
    const allAllocations = [
        ...transformedData.lok_sabha.allocated_limit,
        ...transformedData.rajya_sabha.allocated_limit
    ]
    .filter(isValidRecord)
    .map(row => ({
        mpName: row.mpName,
        house: row.house,
        state: row.state,
        constituency: row.constituency,
        allocatedAmount: parseFloat(row.allocatedAmount) || 0,
        lsTerm: row.lsTerm ?? null,
        createdAt: new Date()
    }));
    
    // Clear existing data only for the scopes we're updating and insert new with error handling
    try {
        // Determine which scopes to refresh
        const lsTerms = new Set(
            (transformedData.lok_sabha.allocated_limit || [])
                .map(r => r.lsTerm)
                .filter(v => v !== undefined)
        );

        for (const term of lsTerms) {
            await collection.deleteMany({ house: 'Lok Sabha', lsTerm: term });
        }
        if ((transformedData.rajya_sabha.allocated_limit || []).length > 0) {
            await collection.deleteMany({ house: 'Rajya Sabha' });
        }

        if (allAllocations.length > 0) {
            // Insert in batches to handle large datasets
            const batchSize = 1000;
            for (let i = 0; i < allAllocations.length; i += batchSize) {
                const batch = allAllocations.slice(i, i + batchSize);
                await collection.insertMany(batch, { ordered: false });
            }
            console.log(`✅ Uploaded ${allAllocations.length} allocation records`);
        }
        
        // Create indexes with error handling
        try {
            await collection.createIndex({ mpName: 1, house: 1, lsTerm: 1 }, { background: true });
            await collection.createIndex({ state: 1, house: 1, lsTerm: 1 }, { background: true });
        } catch (indexError) {
            console.warn('Warning: Could not create allocation indexes:', indexError.message);
        }
    } catch (uploadError) {
        console.error('Error uploading allocations:', uploadError.message);
        throw new Error(`Failed to upload allocations: ${uploadError.message}`);
    }
    
    return allAllocations;
}

/**
 * Upload expenditure data - same logic as CSV uploader
 */
async function uploadExpenditures(db, transformedData) {
    const collection = db.collection(COLLECTIONS.EXPENDITURES);
    const mpsCollection = db.collection(COLLECTIONS.MPs);
    // Build a quick lookup map for MP identity -> _id
    const mpDocs = await mpsCollection.find({}, { projection: { name: 1, house: 1, constituency: 1 } }).toArray();
    const mpKeyToId = new Map();
    mpDocs.forEach(d => {
      const key = `${(d.name||'').trim().toLowerCase()}|${(d.house||'').trim()}|${(d.constituency||'').trim().toLowerCase()}`;
      if (d._id) mpKeyToId.set(key, d._id);
    });
    
    const allExpenditures = [
        ...transformedData.lok_sabha.expenditure,
        ...transformedData.rajya_sabha.expenditure
    ]
    .filter(isValidRecord)
    .map(row => {
        const key = `${(row.mpName||'').trim().toLowerCase()}|${(row.house||'').trim()}|${(row.constituency||'').trim().toLowerCase()}`;
        const mpId = mpKeyToId.get(key) || null;
        return {
          workId: row.workId,
          mpName: row.mpName,
          mp_id: mpId, // enable reliable joins
          house: row.house,
          state: row.state,
          constituency: row.constituency,
          work: row.work,
          vendor: row.vendor || null,
          ida: row.ida,
          expenditureDate: row.expenditureDate ? new Date(row.expenditureDate) : null,
          paymentStatus: row.paymentStatus,
          expenditureAmount: parseFloat(row.expenditureAmount) || 0,
          lsTerm: row.lsTerm ?? null,
          createdAt: new Date()
        };
    });
    
    // Clear existing data only for the scopes we're updating
    const lsTerms = new Set((transformedData.lok_sabha.expenditure || []).map(r => r.lsTerm).filter(v => v !== undefined));
    for (const term of lsTerms) {
        await collection.deleteMany({ house: 'Lok Sabha', lsTerm: term });
    }
    if ((transformedData.rajya_sabha.expenditure || []).length > 0) {
        await collection.deleteMany({ house: 'Rajya Sabha' });
    }
    if (allExpenditures.length > 0) {
        await collection.insertMany(allExpenditures);
        console.log(`✅ Uploaded ${allExpenditures.length} expenditure records`);
    }
    
    // Create indexes
    await collection.createIndex({ mpName: 1, house: 1, lsTerm: 1 });
    await collection.createIndex({ state: 1, house: 1, lsTerm: 1 });
    await collection.createIndex({ expenditureDate: -1 });
    await collection.createIndex({ paymentStatus: 1 });
    // Optimize lookups by workId for payments queries
    try {
      await collection.createIndex({ workId: 1 }, { background: true });
    } catch (indexError) {
      console.warn('Warning: Could not create expenditures.workId index:', indexError.message);
    }
}

/**
 * Upload works completed data - same logic as CSV uploader
 */
async function uploadWorksCompleted(db, transformedData) {
    const collection = db.collection(COLLECTIONS.WORKS_COMPLETED);
    const mpsCollection = db.collection(COLLECTIONS.MPs);
    const mpDocs = await mpsCollection.find({}, { projection: { name: 1, house: 1, constituency: 1 } }).toArray();
    const mpKeyToId = new Map();
    mpDocs.forEach(d => {
      const key = `${(d.name||'').trim().toLowerCase()}|${(d.house||'').trim()}|${(d.constituency||'').trim().toLowerCase()}`;
      if (d._id) mpKeyToId.set(key, d._id);
    });
    
    const allWorksRaw = [
        ...transformedData.lok_sabha.works_completed,
        ...transformedData.rajya_sabha.works_completed
    ]
    .filter(isValidRecord)
    .map(row => {
        const key = `${(row.mpName||'').trim().toLowerCase()}|${(row.house||'').trim()}|${(row.constituency||'').trim().toLowerCase()}`;
        const mpId = mpKeyToId.get(key) || null;
        return {
          mpName: row.mpName,
          mp_id: mpId,
          house: row.house,
          state: row.state,
          constituency: row.constituency,
          workCategory: row.workCategory,
          workId: row.workId,
          ida: row.ida,
          workDescription: row.workDescription,
          completedDate: row.completedDate ? new Date(row.completedDate) : null,
          hasImage: row.hasImage === true,
          averageRating: row.averageRating ? parseFloat(row.averageRating) : null,
          finalAmount: parseFloat(row.finalAmount) || 0,
          lsTerm: row.lsTerm ?? null,
          createdAt: new Date()
        };
    });

    // De-duplicate within the batch on (house, lsTerm, state, workId)
    const wcMap = new Map();
    for (const rec of allWorksRaw) {
        const key = `${rec.house}|${rec.lsTerm ?? 'null'}|${rec.state}|${rec.workId}`;
        // Prefer record with a completedDate (latest, lexicographically since YYYY-MM-DD)
        const existing = wcMap.get(key);
        if (!existing) {
            wcMap.set(key, rec);
        } else {
            const a = existing.completedDate || '';
            const b = rec.completedDate || '';
            if (b > a) wcMap.set(key, rec);
        }
    }
    const allWorks = Array.from(wcMap.values());
    if (allWorks.length !== allWorksRaw.length) {
        console.log(`ℹ️  Deduplicated works_completed: kept ${allWorks.length} of ${allWorksRaw.length}`);
    }
    
    // Clear existing data only for the scopes we're updating
    const lsTerms = new Set((transformedData.lok_sabha.works_completed || []).map(r => r.lsTerm).filter(v => v !== undefined));
    for (const term of lsTerms) {
        await collection.deleteMany({ house: 'Lok Sabha', lsTerm: term });
    }
    if ((transformedData.rajya_sabha.works_completed || []).length > 0) {
        await collection.deleteMany({ house: 'Rajya Sabha' });
    }
    if (allWorks.length > 0) {
        await collection.insertMany(allWorks, { ordered: false });
        console.log(`✅ Uploaded ${allWorks.length} completed works`);
    }
    
    // Create indexes
    await collection.createIndex({ mpName: 1, house: 1, lsTerm: 1 });
    await collection.createIndex({ state: 1, house: 1, lsTerm: 1 });
    await collection.createIndex({ completedDate: -1 });
    await collection.createIndex({ workId: 1 });
    // Ensure uniqueness of a work within a house/term/state to prevent double counting
    try {
        await collection.createIndex({ house: 1, lsTerm: 1, state: 1, workId: 1 }, { unique: true, background: true });
    } catch (indexError) {
        console.warn('Warning: Could not create unique index for works_completed:', indexError.message);
    }
}

/**
 * Upload works recommended data - same logic as CSV uploader
 */
async function uploadWorksRecommended(db, transformedData) {
    const collection = db.collection(COLLECTIONS.WORKS_RECOMMENDED);
    const mpsCollection = db.collection(COLLECTIONS.MPs);
    const mpDocs = await mpsCollection.find({}, { projection: { name: 1, house: 1, constituency: 1 } }).toArray();
    const mpKeyToId = new Map();
    mpDocs.forEach(d => {
      const key = `${(d.name||'').trim().toLowerCase()}|${(d.house||'').trim()}|${(d.constituency||'').trim().toLowerCase()}`;
      if (d._id) mpKeyToId.set(key, d._id);
    });
    
    const allWorksRaw = [
        ...transformedData.lok_sabha.works_recommended,
        ...transformedData.rajya_sabha.works_recommended
    ]
    .filter(isValidRecord)
    .map(row => {
        const key = `${(row.mpName||'').trim().toLowerCase()}|${(row.house||'').trim()}|${(row.constituency||'').trim().toLowerCase()}`;
        const mpId = mpKeyToId.get(key) || null;
        return {
          mpName: row.mpName,
          mp_id: mpId,
          house: row.house,
          state: row.state,
          constituency: row.constituency,
          workCategory: row.workCategory,
          workId: row.workId,
          ida: row.ida,
          workDescription: row.workDescription,
          recommendationDate: row.recommendationDate ? new Date(row.recommendationDate) : null,
          hasImage: row.hasImage === true,
          recommendedAmount: parseFloat(row.recommendedAmount) || 0,
          lsTerm: row.lsTerm ?? null,
          createdAt: new Date()
        };
    });

    // De-duplicate within the batch on (house, lsTerm, state, workId)
    // Keep the record with the latest recommendationDate, and if tied, the larger recommendedAmount
    const wrMap = new Map();
    for (const rec of allWorksRaw) {
        const key = `${rec.house}|${rec.lsTerm ?? 'null'}|${rec.state}|${rec.workId}`;
        const existing = wrMap.get(key);
        if (!existing) {
            wrMap.set(key, rec);
        } else {
            const aDate = existing.recommendationDate || '';
            const bDate = rec.recommendationDate || '';
            if (bDate > aDate) {
                wrMap.set(key, rec);
            } else if (bDate === aDate) {
                const aAmt = existing.recommendedAmount || 0;
                const bAmt = rec.recommendedAmount || 0;
                if (bAmt >= aAmt) wrMap.set(key, rec);
            }
        }
    }
    const allWorks = Array.from(wrMap.values());
    if (allWorks.length !== allWorksRaw.length) {
        console.log(`ℹ️  Deduplicated works_recommended: kept ${allWorks.length} of ${allWorksRaw.length}`);
    }
    
    // Clear existing data only for the scopes we're updating
    const lsTerms = new Set((transformedData.lok_sabha.works_recommended || []).map(r => r.lsTerm).filter(v => v !== undefined));
    for (const term of lsTerms) {
        await collection.deleteMany({ house: 'Lok Sabha', lsTerm: term });
    }
    if ((transformedData.rajya_sabha.works_recommended || []).length > 0) {
        await collection.deleteMany({ house: 'Rajya Sabha' });
    }
    if (allWorks.length > 0) {
        await collection.insertMany(allWorks, { ordered: false });
        console.log(`✅ Uploaded ${allWorks.length} recommended works`);
    }
    
    // Create indexes
    await collection.createIndex({ mpName: 1, house: 1, lsTerm: 1 });
    await collection.createIndex({ state: 1, house: 1, lsTerm: 1 });
    await collection.createIndex({ recommendationDate: -1 });
    await collection.createIndex({ workId: 1 });
    try {
        await collection.createIndex({ house: 1, lsTerm: 1, state: 1, workId: 1 }, { unique: true, background: true });
    } catch (indexError) {
        console.warn('Warning: Could not create unique index for works_recommended:', indexError.message);
    }
}

/**
 * Calculate and store summaries (same logic as CSV uploader)
 */
async function calculateSummaries(db) {
    const summariesCollection = db.collection(COLLECTIONS.SUMMARIES);
    
    // Clear existing summaries
    await summariesCollection.deleteMany({});
    
    // Calculate MP-wise summaries with enhanced metrics
    const mpSummaries = await db.collection(COLLECTIONS.ALLOCATIONS).aggregate([
        {
            $lookup: {
                from: COLLECTIONS.EXPENDITURES,
                let: { mpName: '$mpName', house: '$house', lsTerm: '$lsTerm', state: '$state', constituency: '$constituency' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$mpName', '$$mpName'] },
                                    { $eq: ['$house', '$$house'] },
                                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] },
                                    { $eq: ['$state', '$$state'] },
                                    { $eq: ['$constituency', '$$constituency'] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalExpenditure: { $sum: '$expenditureAmount' },
                            transactionCount: { $sum: 1 },
                            successfulPayments: { 
                                $sum: { 
                                    $cond: [{ $eq: ['$paymentStatus', 'Payment Success'] }, 1, 0] 
                                } 
                            },
                            pendingPayments: { 
                                $sum: { 
                                    $cond: [{ $eq: ['$paymentStatus', 'Payment In-Progress'] }, 1, 0] 
                                } 
                            }
                        }
                    }
                ],
                as: 'expenditureData'
            }
        },
        {
            $lookup: {
                from: COLLECTIONS.WORKS_COMPLETED,
                let: { mpName: '$mpName', house: '$house', lsTerm: '$lsTerm', state: '$state', constituency: '$constituency' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$mpName', '$$mpName'] },
                                    { $eq: ['$house', '$$house'] },
                                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] },
                                    { $eq: ['$state', '$$state'] },
                                    { $eq: ['$constituency', '$$constituency'] }
                                ]
                            }
                        }
                    },
                    // Deduplicate by workId first
                    {
                        $group: {
                            _id: '$workId',
                            finalAmount: { $max: '$finalAmount' },
                            hasImageInt: { $max: { $cond: ['$hasImage', 1, 0] } },
                            averageRating: { $avg: '$averageRating' }
                        }
                    },
                    // Aggregate deduped results
                    {
                        $group: {
                            _id: null,
                            completedWorksCount: { $sum: 1 },
                            totalCompletedAmount: { $sum: '$finalAmount' },
                            worksWithImages: { $sum: '$hasImageInt' },
                            avgRating: { $avg: '$averageRating' }
                        }
                    }
                ],
                as: 'completedWorksData'
            }
        },
        {
            $lookup: {
                from: COLLECTIONS.WORKS_RECOMMENDED,
                let: { mpName: '$mpName', house: '$house', lsTerm: '$lsTerm', state: '$state', constituency: '$constituency' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$mpName', '$$mpName'] },
                                    { $eq: ['$house', '$$house'] },
                                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] },
                                    { $eq: ['$state', '$$state'] },
                                    { $eq: ['$constituency', '$$constituency'] }
                                ]
                            }
                        }
                    },
                    // Deduplicate by workId first
                    {
                        $group: {
                            _id: '$workId',
                            recommendedAmount: { $max: '$recommendedAmount' }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            recommendedWorksCount: { $sum: 1 },
                            totalRecommendedAmount: { $sum: '$recommendedAmount' }
                        }
                    }
                ],
                as: 'recommendedWorksData'
            }
        },
        {
            $lookup: {
                from: COLLECTIONS.WORKS_COMPLETED,
                let: { mpName: '$mpName', house: '$house', lsTerm: '$lsTerm', state: '$state', constituency: '$constituency' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$mpName', '$$mpName'] },
                                    { $eq: ['$house', '$$house'] },
                                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] },
                                    { $eq: ['$state', '$$state'] },
                                    { $eq: ['$constituency', '$$constituency'] }
                                ]
                            }
                        }
                    },
                    {
                        $group: { _id: '$workId' }
                    },
                    {
                        $group: { _id: null, completedWorkIds: { $addToSet: '$_id' } }
                    }
                ],
                as: 'completedWorkIds'
            }
        },
        {
            $lookup: {
                from: COLLECTIONS.WORKS_RECOMMENDED,
                let: { 
                    mpName: '$mpName', 
                    house: '$house',
                    completedIds: { $ifNull: [{ $arrayElemAt: ['$completedWorkIds.completedWorkIds', 0] }, []] },
                    lsTerm: '$lsTerm',
                    state: '$state',
                    constituency: '$constituency'
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$mpName', '$$mpName'] },
                                    { $eq: ['$house', '$$house'] },
                                    { $not: { $in: ['$workId', '$$completedIds'] } },
                                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] },
                                    { $eq: ['$state', '$$state'] },
                                    { $eq: ['$constituency', '$$constituency'] }
                                ]
                            }
                        }
                    },
                    // Deduplicate by workId before summing
                    { $group: { _id: '$workId', recommendedAmount: { $max: '$recommendedAmount' } } },
                    {
                        $group: {
                            _id: null,
                            pendingRecommendedAmount: { $sum: '$recommendedAmount' }
                        }
                    }
                ],
                as: 'pendingRecommendedData'
            }
        },
        {
            $addFields: {
                mpName: '$mpName',
                house: '$house',
                lsTerm: { $ifNull: ['$lsTerm', null] },
                state: '$state',
                constituency: '$constituency',
                allocatedAmount: '$allocatedAmount',
                totalExpenditure: { 
                    $ifNull: [{ $arrayElemAt: ['$expenditureData.totalExpenditure', 0] }, 0] 
                },
                transactionCount: { 
                    $ifNull: [{ $arrayElemAt: ['$expenditureData.transactionCount', 0] }, 0] 
                },
                successfulPayments: { 
                    $ifNull: [{ $arrayElemAt: ['$expenditureData.successfulPayments', 0] }, 0] 
                },
                pendingPayments: { 
                    $ifNull: [{ $arrayElemAt: ['$expenditureData.pendingPayments', 0] }, 0] 
                },
                completedWorksCount: { 
                    $ifNull: [{ $arrayElemAt: ['$completedWorksData.completedWorksCount', 0] }, 0] 
                },
                totalCompletedAmount: { 
                    $ifNull: [{ $arrayElemAt: ['$completedWorksData.totalCompletedAmount', 0] }, 0] 
                },
                worksWithImages: { 
                    $ifNull: [{ $arrayElemAt: ['$completedWorksData.worksWithImages', 0] }, 0] 
                },
                avgRating: { 
                    $ifNull: [{ $arrayElemAt: ['$completedWorksData.avgRating', 0] }, null] 
                },
                recommendedWorksCount: { 
                    $ifNull: [{ $arrayElemAt: ['$recommendedWorksData.recommendedWorksCount', 0] }, 0] 
                },
                totalRecommendedAmount: { 
                    $ifNull: [{ $arrayElemAt: ['$recommendedWorksData.totalRecommendedAmount', 0] }, 0] 
                }
            }
        },
        {
            $addFields: {
                // Keep utilizationPercentage for frontend compatibility
                utilizationPercentage: {
                    $cond: [
                        { $gt: ['$allocatedAmount', 0] },
                        { 
                            $min: [
                                { 
                                    $multiply: [
                                        { 
                                            $divide: ['$totalExpenditure', '$allocatedAmount']
                                        },
                                        100
                                    ]
                                },
                                100
                            ]
                        },
                        0
                    ]
                },
                completionRate: {
                    $cond: {
                        if: { $eq: [{ $add: ['$completedWorksCount', '$recommendedWorksCount'] }, 0] },
                        then: 0,
                        else: { 
                            $multiply: [
                                { $divide: [
                                    '$completedWorksCount', 
                                    { $add: ['$completedWorksCount', '$recommendedWorksCount'] }
                                ]}, 
                                100
                            ] 
                        }
                    }
                },
                // Additional metrics
                // Payment breakdown
                completedWorksValue: { $ifNull: ['$totalCompletedAmount', 0] },
                inProgressPayments: { 
                    $subtract: [
                        { $ifNull: ['$totalExpenditure', 0] },
                        { $ifNull: ['$totalCompletedAmount', 0] }
                    ]
                },
                paymentGapPercentage: {
                    $cond: {
                        if: { $eq: ['$totalExpenditure', 0] },
                        then: 0,
                        else: {
                            $multiply: [
                                { $divide: [
                                    { $subtract: ['$totalExpenditure', '$totalCompletedAmount'] },
                                    '$totalExpenditure'
                                ]},
                                100
                            ]
                        }
                    }
                },
                pendingWorks: { $subtract: ['$recommendedWorksCount', '$completedWorksCount'] },
                unspentAmount: { $subtract: ['$allocatedAmount', '$totalExpenditure'] },
                type: 'mp_summary',
                createdAt: new Date()
            }
        }
    ]).toArray();
    
    if (mpSummaries.length > 0) {
        await summariesCollection.insertMany(mpSummaries);
        console.log(`✅ Generated ${mpSummaries.length} MP summaries`);
    }
    
    // Create indexes for summaries
    await summariesCollection.createIndex({ mpName: 1, house: 1, lsTerm: 1 });
    await summariesCollection.createIndex({ state: 1, house: 1, lsTerm: 1 });
    await summariesCollection.createIndex({ utilizationPercentage: -1 });
    await summariesCollection.createIndex({ completionRate: -1 });
    
    // Create overall dashboard summary (required by backend)
    console.log('📊 Creating overall dashboard summary...');
    // Overall summary across all MPs (backward compatible: single doc)
    const overallSummary = await summariesCollection.aggregate([
        {
            $group: {
                _id: null,
                totalMPs: { $sum: 1 },
                totalAllocated: { $sum: '$allocatedAmount' },
                totalExpenditure: { $sum: '$totalExpenditure' },
                totalTransactions: { $sum: '$transactionCount' },
                avgAllocation: { $avg: '$allocatedAmount' },
                totalWorksCompleted: { $sum: '$completedWorksCount' },
                totalWorksRecommended: { $sum: '$recommendedWorksCount' },
                totalRecommendedAmount: { $sum: '$totalRecommendedAmount' },
                totalCompletedWorksValue: { $sum: '$completedWorksValue' },
                totalInProgressPayments: { $sum: '$inProgressPayments' },
                avgCompletionRate: { $avg: '$completionRate' }
            }
        },
        {
            $addFields: {
                overallUtilization: {
                    $cond: {
                        if: { $eq: ['$totalAllocated', 0] },
                        then: 0,
                        else: {
                            $multiply: [
                                { $divide: ['$totalExpenditure', '$totalAllocated'] },
                                100
                            ]
                        }
                    }
                },
                overallPaymentGap: {
                    $cond: {
                        if: { $eq: ['$totalExpenditure', 0] },
                        then: 0,
                        else: {
                            $multiply: [
                                { $divide: ['$totalInProgressPayments', '$totalExpenditure'] },
                                100
                            ]
                        }
                    }
                },
                overallCompletionRate: {
                    $cond: {
                        if: { $eq: ['$totalWorksRecommended', 0] },
                        then: 0,
                        else: {
                            $multiply: [
                                { $divide: ['$totalWorksCompleted', '$totalWorksRecommended'] },
                                100
                            ]
                        }
                    }
                },
                type: 'overall_summary',
                createdAt: new Date()
            }
        }
    ]).toArray();

    if (overallSummary.length > 0) {
        await summariesCollection.insertOne(overallSummary[0]);
        console.log('✅ Created overall dashboard summary');
    }
    
    // Create state-wise summaries (required by backend)
    console.log('📊 Creating state-wise summaries...');
    const stateSummaries = await db.collection(COLLECTIONS.ALLOCATIONS).aggregate([
        {
            $group: {
                _id: { state: '$state', house: '$house', lsTerm: { $ifNull: ['$lsTerm', null] } },
                totalAllocated: { $sum: '$allocatedAmount' },
                mpCount: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: COLLECTIONS.EXPENDITURES,
                let: { state: '$_id.state', house: '$_id.house', lsTerm: '$_id.lsTerm' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$state', '$$state'] },
                                    { $eq: ['$house', '$$house'] },
                                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalExpenditure: { $sum: '$expenditureAmount' }
                        }
                    }
                ],
                as: 'expenditureData'
            }
        },
        {
            $lookup: {
                from: COLLECTIONS.WORKS_RECOMMENDED,
                let: { state: '$_id.state', house: '$_id.house', lsTerm: '$_id.lsTerm' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$state', '$$state'] },
                                    { $eq: ['$house', '$$house'] },
                                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalRecommendedAmount: { $sum: '$recommendedAmount' }
                        }
                    }
                ],
                as: 'recommendedWorksData'
            }
        },
        {
            $lookup: {
                from: COLLECTIONS.WORKS_COMPLETED,
                let: { state: '$_id.state', house: '$_id.house', lsTerm: '$_id.lsTerm' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$state', '$$state'] },
                                    { $eq: ['$house', '$$house'] },
                                    { $eq: [{ $ifNull: ['$lsTerm', null] }, { $ifNull: ['$$lsTerm', null] }] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalCompletedAmount: { $sum: '$finalAmount' }
                        }
                    }
                ],
                as: 'completedWorksData'
            }
        },
        {
            $project: {
                state: '$_id.state',
                house: '$_id.house',
                lsTerm: '$_id.lsTerm',
                totalAllocated: 1,
                mpCount: 1,
                totalExpenditure: { $ifNull: [{ $arrayElemAt: ['$expenditureData.totalExpenditure', 0] }, 0] },
                totalRecommendedAmount: { $ifNull: [{ $arrayElemAt: ['$recommendedWorksData.totalRecommendedAmount', 0] }, 0] },
                totalCompletedAmount: { $ifNull: [{ $arrayElemAt: ['$completedWorksData.totalCompletedAmount', 0] }, 0] },
                // Keep for frontend compatibility
                utilizationPercentage: {
                    $cond: {
                        if: { $eq: ['$totalAllocated', 0] },
                        then: 0,
                        else: { 
                            $min: [
                                { 
                                    $multiply: [
                                        { $divide: [
                                            { $ifNull: [{ $arrayElemAt: ['$expenditureData.totalExpenditure', 0] }, 0] }, 
                                            '$totalAllocated'
                                        ] }, 
                                        100
                                    ]
                                },
                                100
                            ]
                        }
                    }
                },
                type: 'state_summary',
                createdAt: new Date()
            }
        }
    ]).toArray();
    
    if (stateSummaries.length > 0) {
        await summariesCollection.insertMany(stateSummaries);
        console.log(`✅ Created ${stateSummaries.length} state summaries`);
    }
    
    // Create index for state summaries
    await summariesCollection.createIndex({ type: 1 });
    await summariesCollection.createIndex({ state: 1, house: 1, lsTerm: 1 });
    
    return mpSummaries;
}

/**
 * Main function to fetch API data and upload to MongoDB
 */
async function syncMPLADSDataFromAPI(options = {}) {
    const startTime = Date.now();
    const maxRunTime = 30 * 60 * 1000; // 30 minutes max
    
    console.log('🚀 Starting MPLADS API Data Sync...\n');
    console.log('📅 Timestamp:', new Date().toISOString());
    const safeUri = (() => {
        try {
            if (!MONGODB_URI) return 'N/A';
            const m = MONGODB_URI.match(/^(mongodb(?:\+srv)?:\/\/)([^@]*@)?([^\/?]+)(.*)$/);
            if (!m) return '[hidden]';
            const [, protocol, auth, host, rest] = m;
            const redactedAuth = auth ? '[redacted]@' : '';
            return `${protocol}${redactedAuth}${host}${rest ? '/*' : ''}`;
        } catch { return '[hidden]'; }
    })();
    console.log('🔗 MongoDB URI:', safeUri);
    console.log('🗄️  Database:', DATABASE_NAME);
    console.log('⏱️  Max runtime: 30 minutes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Set up timeout protection
    const timeoutId = setTimeout(() => {
        console.error('❌ Operation timed out after 30 minutes');
        process.exit(1);
    }, maxRunTime);

    // MongoDB connection options (same as your backend configuration)
    const mongoOptions = {
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
        minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,
        maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME_MS) || 30000,
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 10000,
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS) || 45000,
        connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
        retryWrites: true,
        w: 'majority',
        heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQUENCY_MS) || 10000,
        appName: process.env.DB_APP_NAME || 'MPLADS-API-Automation'
    };

    const client = new MongoClient(MONGODB_URI, mongoOptions);
    
    try {
        // Connect to MongoDB Atlas
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas Cloud Database');
        console.log(`🗄️  Using database: ${DATABASE_NAME}`);
        console.log(`🔗 Connection pool: ${mongoOptions.minPoolSize}-${mongoOptions.maxPoolSize} connections\n`);
        
        const db = client.db(DATABASE_NAME);
        
        // Initialize API client with manual cookies if available
        console.log('💾 Memory usage before fetch:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
        
        // Check for manual session cookies from environment first
        const manualCookies = process.env.MPLADS_SESSION_COOKIES;
        const apiClient = new MPLADSApiClient(manualCookies);
        
        if (manualCookies) {
            console.log('🔑 Using manual session cookies from environment');
            console.log('🍪 Cookies loaded:', manualCookies.substring(0, 50) + '...');
        } else {
            console.log('🔄 No manual cookies found, attempting automatic session initialization...');
            
            // Try to initialize session automatically
            const sessionInitialized = await apiClient.initializeSession();
            if (!sessionInitialized) {
                console.warn('⚠️  Could not initialize session automatically. API requests may fail.');
                console.log('💡 You can manually set cookies via environment variable MPLADS_SESSION_COOKIES');
            }
        }
        
        const lsTermOption = (options.lsTerm || process.env.LS_TERM || 'both');
        const rawApiData = await apiClient.fetchAllData(lsTermOption);
        console.log('💾 Memory usage after fetch:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
        
        // Transform API data to match CSV format
        // Build combined transformed dataset from LS-18, LS-17, and RS
        const empty = { allocated_limit: [], expenditure: [], works_completed: [], works_recommended: [] };
        const combined = {
            lok_sabha: { ...empty },
            rajya_sabha: { ...empty }
        };

        if (rawApiData.lok_sabha_18) {
            const t18 = transformAllData({ lok_sabha: rawApiData.lok_sabha_18, rajya_sabha: { ...empty } }, { lsTerm: 18 });
            combined.lok_sabha.allocated_limit.push(...t18.lok_sabha.allocated_limit);
            combined.lok_sabha.expenditure.push(...t18.lok_sabha.expenditure);
            combined.lok_sabha.works_completed.push(...t18.lok_sabha.works_completed);
            combined.lok_sabha.works_recommended.push(...t18.lok_sabha.works_recommended);
        }
        if (rawApiData.lok_sabha_17) {
            const t17 = transformAllData({ lok_sabha: rawApiData.lok_sabha_17, rajya_sabha: { ...empty } }, { lsTerm: 17 });
            combined.lok_sabha.allocated_limit.push(...t17.lok_sabha.allocated_limit);
            combined.lok_sabha.expenditure.push(...t17.lok_sabha.expenditure);
            combined.lok_sabha.works_completed.push(...t17.lok_sabha.works_completed);
            combined.lok_sabha.works_recommended.push(...t17.lok_sabha.works_recommended);
        }
        if (rawApiData.rajya_sabha) {
            const trs = transformAllData({ lok_sabha: { ...empty }, rajya_sabha: rawApiData.rajya_sabha }, { lsTerm: null });
            combined.rajya_sabha = trs.rajya_sabha;
        }

        const transformedData = combined;
        
        // Validate data quality before upload
        validateAllData(transformedData);
        
        console.log('\n📤 Starting MongoDB upload process...\n');
        
        // Upload all data types (same order as CSV uploader)
        const allAllocations = await uploadAllocations(db, transformedData);
        await uploadMPs(db, allAllocations);
        await uploadExpenditures(db, transformedData);
        await uploadWorksCompleted(db, transformedData);
        await uploadWorksRecommended(db, transformedData);
        
        // Calculate summaries
        console.log('\n📊 Calculating MP summaries...');
        await calculateSummaries(db);
        
        // Update data sync metadata for frontend
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        console.log('\n📝 Updating data sync metadata...');
        // Get MP count from database
        const mpsCollection = db.collection(COLLECTIONS.MPs);
        const mpCount = await mpsCollection.countDocuments();
        
        const syncStats = {
            totalRecords: allAllocations.length + 
                (transformedData.lok_sabha.expenditure?.length || 0) + 
                (transformedData.rajya_sabha.expenditure?.length || 0) +
                (transformedData.lok_sabha.works_completed?.length || 0) + 
                (transformedData.rajya_sabha.works_completed?.length || 0) +
                (transformedData.lok_sabha.works_recommended?.length || 0) + 
                (transformedData.rajya_sabha.works_recommended?.length || 0),
            lokSabhaRecords: (transformedData.lok_sabha.allocated_limit?.length || 0) + 
                (transformedData.lok_sabha.expenditure?.length || 0) +
                (transformedData.lok_sabha.works_completed?.length || 0) + 
                (transformedData.lok_sabha.works_recommended?.length || 0),
            rajyaSabhaRecords: (transformedData.rajya_sabha.allocated_limit?.length || 0) + 
                (transformedData.rajya_sabha.expenditure?.length || 0) +
                (transformedData.rajya_sabha.works_completed?.length || 0) + 
                (transformedData.rajya_sabha.works_recommended?.length || 0),
            allocations: allAllocations.length,
            expenditures: (transformedData.lok_sabha.expenditure?.length || 0) + (transformedData.rajya_sabha.expenditure?.length || 0),
            worksCompleted: (transformedData.lok_sabha.works_completed?.length || 0) + (transformedData.rajya_sabha.works_completed?.length || 0),
            worksRecommended: (transformedData.lok_sabha.works_recommended?.length || 0) + (transformedData.rajya_sabha.works_recommended?.length || 0),
            mps: mpCount,
            duration: duration,
            dataQuality: 98 // This would come from validation results
        };
        
        await updateDataSyncMetadata(db, syncStats);
        
        console.log('\n✅ MPLADS API data sync completed successfully!');
        console.log('📅 Completed at:', new Date().toISOString());
        console.log(`⏱️  Total runtime: ${duration} seconds`);
        console.log('💾 Final memory usage:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        clearTimeout(timeoutId);
        
    } catch (error) {
        console.error('❌ Error during MPLADS API data sync:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    } finally {
        await client.close();
    }
}

// Run the sync process
if (require.main === module) {
    syncMPLADSDataFromAPI()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = {
    syncMPLADSDataFromAPI,
    uploadAllocations,
    uploadMPs,
    uploadExpenditures,
    uploadWorksCompleted,
    uploadWorksRecommended,
    calculateSummaries
};
