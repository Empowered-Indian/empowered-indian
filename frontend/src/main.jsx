import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import { AnalyticsProvider } from './contexts/AnalyticsContext'
import './index.css'
import App from './App.jsx'

// Initialize Sentry for error tracking (only if enabled and DSN is provided)
if (import.meta.env.VITE_ENABLE_SENTRY === 'true' && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',
    // Privacy-focused configuration for government app
    sendDefaultPii: false, // Don't send PII for government data platform
    beforeSend(event) {
      // Filter out sensitive information
      if (event.extra) {
        delete event.extra.props
        delete event.extra.state
      }
      if (event.contexts && event.contexts.state) {
        delete event.contexts.state
      }
      // Only send errors in production unless debug mode is enabled
      if (import.meta.env.MODE === 'development' && import.meta.env.VITE_DEBUG_MODE !== 'true') {
        return null
      }
      return event
    },
    integrations: [
      Sentry.browserTracingIntegration({
        // Only track performance if enabled
        enabled: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
      }),
      Sentry.replayIntegration({
        maskAllText: true, // Mask all text for privacy
        maskAllInputs: true, // Mask all inputs for privacy
        // Only enable replay in production
        enabled: import.meta.env.MODE === 'production',
      }),
    ],
    // Performance monitoring settings
    tracesSampleRate: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true' ? 0.1 : 0,
    replaysSessionSampleRate: 0.01, // Capture 1% of sessions for replay
    replaysOnErrorSampleRate: 0.1, // Capture 10% of sessions with errors
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider>
        <App />
      </AnalyticsProvider>
    </QueryClientProvider>
  </StrictMode>
)
