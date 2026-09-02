#!/usr/bin/env node

/**
 * MPLADS API Automation - Main Entry Point
 *
 * This replaces the manual CSV download and processing workflow
 * with automated API data fetching and real-time database updates.
 *
 * Features:
 * - Fetches live data from MPLADS API
 * - Applies same data cleaning as CSV processor
 * - Maintains identical database schema
 * - Provides real-time data updates
 *
 * Usage:
 *   npm start              # Run complete sync process
 *   npm run sync           # Same as npm start
 *   npm run fetch-only     # Test API fetching only
 *   npm run test-transform # Test data transformation only
 */

const { syncMPLADSDataFromAPI } = require('./src/api-uploader')

// Display banner
console.log('')
console.log('🏛️  MPLADS API AUTOMATION SYSTEM')
console.log(
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
)
console.log('📋 Replaces: Manual CSV download and processing')
console.log('🔄 Provides: Real-time API data fetching and sync')
console.log('✅ Maintains: Identical database schema and data format')
console.log('🚀 Benefits: Fresh data, automated updates, no manual work')
console.log('☁️  Target: MongoDB Atlas Cloud Database (empowered_indian_db)')
console.log(
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
)
console.log('')

// Handle command line arguments
const args = process.argv.slice(2)

const lsTermOption = 'both'

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage:')
  console.log('  node index.js                # Run complete sync process')
  console.log('  node index.js --fetch-only   # Test API fetching only')
  console.log('  Full 17th + 18th Lok Sabha sync is always used for metric consistency')
  console.log('  node index.js --help         # Show this help message')
  console.log('')
  console.log('Environment Variables:')
  console.log('  MONGODB_URI    # MongoDB connection string')
  console.log('  DATABASE_NAME  # Database name (default: mplads_dashboard)')
  console.log('')
  process.exit(0)
}

if (args.includes('--fetch-only')) {
  console.log('🧪 Running in FETCH-ONLY mode (no database upload)')
  const MPLADSApiClient = require('./src/mplads-api-client')
  const apiClient = new MPLADSApiClient()

  apiClient
    .fetchAllData(lsTermOption)
    .then(data => {
      console.log('\n✅ API fetch test completed successfully!')
      const ls18 = data.lok_sabha_18 || {}
      const ls17 = data.lok_sabha_17 || {}
      const rs = data.rajya_sabha || {}
      console.log('📊 Data summary:', {
        'Lok Sabha (18) Works Completed': ls18.works_completed?.length || 0,
        'Lok Sabha (18) Works Recommended': ls18.works_recommended?.length || 0,
        'Lok Sabha (17) Works Completed': ls17.works_completed?.length || 0,
        'Lok Sabha (17) Works Recommended': ls17.works_recommended?.length || 0,
        'Rajya Sabha Works Completed': rs.works_completed?.length || 0,
        'Rajya Sabha Works Recommended': rs.works_recommended?.length || 0,
      })
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ API fetch test failed:', error.message)
      process.exit(1)
    })
} else {
  // Run complete sync process
  console.log(`🧭 LS term option: ${lsTermOption}`)
  syncMPLADSDataFromAPI({ lsTerm: lsTermOption })
    .then(() => {
      console.log('🎉 API automation completed successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 API automation failed:', error.message)
      process.exit(1)
    })
}
