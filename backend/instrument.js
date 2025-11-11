const Sentry = require('@sentry/node')

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Disable sending PII data to Sentry for privacy protection
  sendDefaultPii: false,

  // Set environment
  environment: process.env.NODE_ENV || 'development',

  // Set sample rate for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})
