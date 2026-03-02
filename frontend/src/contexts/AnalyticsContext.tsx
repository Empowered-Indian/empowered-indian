import { createContext, useEffect, type ReactNode } from 'react'
import { analytics } from '../services/analytics'

type AnalyticsContextType = {
  analytics: any
  trackEvent: (...args: any[]) => void
  trackSearch: (...args: any[]) => void
  trackFilter: (...args: any[]) => void
  trackExport: (...args: any[]) => void
  trackPageView: (...args: any[]) => void
  trackError: (...args: any[]) => void
  trackEngagement: (...args: any[]) => void
  reportErrorToSentry: (...args: any[]) => void
  trackPerformance: (...args: any[]) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
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
        ;(window as any).__ANALYTICS_PROVIDER_MOUNT_COUNT__ =
          ((window as any).__ANALYTICS_PROVIDER_MOUNT_COUNT__ || 0) + 1
        if ((window as any).__ANALYTICS_PROVIDER_MOUNT_COUNT__ > 1) {
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
          const n = ((window as any).__ANALYTICS_PROVIDER_MOUNT_COUNT__ || 1) - 1
          ;(window as any).__ANALYTICS_PROVIDER_MOUNT_COUNT__ = n > 0 ? n : 0
        }
      } catch {
        // Ignore window access errors in SSR
      }
    }
  }, [])

  // Provide safe wrapper functions
  const trackEvent = (action: any, parameters: any) => {
    try {
      analytics.trackEvent(action, parameters)
    } catch (error) {
      console.warn('Track event failed:', error.message)
    }
  }

  const trackSearch = (searchTerm: any, resultsCount: any, source: any) => {
    try {
      analytics.trackSearch(searchTerm, resultsCount, source)
    } catch (error) {
      console.warn('Track search failed:', error.message)
    }
  }

  const trackFilter = (filterType: any, filterValue: any, activeCount: any) => {
    try {
      analytics.trackFilter(filterType, filterValue, activeCount)
    } catch (error) {
      console.warn('Track filter failed:', error.message)
    }
  }

  const trackExport = (exportType: any, fileType: any, recordCount: any) => {
    try {
      analytics.trackExport(exportType, fileType, recordCount)
    } catch (error) {
      console.warn('Track export failed:', error.message)
    }
  }

  const trackPageView = (pageName: any, additionalData: any) => {
    try {
      analytics.trackPageView(pageName, additionalData)
    } catch (error) {
      console.warn('Track page view failed:', error.message)
    }
  }

  const trackError = (errorType: any, componentName: any, isFatal: any) => {
    try {
      analytics.trackError(errorType, componentName, isFatal)
    } catch (error) {
      console.warn('Track error failed:', error.message)
    }
  }

  const trackEngagement = (contentType: any, contentId: any, action: any) => {
    try {
      analytics.trackEngagement(contentType, contentId, action)
    } catch (error) {
      console.warn('Track engagement failed:', error.message)
    }
  }

  const reportErrorToSentry = (error: any, context: any) => {
    try {
      analytics.reportErrorToSentry(error, context)
    } catch (sentryError) {
      console.warn('Report error to Sentry failed:', sentryError.message)
    }
  }

  const trackPerformance = (metricName: any, value: any, context: any) => {
    try {
      analytics.trackPerformance(metricName, value, context)
    } catch (error) {
      console.warn('Track performance failed:', error.message)
    }
  }

  const value: AnalyticsContextType = {
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
