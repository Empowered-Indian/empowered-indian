import React, { createContext, useEffect } from 'react'
import { analytics } from '../services/analytics'

const AnalyticsContext = createContext({
  analytics: null,
  trackEvent: () => {},
  trackSearch: () => {},
  trackFilter: () => {},
  trackExport: () => {},
  trackPageView: () => {},
  trackError: () => {},
  trackEngagement: () => {},
  reportErrorToSentry: () => {},
  trackPerformance: () => {},
})

export const AnalyticsProvider = ({ children }) => {
  useEffect(() => {
    // Initialize analytics when component mounts
    try {
      analytics.init()
    } catch (error) {
      console.warn('Analytics provider initialization failed:', error.message)
    }
  }, [])

  // Runtime guard: detect multiple provider mounts
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.__ANALYTICS_PROVIDER_MOUNT_COUNT__ =
          (window.__ANALYTICS_PROVIDER_MOUNT_COUNT__ || 0) + 1
        if (window.__ANALYTICS_PROVIDER_MOUNT_COUNT__ > 1) {
          console.warn('[Analytics] Multiple AnalyticsProvider mounts detected')
          // Record a lightweight event for observability
          try {
            analytics.trackError('duplicate_provider', 'AnalyticsProvider', false)
          } catch {
            // Ignore analytics errors in development
          }
        }
      }
    } catch {
      // Ignore window access errors in SSR
    }
    return () => {
      try {
        if (typeof window !== 'undefined') {
          const n = (window.__ANALYTICS_PROVIDER_MOUNT_COUNT__ || 1) - 1
          window.__ANALYTICS_PROVIDER_MOUNT_COUNT__ = n > 0 ? n : 0
        }
      } catch {
        // Ignore window access errors in SSR
      }
    }
  }, [])

  // Provide safe wrapper functions
  const trackEvent = (action, parameters) => {
    try {
      analytics.trackEvent(action, parameters)
    } catch (error) {
      console.warn('Track event failed:', error.message)
    }
  }

  const trackSearch = (searchTerm, resultsCount, source) => {
    try {
      analytics.trackSearch(searchTerm, resultsCount, source)
    } catch (error) {
      console.warn('Track search failed:', error.message)
    }
  }

  const trackFilter = (filterType, filterValue, activeCount) => {
    try {
      analytics.trackFilter(filterType, filterValue, activeCount)
    } catch (error) {
      console.warn('Track filter failed:', error.message)
    }
  }

  const trackExport = (exportType, fileType, recordCount) => {
    try {
      analytics.trackExport(exportType, fileType, recordCount)
    } catch (error) {
      console.warn('Track export failed:', error.message)
    }
  }

  const trackPageView = (pageName, additionalData) => {
    try {
      analytics.trackPageView(pageName, additionalData)
    } catch (error) {
      console.warn('Track page view failed:', error.message)
    }
  }

  const trackError = (errorType, componentName, isFatal) => {
    try {
      analytics.trackError(errorType, componentName, isFatal)
    } catch (error) {
      console.warn('Track error failed:', error.message)
    }
  }

  const trackEngagement = (contentType, contentId, action) => {
    try {
      analytics.trackEngagement(contentType, contentId, action)
    } catch (error) {
      console.warn('Track engagement failed:', error.message)
    }
  }

  const reportErrorToSentry = (error, context) => {
    try {
      analytics.reportErrorToSentry(error, context)
    } catch (sentryError) {
      console.warn('Report error to Sentry failed:', sentryError.message)
    }
  }

  const trackPerformance = (metricName, value, context) => {
    try {
      analytics.trackPerformance(metricName, value, context)
    } catch (error) {
      console.warn('Track performance failed:', error.message)
    }
  }

  const value = {
    analytics,
    trackEvent,
    trackSearch,
    trackFilter,
    trackExport,
    trackPageView,
    trackError,
    trackEngagement,
    reportErrorToSentry,
    trackPerformance,
  }

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}

export { AnalyticsContext }
export default AnalyticsProvider
