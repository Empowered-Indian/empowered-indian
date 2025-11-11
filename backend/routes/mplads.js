const express = require('express')
const router = express.Router()
const { cacheMiddleware } = require('../middleware/cache')
const {
  searchMPs,
  getConstituencyDetails,
  getSectorWiseData,
  getYearWiseTrends,
  getAvailableTerms,
} = require('../controllers/mpController')
const { strictSanitization } = require('../middleware/sanitization')
const { searchLimiter } = require('../middleware/rateLimiting')
const { validate } = require('../middleware/validation')

// Cache for different durations based on data volatility
const cache24h = cacheMiddleware(24 * 60 * 60)
const cache12h = cacheMiddleware(12 * 60 * 60)
const cache6h = cacheMiddleware(6 * 60 * 60)

// Apply security middleware to all MPLADS routes
router.use(strictSanitization)
router.use(searchLimiter)

// GET /api/mplads/search?q=:query - Search MPs by name or constituency
router.get(
  '/search',
  validate('mpFilters', { sanitize: false }), // Already sanitized by router middleware
  cache6h,
  searchMPs
)

// GET /api/mplads/constituencies/:id - Constituency details
router.get('/constituencies/:id', cache24h, getConstituencyDetails)

// GET /api/mplads/sectors - Sector-wise allocation data
router.get('/sectors', cache24h, getSectorWiseData)

// GET /api/mplads/trends - Year-wise expenditure trends
router.get(
  '/trends',
  validate('analyticsFilters', { sanitize: false }),
  cache12h,
  getYearWiseTrends
)

// GET /api/mplads/terms - Available LS terms
router.get('/terms', cache24h, getAvailableTerms)
module.exports = router
