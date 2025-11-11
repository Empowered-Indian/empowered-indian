const xss = require('xss')
const mongoSanitize = require('express-mongo-sanitize')
const hpp = require('hpp')
const { secureLogger } = require('../utils/logger')

/**
 * Comprehensive input sanitization middleware for security
 * Protects against XSS, NoSQL injection, and parameter pollution
 */

// Custom XSS options for the MPLADS platform
const xssOptions = {
  whiteList: {
    // Allow minimal HTML formatting for specific fields
    b: [],
    i: [],
    strong: [],
    em: [],
    p: [],
    br: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
  allowCommentTag: false,
  css: false, // Disable CSS to prevent style-based attacks
}

/**
 * Recursively sanitize an object's string values
 * @param {*} obj - Object to sanitize
 * @param {boolean} allowHTML - Whether to allow minimal HTML formatting
 * @returns {*} Sanitized object
 */
function sanitizeObject(obj, allowHTML = false) {
  if (typeof obj === 'string') {
    // Trim whitespace
    obj = obj.trim()

    // Block dangerous protocols
    const dangerousProtocols = /^\s*(javascript|vbscript|data|file|about):/i
    if (dangerousProtocols.test(obj)) {
      secureLogger.security.suspiciousActivity('unknown', 'dangerous_protocol_blocked', {
        protocol: obj,
      })
      return ''
    }

    // Apply XSS protection
    if (allowHTML) {
      return xss(obj, xssOptions)
    } else {
      // Strip all HTML for security-critical fields
      return xss(obj, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: true })
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, allowHTML))
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key names to prevent object pollution
      const cleanKey = typeof key === 'string' ? key.replace(/[^a-zA-Z0-9_-]/g, '') : key
      sanitized[cleanKey] = sanitizeObject(value, allowHTML)
    }
    return sanitized
  }

  return obj
}

/**
 * Middleware to sanitize request inputs
 * @param {Object} options - Sanitization options
 * @param {boolean} options.allowHTML - Allow minimal HTML in request body
 * @param {Array} options.htmlFields - Specific fields that can contain HTML
 * @returns {Function} Express middleware
 */
const sanitizeInputs = (options = {}) => {
  const { allowHTML = false, htmlFields = [] } = options

  return (req, res, next) => {
    try {
      // Sanitize query parameters (never allow HTML)
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, false)
      }

      // Sanitize URL parameters (never allow HTML)
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, false)
      }

      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        if (htmlFields.length > 0) {
          // Selective HTML sanitization for specific fields
          const sanitized = {}
          for (const [key, value] of Object.entries(req.body)) {
            const shouldAllowHTML = htmlFields.includes(key)
            sanitized[key] = sanitizeObject(value, shouldAllowHTML)
          }
          req.body = sanitized
        } else {
          // Global HTML policy for entire body
          req.body = sanitizeObject(req.body, allowHTML)
        }
      }

      next()
    } catch (error) {
      secureLogger.error(
        'Input sanitization error',
        {
          category: 'security',
          type: 'sanitization_error',
          error: error.message,
          url: req.url,
          method: req.method,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        },
        req.correlationId
      )
      return res.status(500).json({
        success: false,
        error: 'Input processing error',
      })
    }
  }
}

/**
 * Strict sanitization for security-critical endpoints
 * No HTML allowed, aggressive cleaning
 */
const strictSanitization = sanitizeInputs({ allowHTML: false })

/**
 * Moderate sanitization for content endpoints
 * Minimal HTML allowed in specific fields
 */
const moderateSanitization = (htmlFields = []) =>
  sanitizeInputs({
    allowHTML: false,
    htmlFields,
  })

/**
 * NoSQL injection protection middleware
 * Uses express-mongo-sanitize to remove prohibited characters
 */
const noSQLInjectionProtection = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    secureLogger.security.suspiciousActivity(
      req.ip,
      'nosql_injection_attempt',
      {
        key,
        url: req.url,
        method: req.method,
      },
      req.correlationId
    )
  },
})

/**
 * HTTP Parameter Pollution protection
 * Prevents duplicate parameter attacks
 */
const parameterPollutionProtection = hpp({
  whitelist: [
    // Allow arrays for these specific parameters
    'category',
    'state',
    'house',
    'status',
    'sort',
  ],
})

/**
 * Security logging middleware
 * Logs suspicious activities
 */
const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /\$where/i,
    /\$ne/i,
    /\$gt/i,
    /\$lt/i,
    /eval\(/i,
    /union.*select/i,
    /drop.*table/i,
  ]

  const checkForSuspiciousContent = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(obj)) {
          secureLogger.security.suspiciousActivity(
            req.ip,
            'malicious_pattern_detected',
            {
              pattern: pattern.toString(),
              location: path || 'request',
              content: obj.substring(0, 100), // First 100 chars for context
              url: req.url,
              method: req.method,
            },
            req.correlationId
          )
          return true
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkForSuspiciousContent(value, `${path}.${key}`)) {
          return true
        }
      }
    }
    return false
  }

  // Check all parts of the request
  checkForSuspiciousContent(req.query, 'query')
  checkForSuspiciousContent(req.body, 'body')
  checkForSuspiciousContent(req.params, 'params')

  next()
}

/**
 * Complete security middleware stack
 * Combines all security measures
 */
const securityStack = [
  securityLogger,
  parameterPollutionProtection,
  noSQLInjectionProtection,
  strictSanitization,
]

/**
 * Content security middleware for endpoints that handle user content
 * Allows minimal HTML in specific fields (like feedback descriptions)
 */
const contentSecurityStack = (htmlFields = []) => [
  securityLogger,
  parameterPollutionProtection,
  noSQLInjectionProtection,
  moderateSanitization(htmlFields),
]

module.exports = {
  sanitizeInputs,
  strictSanitization,
  moderateSanitization,
  noSQLInjectionProtection,
  parameterPollutionProtection,
  securityLogger,
  securityStack,
  contentSecurityStack,
}
