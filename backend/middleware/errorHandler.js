const { secureLogger } = require('../utils/logger')

const errorHandler = (err, req, res, _next) => {
  const correlationId = req.correlationId || 'unknown'
  const statusCode = err.status || err.statusCode || 500

  // Log error with appropriate level based on status code
  const logLevel = statusCode >= 500 ? 'error' : 'warn'

  secureLogger[logLevel](
    'Request error handled',
    {
      category: 'error',
      type: statusCode >= 500 ? 'server_error' : 'client_error',
      message: err.message,
      statusCode,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    },
    correlationId
  )

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    status: statusCode,
    correlationId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler
