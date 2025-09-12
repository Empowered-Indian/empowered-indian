/**
 * Metadata Manager - Tracks data update timestamps and scheduling
 */

/**
 * Calculate next update time based on update frequency
 * @param {string} frequency - 'daily', 'weekly', 'bi-weekly' 
 * @returns {Date} Next update date
 */
function calculateNextUpdate(frequency = 'daily') {
    const now = new Date();
    const nextUpdate = new Date(now);
    
    switch (frequency.toLowerCase()) {
        case 'daily':
            nextUpdate.setDate(now.getDate() + 1);
            nextUpdate.setHours(2, 0, 0, 0); // 2 AM next day
            break;
            
        case 'weekly':
            const daysUntilMonday = (7 - now.getDay() + 1) % 7 || 7;
            nextUpdate.setDate(now.getDate() + daysUntilMonday);
            nextUpdate.setHours(2, 0, 0, 0); // 2 AM Monday
            break;
            
        case 'bi-weekly':
            nextUpdate.setDate(now.getDate() + 14);
            nextUpdate.setHours(2, 0, 0, 0); // 2 AM in 2 weeks
            break;
            
        default:
            nextUpdate.setDate(now.getDate() + 1);
            nextUpdate.setHours(2, 0, 0, 0);
    }
    
    return nextUpdate;
}

/**
 * Format date for display in footer
 * @param {Date} date 
 * @returns {string} Formatted date string
 */
function formatDateForFooter(date) {
    // Format: "8/9/2025" (M/D/YYYY)
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

/**
 * Format next update time for display
 * @param {Date} nextUpdate 
 * @returns {string} Human readable next update info
 */
function formatNextUpdateInfo(nextUpdate) {
    const now = new Date();
    const diffMs = nextUpdate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) {
        return `in ${diffHours} hours`;
    } else if (diffDays === 1) {
        return 'tomorrow';
    } else {
        return `in ${diffDays} days`;
    }
}

/**
 * Create or update data sync metadata in database
 */
async function updateDataSyncMetadata(db, syncStats) {
    const metadataCollection = db.collection('data_sync_metadata');
    
    const now = new Date();
    const nextUpdate = calculateNextUpdate(process.env.UPDATE_FREQUENCY || 'daily');
    
    const metadata = {
        lastUpdated: now,
        lastUpdatedFormatted: formatDateForFooter(now),
        nextUpdate: nextUpdate,
        nextUpdateFormatted: formatDateForFooter(nextUpdate),
        nextUpdateInfo: formatNextUpdateInfo(nextUpdate),
        source: 'Official MPLADS Portal API',
        syncStats: {
            totalRecords: syncStats.totalRecords || 0,
            lokSabhaRecords: syncStats.lokSabhaRecords || 0,
            rajyaSabhaRecords: syncStats.rajyaSabhaRecords || 0,
            allocations: syncStats.allocations || 0,
            expenditures: syncStats.expenditures || 0,
            worksCompleted: syncStats.worksCompleted || 0,
            worksRecommended: syncStats.worksRecommended || 0,
            mps: syncStats.mps || 0,
            syncDurationSeconds: syncStats.duration || 0,
            dataQuality: syncStats.dataQuality || 100
        },
        updateFrequency: process.env.UPDATE_FREQUENCY || 'daily',
        version: '1.0.0',
        createdAt: now,
        updatedAt: now
    };
    
    // Upsert the metadata (insert if doesn't exist, update if exists)
    await metadataCollection.replaceOne(
        { source: 'Official MPLADS Portal API' },
        metadata,
        { upsert: true }
    );
    
    console.log('📊 Data sync metadata updated:');
    console.log(`   Last Updated: ${metadata.lastUpdatedFormatted}`);
    console.log(`   Next Update: ${metadata.nextUpdateFormatted} (${metadata.nextUpdateInfo})`);
    console.log(`   Total Records: ${metadata.syncStats.totalRecords.toLocaleString()}`);
    console.log(`   Data Quality: ${metadata.syncStats.dataQuality}%`);
    
    return metadata;
}

/**
 * Get current data sync metadata for frontend use
 */
async function getDataSyncMetadata(db) {
    const metadataCollection = db.collection('data_sync_metadata');
    const metadata = await metadataCollection.findOne({ source: 'Official MPLADS Portal API' });
    
    if (!metadata) {
        return {
            lastUpdated: null,
            lastUpdatedFormatted: 'Never',
            nextUpdate: null,
            nextUpdateFormatted: 'TBD',
            nextUpdateInfo: 'pending first sync',
            source: 'Official MPLADS Portal API',
            syncStats: {
                totalRecords: 0
            }
        };
    }
    
    // Update the "next update info" in case time has passed
    if (metadata.nextUpdate) {
        metadata.nextUpdateInfo = formatNextUpdateInfo(new Date(metadata.nextUpdate));
    }
    
    return metadata;
}

/**
 * Check if data needs updating based on schedule
 */
async function shouldUpdateData(db) {
    const metadata = await getDataSyncMetadata(db);
    
    if (!metadata.nextUpdate) {
        return true; // First time sync
    }
    
    const now = new Date();
    const nextUpdate = new Date(metadata.nextUpdate);
    
    return now >= nextUpdate;
}

/**
 * Create API endpoint response for frontend footer
 */
function createFooterDataResponse(metadata) {
    return {
        source: metadata.source,
        lastUpdated: metadata.lastUpdatedFormatted,
        nextUpdate: metadata.nextUpdateInfo,
        totalRecords: metadata.syncStats.totalRecords,
        dataQuality: metadata.syncStats.dataQuality,
        updateFrequency: metadata.updateFrequency
    };
}

module.exports = {
    calculateNextUpdate,
    formatDateForFooter,
    formatNextUpdateInfo,
    updateDataSyncMetadata,
    getDataSyncMetadata,
    shouldUpdateData,
    createFooterDataResponse
};