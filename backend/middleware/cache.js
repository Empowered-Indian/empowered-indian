const NodeCache = require('node-cache')
const { secureLogger } = require('../utils/logger')

// Create cache instance with optimized settings for low memory
const cache = new NodeCache({
  stdTTL: 6 * 60 * 60, // Reduced to 6 hours
  checkperiod: 30 * 60, // Check every 30 minutes
  useClones: false,
  maxKeys: 1000, // Increased from 100 to handle search queries
  deleteOnExpire: true, // Automatically delete expired keys
  errorOnMissing: false, // Don't throw errors on cache misses
})

// Memory monitoring and cleanup
const MAX_MEMORY_MB = process.env.CACHE_MAX_MEMORY_MB
  ? parseInt(process.env.CACHE_MAX_MEMORY_MB)
  : 100
const CLEANUP_THRESHOLD = 0.8 // Start cleanup at 80% of max memory

const getMemoryUsage = () => {
  const stats = cache.getStats()
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
  }
}

const performMemoryCleanup = req => {
  const stats = getMemoryUsage()

  if (stats.memoryUsageMB > MAX_MEMORY_MB * CLEANUP_THRESHOLD) {
    const keys = cache.keys()
    const keysToDelete = Math.floor(keys.length * 0.3) // Clear 30% when memory is high

    secureLogger.warn(
      'Memory-based cache cleanup triggered',
      {
        category: 'cache',
        type: 'memory_cleanup',
        memoryUsageMB: stats.memoryUsageMB,
        maxMemoryMB: MAX_MEMORY_MB,
        totalKeys: keys.length,
        keysToDelete,
      },
      req?.correlationId
    )

    // Delete oldest entries (assuming keys are roughly chronological)
    keys.slice(0, keysToDelete).forEach(key => cache.del(key))

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }

    return true
  }
  return false
}

// Cache middleware factory
const cacheMiddleware = (duration = 24 * 60 * 60) => {
  return (req, res, next) => {
    // Only cache safe idempotent GETs
    if (req.method !== 'GET') {
      return next()
    }

    // Create cache key from method + URL; add per-user scope when authenticated
    const baseKey = `${req.method}:${req.originalUrl || req.url}`
    const key = req.user?.id ? `user:${req.user.id}:${baseKey}` : baseKey

    try {
      const cachedResponse = cache.get(key)

      if (cachedResponse) {
        secureLogger.debug(
          'Cache hit',
          {
            category: 'performance',
            type: 'cache_hit',
            key,
            timestamp: new Date().toISOString(),
          },
          req.correlationId
        )
        return res.json({
          ...cachedResponse,
          cached: true,
          cache_timestamp: new Date().toISOString(),
        })
      }

      // Store original res.json
      const originalJson = res.json

      // Prevent multiple overrides for same response object
      if (!res._cacheHandlerSet) {
        res._cacheHandlerSet = true

        // Override res.json to cache the response
        res.json = function (data) {
          // Only cache successful responses once
          if (res.statusCode === 200 && data.success !== false && !res._responseCached) {
            res._responseCached = true

            // Check memory usage before caching
            performMemoryCleanup(req)

            try {
              cache.set(key, data, duration)
            } catch (cacheError) {
              // Handle cache full errors gracefully
              if (cacheError.code === 'ECACHEFULL') {
                secureLogger.warn(
                  'Cache full, clearing oldest entries',
                  {
                    category: 'cache',
                    type: 'cache_full_cleanup',
                    totalKeys: cache.keys().length,
                  },
                  req.correlationId
                )

                // Clear 10% of cache entries to make room
                const keys = cache.keys()
                const keysToDelete = Math.floor(keys.length * 0.1)
                keys.slice(0, keysToDelete).forEach(k => cache.del(k))

                // Retry cache set
                try {
                  cache.set(key, data, duration)
                } catch (retryError) {
                  secureLogger.error(
                    'Cache retry failed',
                    {
                      category: 'cache',
                      error: retryError.message,
                    },
                    req.correlationId
                  )
                }
              } else {
                secureLogger.error(
                  'Cache set error',
                  {
                    category: 'cache',
                    error: cacheError.message,
                  },
                  req.correlationId
                )
              }
            }

            secureLogger.debug(
              'Response cached',
              {
                category: 'performance',
                type: 'cache_set',
                key: '[REDACTED]', // Don't log full key for security
                duration: `${duration}s`,
              },
              req.correlationId
            )
          }

          // Call original json method
          originalJson.call(this, data)

          // Clean up override after response to prevent memory leaks
          res.json = originalJson
          res._cacheHandlerSet = false
          res._responseCached = false
        }
      }

      next()
    } catch (error) {
      secureLogger.error(
        'Cache middleware error',
        {
          category: 'cache',
          type: 'cache_middleware_error',
          error: error.message,
          key,
          timestamp: new Date().toISOString(),
        },
        req.correlationId
      )
      next()
    }
  }
}

// Cache invalidation utility
const invalidateCache = pattern => {
  const keys = cache.keys()
  const keysToDelete = keys.filter(key => key.includes(pattern))

  keysToDelete.forEach(key => {
    cache.del(key)
  })

  secureLogger.info('Cache invalidation completed', {
    category: 'cache',
    type: 'cache_invalidation',
    pattern,
    entriesInvalidated: keysToDelete.length,
    timestamp: new Date().toISOString(),
  })
}

module.exports = {
  cache,
  cacheMiddleware,
  invalidateCache,
  getMemoryUsage,
  performMemoryCleanup,
}
