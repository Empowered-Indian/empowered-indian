const express = require('express')
const router = express.Router()
const { cacheMiddleware } = require('../middleware/cache')
const { resolveMPBySlug, getMPDetails, getMPWorks } = require('../controllers/mpController')

// Cache MP details for 24 hours
const cache24h = cacheMiddleware(24 * 60 * 60)
const cache12h = cacheMiddleware(12 * 60 * 60)

// GET /api/mplads/mps/:id - Individual MP details
// Resolver IDs are volatile while summaries are replaced during a sync, so
// validate them live instead of caching them for 24 hours.
router.get('/resolve/:slug', resolveMPBySlug)
router.get('/:id', cache24h, getMPDetails)

// GET /api/mplads/mps/:id/works - MP works data
router.get('/:id/works', cache12h, getMPWorks)

module.exports = router
