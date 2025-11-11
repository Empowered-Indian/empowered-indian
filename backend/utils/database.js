const mongoose = require('mongoose')
const { secureLogger } = require('./logger')

// This module now proxies collections via the existing Mongoose connection
// to ensure a single MongoDB client/pool is used across the app.

const waitForMongoose = async (timeoutMs = 10000) => {
  if (mongoose.connection.readyState === 1) return // connected

  await new Promise((resolve, reject) => {
    const onConnected = () => {
      cleanup()
      resolve()
    }
    const onError = err => {
      cleanup()
      reject(err)
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for Mongoose connection'))
    }, timeoutMs)

    const cleanup = () => {
      clearTimeout(timer)
      mongoose.connection.off('connected', onConnected)
      mongoose.connection.off('error', onError)
    }

    mongoose.connection.once('connected', onConnected)
    mongoose.connection.once('error', onError)
  })
}

const connectToDatabase = async () => {
  // Backward-compatible: ensure Mongoose is connected and return native db
  await waitForMongoose()
  const db = mongoose.connection.db
  if (!db) {
    throw new Error('Mongoose connected but native db handle is unavailable')
  }
  return db
}

const getCollection = async collectionName => {
  const db = await connectToDatabase()
  return db.collection(collectionName)
}

const closeConnection = async () => {
  // No-op: Mongoose handles connection lifecycle via gracefulShutdown
  try {
    // Intentionally do nothing; keep for compatibility with server shutdown flow
    secureLogger.debug('closeConnection called (noop with Mongoose-managed pool)', {
      category: 'database',
      type: 'mongo_client_close_noop',
      timestamp: new Date().toISOString(),
    })
  } catch {
    // Ignore logging errors
  }
}

module.exports = {
  connectToDatabase,
  getCollection,
  closeConnection,
}
