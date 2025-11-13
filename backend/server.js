// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
require('./instrument.js')

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const Sentry = require('@sentry/node')
require('dotenv').config()

const { connectDB, gracefulShutdown } = require('./config/database')
const { closeConnection: closeMongoClient } = require('./utils/database')
const errorHandler = require('./middleware/errorHandler')
const routes = require('./routes')
const { secureLogger } = require('./utils/logger')
const {
  requestLogger,
  bodySizeLogger,
  slowRequestLogger,
  errorRequestLogger,
} = require('./middleware/requestLogger')

// Import enhanced security middleware
const {
  securityLogger,
  parameterPollutionProtection,
  noSQLInjectionProtection,
} = require('./middleware/sanitization')
const { generalApiLimiter, securityRateLimiting } = require('./middleware/rateLimiting')

const app = express()

// Ensure PORT is set in environment - throw error if not provided
if (!process.env.PORT) {
  console.error('ERROR: PORT environment variable is required but not set.')
  console.error('Please set PORT in your .env file (e.g., PORT=5001)')
  process.exit(1)
}

const PORT = process.env.PORT

// Trust proxy for proper rate limiting and IP detection when behind reverse proxy
app.set('trust proxy', 1)

// Connect to MongoDB
connectDB()

// Minimal logging in production for memory optimization
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger)
  app.use(slowRequestLogger(5000))
  app.use(bodySizeLogger(100000))
}

// Enhanced security middleware stack
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for dashboard
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
)

// Apply security logging for all requests
app.use(securityLogger)

// NoSQL injection protection
app.use(noSQLInjectionProtection)

// HTTP Parameter Pollution protection
app.use(parameterPollutionProtection)

// CORS configuration
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['https://empowered-indian-fe-egin.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5175']

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)

// Compression for better performance
app.use(compression())

// Multi-layered rate limiting
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
  // Apply burst protection and progressive limiting
  app.use(securityRateLimiting)

  // Apply general API rate limiting
  app.use('/api/', generalApiLimiter)
}

// Body parsing middleware with enhanced security
app.use(
  express.json({
    limit: '1mb', // Reduced from 10mb for better security
    verify: (req, res, buf) => {
      // Log large payloads for monitoring
      if (buf.length > 100000) {
        // 100KB
        secureLogger.warn(
          'Large JSON payload detected',
          {
            category: 'performance',
            type: 'large_payload',
            size: `${buf.length} bytes`,
            ip: req.ip,
            timestamp: new Date().toISOString(),
          },
          req.correlationId
        )
      }
    },
  })
)
app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
    parameterLimit: 100, // Limit number of parameters to prevent DoS
    verify: (req, res, buf) => {
      if (buf.length > 100000) {
        secureLogger.warn(
          'Large URL-encoded payload detected',
          {
            category: 'performance',
            type: 'large_urlencoded_payload',
            size: `${buf.length} bytes`,
            ip: req.ip,
            timestamp: new Date().toISOString(),
          },
          req.correlationId
        )
      }
    },
  })
)

// API routes
app.use('/api', routes)

// Health check endpoint with security considerations
app.get('/health', (req, res) => {
  // Log health check requests from suspicious IPs
  const userAgent = req.get('User-Agent') || 'unknown'
  if (!userAgent.includes('uptime') && !userAgent.includes('monitor')) {
    secureLogger.info(
      'Health check from non-monitoring source',
      {
        category: 'health',
        ip: req.ip,
        userAgent,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    // Don't expose detailed system info in production
    ...(process.env.NODE_ENV !== 'production' && {
      memory: process.memoryUsage(),
      version: process.version,
    }),
  })
})

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'MPLADS Dashboard API',
    version: '1.0.0',
  })
})

// Error request logging middleware (before error handler)
app.use(errorRequestLogger)

// The Sentry error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app)

// Error handling middleware (must be last)
app.use(errorHandler)

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  })
})

// Start server
const server = app.listen(PORT, () => {
  secureLogger.info('Server started successfully', {
    category: 'startup',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
})

// Graceful shutdown
const handleShutdown = async signal => {
  secureLogger.info(`${signal} signal received: initiating graceful shutdown`, {
    category: 'shutdown',
    signal,
    timestamp: new Date().toISOString(),
  })

  try {
    // Close HTTP server first
    server.close(async () => {
      secureLogger.info('HTTP server closed', {
        category: 'shutdown',
        timestamp: new Date().toISOString(),
      })

      try {
        // Close database connections (Mongoose and raw MongoClient)
        await gracefulShutdown(signal)
        try {
          await closeMongoClient()
        } catch (e) {
          secureLogger.warn('MongoClient close failed or not open', {
            category: 'shutdown',
            error: e?.message,
            timestamp: new Date().toISOString(),
          })
        }
        secureLogger.info('Graceful shutdown completed successfully', {
          category: 'shutdown',
          timestamp: new Date().toISOString(),
        })
        process.exit(0)
      } catch (error) {
        secureLogger.error('Error during database shutdown', {
          category: 'shutdown',
          error: error.message,
          timestamp: new Date().toISOString(),
        })
        process.exit(1)
      }
    })

    // Force shutdown after 30 seconds
    setTimeout(() => {
      secureLogger.error('Graceful shutdown timed out, forcing exit', {
        category: 'shutdown',
        timestamp: new Date().toISOString(),
      })
      process.exit(1)
    }, 30000)
  } catch (error) {
    secureLogger.error('Error during shutdown process', {
      category: 'shutdown',
      error: error.message,
      timestamp: new Date().toISOString(),
    })
    process.exit(1)
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'))
process.on('SIGINT', () => handleShutdown('SIGINT'))

// Handle uncaught exceptions gracefully
process.on('uncaughtException', error => {
  secureLogger.error('Uncaught Exception', {
    category: 'shutdown',
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  })
  handleShutdown('UNCAUGHT_EXCEPTION')
})

process.on('unhandledRejection', (reason, promise) => {
  secureLogger.error('Unhandled Rejection', {
    category: 'shutdown',
    reason: reason?.toString(),
    promise: promise?.toString(),
    timestamp: new Date().toISOString(),
  })
  handleShutdown('UNHANDLED_REJECTION')
})

module.exports = app
