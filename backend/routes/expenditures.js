const express = require('express')
const router = express.Router()
const { validate } = require('../middleware/validation')
const { cacheMiddleware } = require('../middleware/cache')
const {
  getExpenditures,
  getExpenditureCategories,
} = require('../controllers/expenditureController')

// Cache for 6 hours (expenditure data may be updated more frequently)
const cache6h = cacheMiddleware(6 * 60 * 60)

// GET /api/expenditures - Expenditure list with filters
router.get('/', validate('pagination+expenditureFilters'), cache6h, getExpenditures)

// GET /api/expenditures/categories - Get all expenditure categories
router.get('/categories', cache6h, getExpenditureCategories)

module.exports = router
