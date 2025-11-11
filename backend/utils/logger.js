const winston = require('winston')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

// Create logs directory if it doesn't exist
const fs = require('fs')
const logsDir = path.join(__dirname, '../logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define colors for console output in development
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(logColors)

// Create custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'service'],
  })
)

// Production format (JSON for log aggregation tools)
const productionFormat = winston.format.combine(logFormat, winston.format.json())

// Development format (colorized and readable)
const developmentFormat = winston.format.combine(
  logFormat,
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, service, correlationId, ...meta }) => {
    let log = `${timestamp} [${service || 'MPLADS-API'}] ${level}: ${message}`

    if (correlationId) {
      log += ` [correlationId: ${correlationId}]`
    }

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }

    return log
  })
)

// Determine environment
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

// Configure transports
const transports = []

// File transports for all environments
transports.push(
  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true,
  }),

  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: productionFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true,
  })
)

// Console transport (only in development or when explicitly enabled)
if (isDevelopment || process.env.ENABLE_CONSOLE_LOGS === 'true') {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat,
      level: isDevelopment ? 'debug' : 'info',
    })
  )
}

// Create the logger
const logger = winston.createLogger({
  levels: logLevels,
  level: isProduction ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: {
    service: 'MPLADS-API',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports,
  exitOnError: false,

  // Don't crash on uncaught exceptions, but log them
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: productionFormat,
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: productionFormat,
    }),
  ],
})

// Helper function to add correlation ID to logs
const withCorrelationId = correlationId => {
  return {
    error: (message, meta = {}) => logger.error(message, { ...meta, correlationId }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, correlationId }),
    info: (message, meta = {}) => logger.info(message, { ...meta, correlationId }),
    http: (message, meta = {}) => logger.http(message, { ...meta, correlationId }),
    debug: (message, meta = {}) => logger.debug(message, { ...meta, correlationId }),
  }
}

// Helper function to generate correlation ID
const generateCorrelationId = () => uuidv4()

// Security-aware logging helpers
const logSanitizers = {
  // Remove sensitive data from objects before logging
  sanitizeForLogging: obj => {
    if (!obj || typeof obj !== 'object') return obj

    const sensitiveKeys = [
      'password',
      'pwd',
      'secret',
      'token',
      'key',
      'authorization',
      'auth',
      'credential',
      'private',
      'confidential',
      'api_key',
      'access_token',
      'refresh_token',
      'jwt',
      'session',
    ]

    const sanitized = { ...obj }

    const sanitizeRecursive = object => {
      for (const [key, value] of Object.entries(object)) {
        const lowerKey = key.toLowerCase()

        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          object[key] = '[REDACTED]'
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          sanitizeRecursive(value)
        }
      }
    }

    sanitizeRecursive(sanitized)
    return sanitized
  },

  // Sanitize IP addresses for GDPR compliance (optional)
  sanitizeIP: ip => {
    if (!ip) return ip

    // In production, you might want to anonymize IPs
    if (isProduction && process.env.ANONYMIZE_IPS === 'true') {
      // IPv4 anonymization (e.g., 192.168.1.1 -> 192.168.1.xxx)
      if (ip.includes('.')) {
        return ip.split('.').slice(0, 3).join('.') + '.xxx'
      }
      // IPv6 anonymization (simplified)
      if (ip.includes(':')) {
        return ip.split(':').slice(0, 4).join(':') + '::xxxx'
      }
    }

    return ip
  },
}

// Rate limiting for logs to prevent log flooding
const logRateLimiter = (() => {
  const logCounts = new Map()
  const RATE_LIMIT_WINDOW = 60000 // 1 minute
  const MAX_LOGS_PER_MINUTE = 100

  return {
    shouldLog: key => {
      const now = Date.now()
      const windowStart = now - RATE_LIMIT_WINDOW

      if (!logCounts.has(key)) {
        logCounts.set(key, [])
      }

      const timestamps = logCounts.get(key)

      // Remove old timestamps
      while (timestamps.length > 0 && timestamps[0] < windowStart) {
        timestamps.shift()
      }

      if (timestamps.length >= MAX_LOGS_PER_MINUTE) {
        return false
      }

      timestamps.push(now)
      return true
    },
  }
})()

// Enhanced logging methods with security features
const secureLogger = {
  error: (message, meta = {}, correlationId = null) => {
    const sanitizedMeta = logSanitizers.sanitizeForLogging(meta)
    if (correlationId) {
      return withCorrelationId(correlationId).error(message, sanitizedMeta)
    }
    return logger.error(message, sanitizedMeta)
  },

  warn: (message, meta = {}, correlationId = null) => {
    const sanitizedMeta = logSanitizers.sanitizeForLogging(meta)
    if (correlationId) {
      return withCorrelationId(correlationId).warn(message, sanitizedMeta)
    }
    return logger.warn(message, sanitizedMeta)
  },

  info: (message, meta = {}, correlationId = null) => {
    const sanitizedMeta = logSanitizers.sanitizeForLogging(meta)
    if (correlationId) {
      return withCorrelationId(correlationId).info(message, sanitizedMeta)
    }
    return logger.info(message, sanitizedMeta)
  },

  http: (message, meta = {}, correlationId = null) => {
    const sanitizedMeta = logSanitizers.sanitizeForLogging(meta)
    if (correlationId) {
      return withCorrelationId(correlationId).http(message, sanitizedMeta)
    }
    return logger.http(message, sanitizedMeta)
  },

  debug: (message, meta = {}, correlationId = null) => {
    const sanitizedMeta = logSanitizers.sanitizeForLogging(meta)
    if (correlationId) {
      return withCorrelationId(correlationId).debug(message, sanitizedMeta)
    }
    return logger.debug(message, sanitizedMeta)
  },

  // Security-specific logging methods
  security: {
    rateLimitExceeded: (ip, endpoint, correlationId = null) => {
      const key = `rate-limit-${ip}-${endpoint}`
      if (logRateLimiter.shouldLog(key)) {
        secureLogger.warn(
          'Rate limit exceeded',
          {
            category: 'security',
            type: 'rate_limit',
            ip: logSanitizers.sanitizeIP(ip),
            endpoint,
            timestamp: new Date().toISOString(),
          },
          correlationId
        )
      }
    },

    validationFailed: (ip, endpoint, error, correlationId = null) => {
      secureLogger.warn(
        'Input validation failed',
        {
          category: 'security',
          type: 'validation_failed',
          ip: logSanitizers.sanitizeIP(ip),
          endpoint,
          error: error.message || error,
          timestamp: new Date().toISOString(),
        },
        correlationId
      )
    },

    suspiciousActivity: (ip, activity, details = {}, correlationId = null) => {
      secureLogger.warn(
        'Suspicious activity detected',
        {
          category: 'security',
          type: 'suspicious_activity',
          ip: logSanitizers.sanitizeIP(ip),
          activity,
          details: logSanitizers.sanitizeForLogging(details),
          timestamp: new Date().toISOString(),
        },
        correlationId
      )
    },

    authenticationFailed: (ip, username, reason, correlationId = null) => {
      secureLogger.warn(
        'Authentication failed',
        {
          category: 'security',
          type: 'auth_failed',
          ip: logSanitizers.sanitizeIP(ip),
          username: username ? `[USER:${username.substring(0, 3)}***]` : '[UNKNOWN]',
          reason,
          timestamp: new Date().toISOString(),
        },
        correlationId
      )
    },
  },
}

module.exports = {
  logger,
  secureLogger,
  withCorrelationId,
  generateCorrelationId,
  logSanitizers,
}
