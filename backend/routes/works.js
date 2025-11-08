const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const { cacheMiddleware } = require('../middleware/cache');
const { 
  getCompletedWorks, 
  getRecommendedWorks, 
  getWorkCategories,
  getConstituencies,
  getCompletedWorkDetails,
  getRecommendedWorkDetails,
  getWorkPayments
} = require('../controllers/worksController');
const { strictSanitization } = require('../middleware/sanitization');
const { searchLimiter } = require('../middleware/rateLimiting');

// Cache for 12 hours (works data updated less frequently)
const cache12h = cacheMiddleware(12 * 60 * 60);

// Apply security middleware to all works routes
router.use(strictSanitization);
router.use(searchLimiter);

// GET /api/works/completed - Completed works with filters
router.get('/completed', 
  validate('pagination+worksFilters', { sanitize: false }), // Already sanitized by router middleware
  cache12h, 
  getCompletedWorks
);

// GET /api/works/recommended - Recommended works with filters
router.get('/recommended', 
  validate('pagination+worksFilters', { sanitize: false }),
  cache12h, 
  getRecommendedWorks
);

// GET /api/works/categories - Get work categories for both completed and recommended
router.get('/categories', cache12h, getWorkCategories);

// GET /api/works/constituencies - Get all unique constituencies
router.get('/constituencies', cache12h, getConstituencies);

// GET /api/works/completed/:id - Get individual completed work details
router.get('/completed/:id', cache12h, getCompletedWorkDetails);

// GET /api/works/recommended/:id - Get individual recommended work details
router.get('/recommended/:id', cache12h, getRecommendedWorkDetails);

// GET /api/works/:workId/payments - Get payment details for a specific work
// GET /api/works/recommendations/:recommendationId/payments - Get payment details for a recommendation (place before generic route)
router.get('/recommendations/:recommendationId/payments', cache12h, getWorkPayments);

// Alternative route for workIds that might contain non-numeric characters (must come first)
router.get('/:workId/payments', cache12h, getWorkPayments);

// GET /api/works/:workId/payments - Get payment details for a specific work (restrict to numeric IDs to avoid shadowing)
router.get('/:workId(\\d+)/payments', cache12h, getWorkPayments);

module.exports = router;
