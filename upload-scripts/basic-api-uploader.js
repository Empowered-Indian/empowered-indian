#!/usr/bin/env node

/**
 * Basic MPLADS API Uploader
 * 
 * Simple script that fetches fresh data from MPLADS API and uploads to basic collections.
 * No enhanced features, just clean basic data in the original format.
 */

const { syncMPLADSDataFromAPI } = require('./src/api-uploader');

console.log('🔄 Basic MPLADS API Data Sync Starting...');
console.log('📄 Creates basic collections: mps, expenditures, works_completed, works_recommended, summaries');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

syncMPLADSDataFromAPI()
    .then(() => {
        console.log('\n✅ Basic API data sync completed successfully!');
        console.log('🗂️  Collections created: mps, expenditures, works_completed, works_recommended, summaries');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Basic API sync failed:', error.message);
        process.exit(1);
    });