const Joi = require('joi')
const { sanitizeInputs } = require('./sanitization')
const { validationResult } = require('express-validator')
const { secureLogger } = require('../utils/logger')

// Enhanced validation schemas with security constraints
const schemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    // Allow safe field names, optional leading '-'
    sort: Joi.string()
      .pattern(/^[-]?[a-zA-Z0-9_.]{1,40}$/)
      .default('-utilization'),
  }),

  mpFilters: Joi.object({
    state: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z\s-]+$/),
    constituency: Joi.string()
      .trim()
      .max(150)
      .pattern(/^[a-zA-Z0-9\s().-]+$/),
    party: Joi.string()
      .trim()
      .max(200)
      .pattern(/^[a-zA-Z0-9\s().-]+$/),
    house: Joi.string().valid('Lok Sabha', 'Rajya Sabha'),
    ls_term: Joi.alternatives().try(
      Joi.string().valid('17', '18', 'both'),
      Joi.number().valid(17, 18)
    ),
    min_utilization: Joi.number().min(0).max(100),
    max_utilization: Joi.number().min(0).max(100).greater(Joi.ref('min_utilization')),
    search: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z0-9\s.-]+$/),
  }),

  expenditureFilters: Joi.object({
    mp_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    state: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z\s-]+$/),
    year: Joi.number().integer().min(2014).max(new Date().getFullYear()),
    min_amount: Joi.number().min(0),
    max_amount: Joi.number().min(0),
    category: Joi.string()
      .trim()
      .max(50)
      .pattern(/^[a-zA-Z0-9\s_-]+$/),
    ls_term: Joi.alternatives().try(
      Joi.string().valid('17', '18', 'both'),
      Joi.number().valid(17, 18)
    ),
  }),

  worksFilters: Joi.object({
    house: Joi.string().valid('Lok Sabha', 'Rajya Sabha'),
    mp_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    state: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z\s-]+$/),
    constituency: Joi.string()
      .trim()
      .max(150)
      .pattern(/^[a-zA-Z0-9\s()-]+$/),
    district: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z\s-]+$/),
    category: Joi.string()
      .trim()
      .max(50)
      .pattern(/^[a-zA-Z0-9\s_-]+$/),
    year: Joi.number().integer().min(2014).max(new Date().getFullYear()),
    status: Joi.string().valid('Completed', 'In Progress', 'Not Started'),
    min_cost: Joi.number().min(0),
    max_cost: Joi.number().min(0),
    search: Joi.string()
      .trim()
      .max(200)
      .pattern(/^[a-zA-Z0-9\s._-]+$/),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    radius_km: Joi.number().min(0).max(1000),
    ls_term: Joi.alternatives().try(
      Joi.string().valid('17', '18', 'both'),
      Joi.number().valid(17, 18)
    ),
  }),

  'pagination+worksFilters': Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    // Let controllers set sensible defaults (completed/recommended dates)
    sort: Joi.string()
      .pattern(/^[-]?[a-zA-Z0-9_.]{1,40}$/)
      .optional(),
    mp_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    state: Joi.string().trim().allow(''),
    constituency: Joi.string().trim().allow(''),
    district: Joi.string().trim().allow(''),
    category: Joi.string()
      .trim()
      .max(50)
      .pattern(/^[a-zA-Z0-9\s_-]+$/)
      .allow(''),
    year: Joi.number().integer().min(2014).max(new Date().getFullYear()),
    status: Joi.string().valid('Completed', 'In Progress', 'Not Started'),
    min_cost: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow('')),
    max_cost: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow('')),
    search: Joi.string()
      .trim()
      .max(200)
      .pattern(/^[a-zA-Z0-9\s._-]*$/)
      .allow(''),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    radius_km: Joi.number().min(0).max(1000),
    has_payments: Joi.alternatives()
      .try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0'))
      .optional(),
  }),

  // Explicit combined schema so we don't inherit pagination defaults that don't apply here
  'pagination+expenditureFilters': Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string()
      .pattern(/^[-]?[a-zA-Z0-9_.]{1,40}$/)
      .optional(),
    mp_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    state: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z\s-]+$/),
    year: Joi.number().integer().min(2014).max(new Date().getFullYear()),
    min_amount: Joi.number().min(0),
    max_amount: Joi.number().min(0),
    category: Joi.string()
      .trim()
      .max(50)
      .pattern(/^[a-zA-Z0-9\s_-]+$/),
    ls_term: Joi.alternatives().try(
      Joi.string().valid('17', '18', 'both'),
      Joi.number().valid(17, 18)
    ),
  }),

  analyticsFilters: Joi.object({
    start_year: Joi.number().integer().min(2014).max(new Date().getFullYear()),
    end_year: Joi.number().integer().min(2014).max(new Date().getFullYear()),
    state: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z\s-]+$/),
    house: Joi.string().valid('Lok Sabha', 'Rajya Sabha'),
    top_n: Joi.number().integer().min(1).max(50).default(10),
    ls_term: Joi.alternatives().try(
      Joi.string().valid('17', '18', 'both'),
      Joi.number().valid(17, 18)
    ),
  }),

  // Feedback validation schemas
  feedback: Joi.object({
    type: Joi.string().valid('bug', 'data_issue', 'feature_request', 'general').required(),
    title: Joi.string()
      .trim()
      .min(5)
      .max(100)
      .pattern(/^[a-zA-Z0-9\s._,!?-]+$/)
      .required(),
    description: Joi.string().trim().min(10).max(1000).required(),
    category: Joi.string().valid('mp', 'work', 'expenditure', 'general').required(),
    contactEmail: Joi.string().email().allow('', null).optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
  }),

  dataIssue: Joi.object({
    issueType: Joi.string().valid('incorrect_data', 'missing_data', 'outdated_data').required(),
    description: Joi.string().trim().min(10).max(1000).required(),
    contactEmail: Joi.string().email().allow('', null).optional(),
    relatedData: Joi.object({
      mp_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
      work_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
      expenditure_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    }).optional(),
  }),
}

/**
 * Security-enhanced validation middleware factory
 * Combines input sanitization with Joi validation
 * @param {string} schemaName - Name of the validation schema to use
 * @param {Object} options - Validation options
 * @param {boolean} options.sanitize - Whether to apply input sanitization (default: true)
 * @param {Array} options.htmlFields - Fields that can contain minimal HTML
 * @returns {Function} Express middleware
 */
const validate = (schemaName, options = {}) => {
  const { sanitize = true, htmlFields = [] } = options

  return (req, res, next) => {
    let schema = schemas[schemaName]

    // Support dynamic schema combination using Joi.concat (e.g., 'pagination+worksFilters')
    if (!schema && schemaName.includes('+')) {
      const parts = schemaName
        .split('+')
        .map(s => s.trim())
        .filter(Boolean)
      // Start from an empty object schema and concat in order
      try {
        schema = parts.reduce((acc, name) => {
          const part = schemas[name]
          if (!part) return acc // skip unknown silently; will be handled if nothing found
          return acc.concat(part)
        }, Joi.object({}))
      } catch {
        // Fallback: if concat fails for any reason, keep undefined so we hit the 500 below
        schema = undefined
      }
    }

    if (!schema) {
      return res.status(500).json({
        success: false,
        error: 'Validation schema not found',
      })
    }

    const { error, value } = schema.validate(
      {
        ...req.query,
        ...req.params,
        ...req.body,
      },
      {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      }
    )

    if (error) {
      const errorMessage = error.details
        .map(detail => {
          // Sanitize error messages to prevent information leakage
          return detail.message.replace(/[<>"']/g, '')
        })
        .join(', ')

      // Log validation failures for security monitoring
      secureLogger.security.validationFailed(req.ip, req.path, errorMessage, req.correlationId)

      return res.status(400).json({
        success: false,
        error: `Validation Error: ${errorMessage}`,
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      })
    }

    // Merge validated values back to req
    Object.assign(req.query, value)

    // Apply input sanitization if enabled
    if (sanitize) {
      const sanitizeMiddleware = sanitizeInputs({
        allowHTML: false,
        htmlFields,
      })
      return sanitizeMiddleware(req, res, next)
    }

    next()
  }
}

/**
 * Express-validator based validation for complex scenarios
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => {
      // Sanitize error messages
      return `${error.param}: ${error.msg}`.replace(/[<>"']/g, '')
    })

    secureLogger.security.validationFailed(
      req.ip,
      req.path,
      errorMessages.join(', '),
      req.correlationId
    )

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages,
      timestamp: new Date().toISOString(),
    })
  }

  next()
}

/**
 * Combined validation and sanitization middleware
 * @param {string} schemaName - Joi schema name
 * @param {Array} expressValidators - Express-validator chain
 * @param {Object} options - Additional options
 * @returns {Array} Array of middleware functions
 */
const secureValidation = (schemaName, expressValidators = [], options = {}) => {
  const middleware = []

  // Add express-validator middlewares if provided
  if (expressValidators.length > 0) {
    middleware.push(...expressValidators)
    middleware.push(handleValidationErrors)
  }

  // Add Joi validation
  middleware.push(validate(schemaName, options))

  return middleware
}

/**
 * Validation schemas for different security levels
 */
const securitySchemas = {
  // High security - no HTML, strict patterns
  high: {
    search: Joi.string()
      .trim()
      .max(50)
      .pattern(/^[a-zA-Z0-9\s]+$/),
    text: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z0-9\s.-]+$/),
  },

  // Medium security - limited HTML in specific fields
  medium: {
    search: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z0-9\s.-]+$/),
    text: Joi.string().trim().max(500),
  },

  // Low security - more permissive for content fields
  low: {
    search: Joi.string().trim().max(200),
    text: Joi.string().trim().max(1000),
  },
}

module.exports = {
  schemas,
  validate,
  handleValidationErrors,
  secureValidation,
  securitySchemas,
}
