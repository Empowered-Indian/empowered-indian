const express = require('express')
const router = express.Router()
const summaryController = require('../controllers/summaryController')
const { strictSanitization } = require('../middleware/sanitization')
const { cacheMiddleware } = require('../middleware/cache')

// Apply strict sanitization and caching to summary endpoints
router.use(strictSanitization)
const cache12h = cacheMiddleware(12 * 60 * 60)

// Summary routes
router.get('/overview', cache12h, summaryController.getOverview)
router.get('/states', cache12h, summaryController.getStateSummary)
router.get('/mps', cache12h, summaryController.getMPSummary)
router.get('/constituencies', cache12h, summaryController.getConstituencySummary)

module.exports = router
