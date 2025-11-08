const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const { cacheMiddleware } = require('../middleware/cache');
const { 
  getUtilizationTrends, 
  getTopPerformers, 
  getPerformanceDistribution 
} = require('../controllers/analyticsController');
const { strictSanitization } = require('../middleware/sanitization');
const { analyticsLimiter } = require('../middleware/rateLimiting');

// Cache analytics for 24 hours (analytical data is stable)
const cache24h = cacheMiddleware(24 * 60 * 60);

// Apply security middleware to all analytics routes
router.use(strictSanitization);
router.use(analyticsLimiter);

// GET /api/analytics/trends - Time-based utilization trends
router.get('/trends', 
  validate('analyticsFilters', { sanitize: false }), // Already sanitized by router middleware
  cache24h, 
  getUtilizationTrends
);

// GET /api/analytics/top-performers - Top performing MPs by utilization
router.get('/top-performers', 
  validate('analyticsFilters', { sanitize: false }),
  cache24h, 
  getTopPerformers
);

// GET /api/analytics/performance-distribution - Performance distribution analysis
router.get('/performance-distribution', 
  validate('analyticsFilters', { sanitize: false }),
  cache24h, 
  getPerformanceDistribution
);

module.exports = router;