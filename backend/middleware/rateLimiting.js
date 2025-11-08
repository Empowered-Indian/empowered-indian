const rateLimit = require('express-rate-limit');
const { secureLogger } = require('../utils/logger');

/**
 * Comprehensive rate limiting middleware for MPLADS API
 * Different limits based on endpoint sensitivity and resource usage
 */

/**
 * Custom error message generator
 * @param {string} category - Rate limit category
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Error response object
 */
const createRateLimitMessage = (category, windowMs) => ({
  success: false,
  error: 'Rate limit exceeded',
  message: `Too many ${category} requests. Please try again later.`,
  retryAfter: Math.ceil(windowMs / 60000) + ' minutes',
  category
});

/**
 * Custom skip function for development environment
 * @param {Object} _req - Express request object
 * @returns {boolean} Whether to skip rate limiting
 */
const skipDevelopment = (_req) => {
  return process.env.NODE_ENV !== 'production' &&
         process.env.ENABLE_RATE_LIMIT !== 'true';
};

/**
 * Enhanced rate limit store with IP tracking
 */
const _createStore = () => {
  const hits = new Map();
  const resetTime = new Map();
  
  return {
    incr: (key, cb) => {
      const now = Date.now();
      const windowStart = resetTime.get(key);
      
      if (!windowStart || now > windowStart) {
        hits.set(key, 1);
        resetTime.set(key, now + 10 * 60 * 1000); // 10 minutes
        cb(null, 1, now + 10 * 60 * 1000);
      } else {
        const count = (hits.get(key) || 0) + 1;
        hits.set(key, count);
        cb(null, count, windowStart);
      }
    },
    
    decrement: (key) => {
      const count = hits.get(key) || 0;
      if (count > 0) {
        hits.set(key, count - 1);
      }
    },
    
    resetKey: (key) => {
      hits.delete(key);
      resetTime.delete(key);
    },
    
    resetAll: () => {
      hits.clear();
      resetTime.clear();
    }
  };
};

// Rate limiting configurations for different endpoint categories

/**
 * General API rate limiting
 * Applied to all API endpoints as baseline protection
 */
const generalApiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000, // 1000 requests per 10 min
  message: createRateLimitMessage('API', 10 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDevelopment,
  keyGenerator: (req) => {
    // Use IP + User-Agent for more specific tracking
    return `${req.ip}-${req.get('User-Agent')?.substring(0, 50) || 'unknown'}`;
  },
  // Rate limit reached handler
  handler: (req, res) => {
    secureLogger.security.rateLimitExceeded(req.ip, req.path, req.correlationId);
    return res.status(429).json(createRateLimitMessage('API', 10 * 60 * 1000));
  }
});

/**
 * Search and query rate limiting
 * Applied to search-heavy endpoints that may be expensive
 */
const searchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
  message: createRateLimitMessage('search', 10 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDevelopment,
  handler: (req, res) => {
    secureLogger.warn('Search rate limit exceeded', {
      category: 'security',
      type: 'rate_limit_search',
      ip: req.ip,
      query: req.query,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    return res.status(429).json(createRateLimitMessage('search', 10 * 60 * 1000));
  }
});

/**
 * Export data rate limiting
 * Very strict limits for data export endpoints
 */
const exportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
  message: createRateLimitMessage('export', 10 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDevelopment,
  handler: (req, res) => {
    secureLogger.warn('Export rate limit exceeded', {
      category: 'security',
      type: 'rate_limit_export',
      ip: req.ip,
      exportType: req.path,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    return res.status(429).json(createRateLimitMessage('export', 10 * 60 * 1000));
  }
});

/**
 * Analytics rate limiting
 * Moderate limits for analytical endpoints
 */
const analyticsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
  message: createRateLimitMessage('analytics', 10 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDevelopment,
  handler: (req, res) => {
    secureLogger.warn('Analytics rate limit exceeded', {
      category: 'security',
      type: 'rate_limit_analytics',
      ip: req.ip,
      endpoint: req.path,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    return res.status(429).json(createRateLimitMessage('analytics', 10 * 60 * 1000));
  }
});

/**
 * User input rate limiting (feedback, submissions)
 * Prevents spam and abuse of user input endpoints
 */
const userInputLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
  message: createRateLimitMessage('user input', 10 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDevelopment,
  handler: (req, res) => {
    secureLogger.warn('User input rate limit exceeded', {
      category: 'security',
      type: 'rate_limit_user_input',
      ip: req.ip,
      endpoint: req.path,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    return res.status(429).json(createRateLimitMessage('user input', 10 * 60 * 1000));
  }
});

/**
 * Strict rate limiting for sensitive endpoints
 * Very low limits for endpoints that could be used for reconnaissance
 */
const strictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
  message: createRateLimitMessage('sensitive operation', 10 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDevelopment,
  handler: (req, res) => {
    secureLogger.warn('Strict rate limit exceeded for sensitive endpoint', {
      category: 'security',
      type: 'rate_limit_strict',
      ip: req.ip,
      sensitiveEndpoint: req.path,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    return res.status(429).json(createRateLimitMessage('sensitive operation', 10 * 60 * 1000));
  }
});

/**
 * Burst protection for rapid requests
 * Short window, very low limit to prevent burst attacks
 */
const burstProtection = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
  message: createRateLimitMessage('burst protection', 10 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDevelopment,
  handler: (req, res) => {
    secureLogger.warn('Burst protection triggered', {
      category: 'security',
      type: 'rate_limit_burst',
      ip: req.ip,
      endpoint: req.path,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    return res.status(429).json(createRateLimitMessage('burst protection', 10 * 60 * 1000));
  }
});

/**
 * Progressive rate limiting
 * Applies increasingly strict limits based on request count
 */
const progressiveLimiter = (req, res, next) => {
  if (skipDevelopment(req)) {
    return next();
  }
  
  const key = req.ip;
  const now = Date.now();
  
  // Simple in-memory store for demonstration
  // In production, use Redis or similar for distributed systems
  if (!req.app.locals.progressiveStore) {
    req.app.locals.progressiveStore = new Map();
    req.app.locals.progressiveStoreLastCleanup = now;
  }
  
  const store = req.app.locals.progressiveStore;
  
  // Periodic cleanup to prevent memory leaks - clean every 30 minutes
  if (now - (req.app.locals.progressiveStoreLastCleanup || 0) > 30 * 60 * 1000) {
    const cutoffTime = now - 2 * 60 * 60 * 1000; // Remove entries older than 2 hours
    for (const [ip, data] of store.entries()) {
      if (data.lastRequest < cutoffTime) {
        store.delete(ip);
      }
    }
    req.app.locals.progressiveStoreLastCleanup = now;
  }
  
  const userData = store.get(key) || { count: 0, firstRequest: now, lastRequest: now };
  
  userData.count++;
  userData.lastRequest = now;
  
  // Reset if more than 10 minutes has passed (align with other limits)
  if (now - userData.firstRequest > 10 * 60 * 1000) {
    userData.count = 1;
    userData.firstRequest = now;
  }
  
  store.set(key, userData);
  
  // Progressive limits based on request count
  let limit = 5000; // Base limit (5x higher)
  if (userData.count > 2500) limit = 500;
  if (userData.count > 5000) limit = 250;
  if (userData.count > 10000) limit = 50;
  
  // Check if user has exceeded progressive limit in last 10 minutes
  const requestsInWindow = userData.count;
  if (requestsInWindow > limit) {
    secureLogger.warn('Progressive rate limit exceeded', {
      category: 'security',
      type: 'rate_limit_progressive',
      ip: req.ip,
      requestsInWindow,
      limit,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    return res.status(429).json(createRateLimitMessage('progressive rate limit', 10 * 60 * 1000));
  }
  
  next();
};

/**
 * Endpoint-specific rate limiters
 */
const endpointLimiters = {
  // Data retrieval endpoints
  summary: analyticsLimiter,
  mplads: searchLimiter,
  works: searchLimiter,
  expenditures: searchLimiter,
  
  // Resource-intensive endpoints
  analytics: analyticsLimiter,
  export: exportLimiter,
  
  // User interaction endpoints
  feedback: userInputLimiter,
  
  // Sensitive endpoints
  admin: strictLimiter
};

/**
 * Rate limiting middleware factory
 * @param {string} category - Endpoint category
 * @returns {Function} Express middleware
 */
const getRateLimiter = (category) => {
  return endpointLimiters[category] || generalApiLimiter;
};

/**
 * Combined security rate limiting
 * Applies multiple layers of rate limiting
 */
const securityRateLimiting = [
  burstProtection,
  progressiveLimiter
];

module.exports = {
  generalApiLimiter,
  searchLimiter,
  exportLimiter,
  analyticsLimiter,
  userInputLimiter,
  strictLimiter,
  burstProtection,
  progressiveLimiter,
  securityRateLimiting,
  getRateLimiter,
  endpointLimiters
};