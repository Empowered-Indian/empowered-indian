const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const isProduction = process.env.NODE_ENV === 'production'

// Get cache instance if it exists
let cache
try {
  cache = require('../middleware/cache').cache
} catch {
  // Cache module might not be initialized yet
}

// Get database connection stats if available
let getConnectionStats
try {
  getConnectionStats = require('../config/database').getConnectionStats
} catch {
  // Database connection stats might not be available
}

// Liveness probe - basic server health
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  })
})

// Readiness probe - check all dependencies
router.get('/ready', async (req, res) => {
  const checks = {
    database: 'unknown',
    cache: 'unknown',
    memory: 'unknown',
  }

  let isReady = true
  const errors = []

  try {
    // Database connectivity check with connection pool metrics
    if (mongoose.connection.readyState === 1) {
      // Connection is ready
      await mongoose.connection.db.admin().ping()

      let connectionPoolStats = null
      if (getConnectionStats) {
        try {
          connectionPoolStats = getConnectionStats()
        } catch {
          // Connection stats not available
        }
      }

      // Minimal info in production; detailed in non-prod
      if (isProduction) {
        checks.database = { status: 'connected' }
      } else {
        checks.database = {
          status: 'connected',
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          ...(connectionPoolStats && {
            connectionPool: {
              totalConnections: connectionPoolStats.totalConnections,
              activeConnections: connectionPoolStats.activeConnections,
              availableConnections: connectionPoolStats.availableConnections,
              poolUtilization: connectionPoolStats.poolUtilization + '%',
              connectionErrors: connectionPoolStats.connectionErrors,
              poolExhaustedEvents: connectionPoolStats.poolExhaustedEvents,
            },
          }),
        }
      }

      // Check for high pool utilization
      if (connectionPoolStats && connectionPoolStats.poolUtilization > 80) {
        isReady = false
        errors.push(`High database pool utilization: ${connectionPoolStats.poolUtilization}%`)
      }
    } else {
      checks.database = isProduction
        ? { status: 'disconnected' }
        : {
            status: 'disconnected',
            readyState: mongoose.connection.readyState,
          }
      isReady = false
      errors.push('Database not connected')
    }
  } catch (error) {
    checks.database = isProduction
      ? { status: 'error' }
      : {
          status: 'error',
          error: error.message,
          readyState: mongoose.connection.readyState,
        }
    isReady = false
    errors.push(`Database error: ${error.message}`)
  }

  try {
    // Cache system check
    if (cache) {
      const cacheStats = cache.getStats()
      checks.cache = isProduction
        ? { status: 'operational' }
        : {
            status: 'operational',
            keys: cacheStats.keys,
            hits: cacheStats.hits,
            misses: cacheStats.misses,
            hitRate:
              cacheStats.keys > 0
                ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) + '%'
                : 'N/A',
          }
    } else {
      checks.cache = { status: 'not initialized' }
    }
  } catch (error) {
    checks.cache = isProduction ? { status: 'error' } : { status: 'error', error: error.message }
  }

  try {
    // Memory usage check
    const memUsage = process.memoryUsage()
    const formatMemory = bytes => (bytes / 1024 / 1024).toFixed(2) + ' MB'

    if (isProduction) {
      // Only expose coarse status in production
      const usageRatio = memUsage.heapTotal > 0 ? memUsage.heapUsed / memUsage.heapTotal : 0
      let status = 'ok'
      if (usageRatio > 0.9) status = 'critical'
      else if (usageRatio > 0.75) status = 'warning'
      checks.memory = { status }
    } else {
      checks.memory = {
        rss: formatMemory(memUsage.rss),
        heapTotal: formatMemory(memUsage.heapTotal),
        heapUsed: formatMemory(memUsage.heapUsed),
        external: formatMemory(memUsage.external),
        heapUsagePercent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2) + '%',
      }
    }

    // Alert if memory usage is too high
    if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
      isReady = false
      errors.push('Memory usage critical (>90%)')
    }
  } catch (error) {
    checks.memory = isProduction ? { status: 'error' } : { status: 'error', error: error.message }
  }

  // Overall readiness status
  const status = isReady ? 200 : 503

  const basePayload = {
    status: isReady ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }

  // In production, return minimal payload; otherwise include full diagnostics
  const payload = isProduction
    ? { ...basePayload, checks }
    : {
        ...basePayload,
        checks,
        errors: errors.length > 0 ? errors : undefined,
        environment: process.env.NODE_ENV || 'development',
      }

  res.status(status).json(payload)
})

// Detailed health check (combines liveness and readiness)
router.get('/', async (req, res) => {
  const startTime = Date.now()
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ...(isProduction ? {} : { environment: process.env.NODE_ENV || 'development' }),
    checks: {},
  }

  // Database check with latency and connection pool metrics
  try {
    const dbStart = Date.now()
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping()

      let connectionPoolStats = null
      if (getConnectionStats) {
        try {
          connectionPoolStats = getConnectionStats()
        } catch {
          // Connection stats not available
        }
      }

      if (isProduction) {
        health.checks.database = { status: 'healthy' }
      } else {
        health.checks.database = {
          status: 'healthy',
          latency: Date.now() - dbStart + 'ms',
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          ...(connectionPoolStats && {
            connectionPool: {
              totalConnections: connectionPoolStats.totalConnections,
              activeConnections: connectionPoolStats.activeConnections,
              availableConnections: connectionPoolStats.availableConnections,
              poolUtilization: connectionPoolStats.poolUtilization + '%',
              connectionErrors: connectionPoolStats.connectionErrors,
              poolExhaustedEvents: connectionPoolStats.poolExhaustedEvents,
              lastPoolExhausted: connectionPoolStats.lastPoolExhausted,
            },
          }),
        }
      }

      // Set status to warning if pool utilization is high
      if (connectionPoolStats && connectionPoolStats.poolUtilization > 80) {
        health.checks.database.status =
          connectionPoolStats.poolUtilization > 90 ? 'critical' : 'warning'
        if (health.status === 'ok') {
          health.status = 'degraded'
        }
      }
    } else {
      health.checks.database = isProduction
        ? { status: 'unhealthy' }
        : {
            status: 'unhealthy',
            error: 'Not connected',
            readyState: mongoose.connection.readyState,
          }
      health.status = 'degraded'
    }
  } catch (error) {
    health.checks.database = isProduction
      ? { status: 'unhealthy' }
      : {
          status: 'unhealthy',
          error: error.message,
          readyState: mongoose.connection.readyState,
        }
    health.status = 'degraded'
  }

  // Memory check with environment-aware thresholds
  const memUsage = process.memoryUsage()
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

  // Adjust thresholds based on environment
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const warningThreshold = isDevelopment ? 85 : 80
  const criticalThreshold = isDevelopment ? 95 : 90

  health.checks.memory = {
    status:
      heapUsagePercent < warningThreshold
        ? 'healthy'
        : heapUsagePercent < criticalThreshold
          ? 'warning'
          : 'critical',
    usage: heapUsagePercent.toFixed(2) + '%',
    heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    environment: isDevelopment ? 'development' : 'production',
    thresholds: {
      warning: warningThreshold + '%',
      critical: criticalThreshold + '%',
    },
  }

  if (heapUsagePercent > criticalThreshold) {
    health.status = 'degraded'
  }

  // Cache check
  if (cache) {
    try {
      const stats = cache.getStats()
      health.checks.cache = {
        status: 'healthy',
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        hitRate:
          stats.keys > 0
            ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
            : 'N/A',
      }
    } catch (error) {
      health.checks.cache = {
        status: 'error',
        error: error.message,
      }
    }
  }

  // Response time
  health.responseTime = Date.now() - startTime + 'ms'

  // Determine HTTP status code
  // Return 200 for 'ok' and 'degraded' to avoid triggering outages on degraded state
  const statusCode = health.status === 'ok' || health.status === 'degraded' ? 200 : 500

  res.status(statusCode).json(health)
})

// Startup probe - for container orchestration
router.get('/startup', async (req, res) => {
  // Check if the application has completed initialization
  const isStarted = mongoose.connection.readyState === 1

  if (isStarted) {
    res.status(200).json({
      status: 'started',
      timestamp: new Date().toISOString(),
    })
  } else {
    res.status(503).json({
      status: 'starting',
      timestamp: new Date().toISOString(),
    })
  }
})

module.exports = router
