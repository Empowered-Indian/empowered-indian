const express = require('express')
const router = express.Router()
const {
  exportCompletedWorksCSV,
  exportRecommendedWorksCSV,
  exportExpendituresCSV,
  exportMPSummaryCSV,
} = require('../controllers/exportController')
const { strictSanitization } = require('../middleware/sanitization')
const { exportLimiter } = require('../middleware/rateLimiting')
const { validate } = require('../middleware/validation')

// Enhanced security middleware for export routes
// Apply strict input sanitization and rate limiting
router.use(strictSanitization)
router.use(exportLimiter)

// GET /api/export/completed-works - Export completed works as CSV
router.get('/completed-works', validate('pagination+worksFilters'), exportCompletedWorksCSV)

// GET /api/export/recommended-works - Export recommended works as CSV
router.get('/recommended-works', validate('pagination+worksFilters'), exportRecommendedWorksCSV)

// GET /api/export/expenditures - Export expenditures as CSV
router.get('/expenditures', validate('pagination+expenditureFilters'), exportExpendituresCSV)

// GET /api/export/mp-summary - Export MP performance summary as CSV
router.get('/mp-summary', validate('pagination+mpFilters'), exportMPSummaryCSV)

module.exports = router
