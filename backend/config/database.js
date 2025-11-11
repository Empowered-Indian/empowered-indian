const mongoose = require('mongoose')
const { secureLogger } = require('../utils/logger')

const MAX_RETRIES = 5
const _INITIAL_RETRY_DELAY = 1000 // 1 second
const BASE_RETRY_DELAY = 1000

// Environment-based configuration
const _isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Connection pool configuration
const getConnectionConfig = () => {
  const baseConfig = {
    // Note: useNewUrlParser and useUnifiedTopology are deprecated and no longer needed in MongoDB Driver 4.0+

    // Connection pool settings
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || (isProduction ? 100 : 10),
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || (isProduction ? 10 : 5),
    maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME_MS) || (isProduction ? 60000 : 30000), // 1 min prod, 30s dev

    // Timeout settings
    serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 10000, // 10 seconds
    socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS) || 45000, // 45 seconds
    connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT_MS) || 10000, // 10 seconds

    // Reliability settings
    retryWrites: process.env.DB_RETRY_WRITES !== 'false', // Default true
    w: process.env.DB_WRITE_CONCERN || 'majority',
    // Note: bufferMaxEntries is handled by mongoose, not MongoDB driver
    // We'll handle buffer control via mongoose options
    bufferCommands: process.env.DB_BUFFER_COMMANDS !== 'false', // Default true

    // Monitoring and heartbeat
    heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQUENCY_MS) || 10000, // 10 seconds

    // Application name for monitoring
    appName: process.env.DB_APP_NAME || 'MPLADS-Dashboard',
  }

  // Additional production settings
  if (isProduction) {
    baseConfig.readPreference = 'secondaryPreferred'
    baseConfig.readConcern = { level: 'majority' }
  }

  return baseConfig
}

// Connection pool statistics
let poolStats = {
  totalConnections: 0,
  activeConnections: 0,
  availableConnections: 0,
  poolExhaustedEvents: 0,
  connectionCreatedEvents: 0,
  connectionClosedEvents: 0,
  lastPoolExhausted: null,
  connectionErrors: 0,
  reconnectAttempts: 0,
}

// Pool monitoring functions
const logPoolStats = () => {
  const stats = {
    ...poolStats,
    poolUtilization:
      poolStats.totalConnections > 0
        ? ((poolStats.activeConnections / poolStats.totalConnections) * 100).toFixed(2) + '%'
        : '0%',
    timestamp: new Date().toISOString(),
  }

  secureLogger.info('Connection pool statistics', {
    category: 'database',
    type: 'pool_stats',
    stats,
    timestamp: new Date().toISOString(),
  })

  // Alert if pool utilization is high
  const utilizationPercent =
    poolStats.totalConnections > 0
      ? (poolStats.activeConnections / poolStats.totalConnections) * 100
      : 0

  if (utilizationPercent > 80) {
    secureLogger.warn('High database connection pool utilization', {
      category: 'database',
      type: 'pool_utilization_warning',
      utilization: utilizationPercent.toFixed(2) + '%',
      activeConnections: poolStats.activeConnections,
      totalConnections: poolStats.totalConnections,
      timestamp: new Date().toISOString(),
    })
  }
}

// Setup connection event monitoring
const setupConnectionMonitoring = () => {
  const connection = mongoose.connection
  // Prefer attaching to the underlying MongoClient to ensure we receive
  // native driver pool events, fall back to the Mongoose connection emitter.
  const client =
    typeof connection.getClient === 'function' ? connection.getClient() : connection.client
  const target = client || connection

  // Pool events
  target.on('connectionPoolCreated', event => {
    secureLogger.info('Connection pool created', {
      category: 'database',
      type: 'pool_created',
      address: event.address,
      maxPoolSize: event.options?.maxPoolSize,
      minPoolSize: event.options?.minPoolSize,
      timestamp: new Date().toISOString(),
    })
  })

  target.on('connectionCreated', event => {
    poolStats.connectionCreatedEvents++
    poolStats.totalConnections++

    secureLogger.debug('Database connection created', {
      category: 'database',
      type: 'connection_created',
      connectionId: event.connectionId,
      address: event.address,
      timestamp: new Date().toISOString(),
    })
  })

  target.on('connectionClosed', event => {
    poolStats.connectionClosedEvents++
    poolStats.totalConnections = Math.max(0, poolStats.totalConnections - 1)

    secureLogger.debug('Database connection closed', {
      category: 'database',
      type: 'connection_closed',
      connectionId: event.connectionId,
      reason: event.reason,
      timestamp: new Date().toISOString(),
    })
  })

  target.on('connectionCheckOutStarted', event => {
    secureLogger.debug('Connection checkout started', {
      category: 'database',
      type: 'checkout_started',
      address: event.address,
      timestamp: new Date().toISOString(),
    })
  })

  target.on('connectionCheckedOut', _event => {
    poolStats.activeConnections++
    poolStats.availableConnections = Math.max(0, poolStats.availableConnections - 1)
  })

  target.on('connectionCheckedIn', _event => {
    poolStats.activeConnections = Math.max(0, poolStats.activeConnections - 1)
    poolStats.availableConnections++
  })

  target.on('connectionPoolReady', event => {
    secureLogger.info('Connection pool ready', {
      category: 'database',
      type: 'pool_ready',
      address: event.address,
      timestamp: new Date().toISOString(),
    })
  })

  target.on('connectionPoolClosed', event => {
    secureLogger.info('Connection pool closed', {
      category: 'database',
      type: 'pool_closed',
      address: event.address,
      timestamp: new Date().toISOString(),
    })
  })

  // Pool exhaustion monitoring
  target.on('connectionPoolReady', () => {
    // Monitor for pool exhaustion
    const checkPoolExhaustion = () => {
      if (poolStats.availableConnections === 0 && poolStats.totalConnections > 0) {
        poolStats.poolExhaustedEvents++
        poolStats.lastPoolExhausted = new Date().toISOString()

        secureLogger.error('Database connection pool exhausted', {
          category: 'database',
          type: 'pool_exhausted',
          totalConnections: poolStats.totalConnections,
          activeConnections: poolStats.activeConnections,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Check every 30 seconds - store interval ID for cleanup
    poolStats.monitoringInterval = setInterval(checkPoolExhaustion, 30000)
  })
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const connectDB = async () => {
  let retries = 0

  while (retries < MAX_RETRIES) {
    try {
      const config = getConnectionConfig()
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mplads'

      secureLogger.info('Attempting database connection', {
        category: 'database',
        type: 'connection_attempt',
        attempt: retries + 1,
        maxRetries: MAX_RETRIES,
        config: {
          maxPoolSize: config.maxPoolSize,
          minPoolSize: config.minPoolSize,
          maxIdleTimeMS: config.maxIdleTimeMS,
          serverSelectionTimeoutMS: config.serverSelectionTimeoutMS,
        },
        timestamp: new Date().toISOString(),
      })

      const conn = await mongoose.connect(uri, config)

      secureLogger.info('MongoDB connection established', {
        category: 'database',
        type: 'connection_success',
        host: conn.connection.host,
        database: conn.connection.name,
        poolConfig: {
          maxPoolSize: config.maxPoolSize,
          minPoolSize: config.minPoolSize,
          maxIdleTimeMS: config.maxIdleTimeMS,
        },
        timestamp: new Date().toISOString(),
      })

      // Setup connection monitoring
      setupConnectionMonitoring()

      // Log pool stats every 5 minutes in production, 30 seconds in development
      const statsInterval = isProduction ? 5 * 60 * 1000 : 30 * 1000
      poolStats.statsInterval = setInterval(logPoolStats, statsInterval)

      // Enhanced connection event handlers
      mongoose.connection.on('error', err => {
        poolStats.connectionErrors++
        secureLogger.error('MongoDB connection error', {
          category: 'database',
          type: 'connection_error',
          error: err.message,
          errorCount: poolStats.connectionErrors,
          timestamp: new Date().toISOString(),
        })
      })

      mongoose.connection.on('disconnected', () => {
        poolStats.reconnectAttempts++
        secureLogger.warn('MongoDB disconnected, attempting to reconnect', {
          category: 'database',
          type: 'disconnection',
          reconnectAttempt: poolStats.reconnectAttempts,
          timestamp: new Date().toISOString(),
        })

        // Reset pool stats on disconnection
        poolStats.activeConnections = 0
        poolStats.availableConnections = 0
      })

      mongoose.connection.on('reconnected', () => {
        secureLogger.info('MongoDB reconnected successfully', {
          category: 'database',
          type: 'reconnection_success',
          reconnectAttempt: poolStats.reconnectAttempts,
          timestamp: new Date().toISOString(),
        })
      })

      mongoose.connection.on('close', () => {
        secureLogger.info('MongoDB connection closed', {
          category: 'database',
          type: 'connection_closed',
          timestamp: new Date().toISOString(),
        })
      })

      return conn
    } catch (error) {
      retries++

      if (retries === MAX_RETRIES) {
        secureLogger.error('Database connection failed after maximum retries', {
          category: 'database',
          type: 'connection_failure',
          error: error.message,
          maxRetries: MAX_RETRIES,
          totalConnectionErrors: poolStats.connectionErrors,
          timestamp: new Date().toISOString(),
        })
        process.exit(1)
      }

      // Enhanced exponential backoff with jitter
      const baseDelay = BASE_RETRY_DELAY * Math.pow(2, retries - 1)
      const jitter = Math.random() * 0.3 * baseDelay // Add up to 30% jitter
      const delay = Math.min(baseDelay + jitter, 30000) // Cap at 30 seconds

      secureLogger.warn('Database connection retry attempt', {
        category: 'database',
        type: 'connection_retry',
        attempt: retries,
        maxRetries: MAX_RETRIES,
        retryDelay: `${Math.round(delay)}ms`,
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString(),
      })

      await sleep(delay)
    }
  }
}

// Graceful shutdown handler
const gracefulShutdown = async signal => {
  secureLogger.info('Database graceful shutdown initiated', {
    category: 'database',
    type: 'shutdown_start',
    signal,
    timestamp: new Date().toISOString(),
  })

  try {
    // Clear monitoring interval to prevent memory leak
    if (poolStats.monitoringInterval) {
      clearInterval(poolStats.monitoringInterval)
      poolStats.monitoringInterval = null
    }

    // Clear stats logging interval to prevent memory leak
    if (poolStats.statsInterval) {
      clearInterval(poolStats.statsInterval)
      poolStats.statsInterval = null
    }

    // Log final pool statistics
    logPoolStats()

    // Close MongoDB connection
    await mongoose.connection.close()

    secureLogger.info('Database connection closed successfully', {
      category: 'database',
      type: 'shutdown_complete',
      signal,
      finalStats: poolStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    secureLogger.error('Error during database shutdown', {
      category: 'database',
      type: 'shutdown_error',
      error: error.message,
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}

// Export connection stats for health checks
const getConnectionStats = () => ({
  ...poolStats,
  isConnected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  readyStateText:
    ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] ||
    'unknown',
  poolUtilization:
    poolStats.totalConnections > 0
      ? parseFloat(((poolStats.activeConnections / poolStats.totalConnections) * 100).toFixed(2))
      : 0,
  host: mongoose.connection.host,
  name: mongoose.connection.name,
  timestamp: new Date().toISOString(),
})

module.exports = {
  connectDB,
  gracefulShutdown,
  getConnectionStats,
  poolStats,
}
