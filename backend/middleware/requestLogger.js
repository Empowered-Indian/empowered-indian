const { secureLogger, generateCorrelationId, logSanitizers } = require('../utils/logger')

/**
 * Request logging middleware that creates correlation IDs and logs HTTP requests
 * This middleware should be placed early in the middleware stack
 */
const requestLogger = (req, res, next) => {
  // Generate correlation ID for request tracking
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId()

  // Attach correlation ID to request object for use in controllers
  req.correlationId = correlationId

  // Add correlation ID to response headers
  res.setHeader('x-correlation-id', correlationId)

  // Log request start
  const startTime = Date.now()
  const { method, url, ip } = req
  const userAgent = req.get('User-Agent') || 'Unknown'

  // Sanitize and log request details
  secureLogger.http(
    'Request started',
    {
      method,
      url,
      ip: logSanitizers.sanitizeIP(ip),
      userAgent,
      query: logSanitizers.sanitizeForLogging(req.query),
      timestamp: new Date().toISOString(),
    },
    correlationId
  )

  // Override res.json to log response
  const originalJson = res.json
  res.json = function (data) {
    const duration = Date.now() - startTime
    const { statusCode } = res

    // Log response details
    secureLogger.http(
      'Request completed',
      {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        ip: logSanitizers.sanitizeIP(ip),
        responseSize: JSON.stringify(data).length,
        timestamp: new Date().toISOString(),
      },
      correlationId
    )

    // Call original json method
    return originalJson.call(this, data)
  }

  // Override res.send to log response for non-JSON responses
  const originalSend = res.send
  res.send = function (data) {
    const duration = Date.now() - startTime
    const { statusCode } = res

    // Only log if not already logged by res.json
    if (!res.headersSent || res.getHeader('content-type')?.includes('application/json') === false) {
      secureLogger.http(
        'Request completed',
        {
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          ip: logSanitizers.sanitizeIP(ip),
          responseSize: data ? data.length || 0 : 0,
          timestamp: new Date().toISOString(),
        },
        correlationId
      )
    }

    return originalSend.call(this, data)
  }

  // Handle cases where response is ended without json() or send()
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const { statusCode } = res

    // Log if response wasn't already logged
    if (!res._loggedByMiddleware) {
      secureLogger.http(
        'Request completed',
        {
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          ip: logSanitizers.sanitizeIP(ip),
          timestamp: new Date().toISOString(),
        },
        correlationId
      )
    }
  })

  // Log request errors
  res.on('error', error => {
    const duration = Date.now() - startTime

    secureLogger.error(
      'Request error',
      {
        method,
        url,
        ip: logSanitizers.sanitizeIP(ip),
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      correlationId
    )
  })

  next()
}

/**
 * Enhanced request logger for sensitive endpoints
 * Logs additional details for authentication, admin operations, etc.
 */
const sensitiveRequestLogger = (req, res, next) => {
  const correlationId = req.correlationId
  const { method, url, ip } = req
  const userAgent = req.get('User-Agent') || 'Unknown'
  const authHeader = req.get('Authorization') ? '[PRESENT]' : '[MISSING]'

  secureLogger.info(
    'Sensitive endpoint accessed',
    {
      category: 'security',
      type: 'sensitive_access',
      method,
      url,
      ip: logSanitizers.sanitizeIP(ip),
      userAgent,
      authorization: authHeader,
      timestamp: new Date().toISOString(),
    },
    correlationId
  )

  next()
}

/**
 * Error request logger - logs failed requests with additional context
 */
const errorRequestLogger = (err, req, res, next) => {
  const correlationId = req.correlationId || 'unknown'
  const { method, url, ip } = req

  secureLogger.error(
    'Request failed with error',
    {
      method,
      url,
      ip: logSanitizers.sanitizeIP(ip),
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      statusCode: err.statusCode || err.status || 500,
      timestamp: new Date().toISOString(),
    },
    correlationId
  )

  next(err)
}

/**
 * Slow request logger - logs requests that take longer than threshold
 */
const slowRequestLogger = (threshold = 5000) => {
  return (req, res, next) => {
    const startTime = Date.now()
    const correlationId = req.correlationId

    // Override res.json to check duration
    const originalJson = res.json
    res.json = function (data) {
      const duration = Date.now() - startTime

      if (duration > threshold) {
        secureLogger.warn(
          'Slow request detected',
          {
            category: 'performance',
            type: 'slow_request',
            method: req.method,
            url: req.url,
            duration: `${duration}ms`,
            threshold: `${threshold}ms`,
            ip: logSanitizers.sanitizeIP(req.ip),
            timestamp: new Date().toISOString(),
          },
          correlationId
        )
      }

      return originalJson.call(this, data)
    }

    next()
  }
}

/**
 * Body size logger - logs requests with large payloads
 */
const bodySizeLogger = (threshold = 1024 * 1024) => {
  // 1MB default
  return (req, res, next) => {
    const correlationId = req.correlationId
    const contentLength = parseInt(req.get('content-length') || '0', 10)

    if (contentLength > threshold) {
      secureLogger.warn(
        'Large request body detected',
        {
          category: 'performance',
          type: 'large_payload',
          method: req.method,
          url: req.url,
          contentLength: `${contentLength} bytes`,
          threshold: `${threshold} bytes`,
          ip: logSanitizers.sanitizeIP(req.ip),
          timestamp: new Date().toISOString(),
        },
        correlationId
      )
    }

    next()
  }
}

module.exports = {
  requestLogger,
  sensitiveRequestLogger,
  errorRequestLogger,
  slowRequestLogger,
  bodySizeLogger,
}
