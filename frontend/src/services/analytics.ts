declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    analytics?: AnalyticsService
  }
}

/**
 * Safe Analytics Service for MPLADS Dashboard
 * Provides comprehensive tracking with error handling and fallbacks
 */
class AnalyticsService {
  isEnabled: boolean
  sessionId: string
  initialized: boolean
  eventQueue: Array<{ action: string; parameters: Record<string, any>; timestamp: number }>

  constructor() {
    this.isEnabled = false
    this.sessionId = this.generateSessionId()
    this.initialized = false
    this.eventQueue = []

    // Initialize safely
    this.init()
  }

  init() {
    try {
      // Check if gtag is available and working
      this.isEnabled =
        typeof window !== 'undefined' && typeof window.gtag === 'function' && !this.isOptedOut()

      if (this.isEnabled) {
        this.initialized = true
        // Process any queued events
        this.processEventQueue()
      }
    } catch (error) {
      console.warn('Analytics initialization failed:', error.message)
      this.isEnabled = false
    }
  }

  // Check if user has opted out of analytics
  isOptedOut() {
    try {
      return localStorage.getItem('analytics_opt_out') === 'true'
    } catch {
      return false // If localStorage fails, assume consent
    }
  }

  // Safe event tracking with fallbacks
  trackEvent(action, parameters = {}) {
    if (!action) return

    const eventData = {
      action,
      parameters: this.sanitizeParameters(parameters),
      timestamp: Date.now(),
    }

    if (!this.initialized) {
      // Queue events if analytics isn't ready
      this.eventQueue.push(eventData)
      return
    }

    if (!this.isEnabled) return

    try {
      const safeParams = {
        ...eventData.parameters,
        session_id: this.sessionId,
        app_name: 'MPLADS_Dashboard',
      }

      window.gtag('event', action, safeParams)
    } catch (error) {
      console.warn(`Analytics event failed: ${action}`, error.message)
    }
  }

  // Process queued events when analytics becomes ready
  processEventQueue() {
    if (!this.isEnabled || this.eventQueue.length === 0) return

    try {
      this.eventQueue.forEach(({ action, parameters }) => {
        this.trackEvent(action, parameters)
      })
      this.eventQueue = [] // Clear queue
    } catch (error) {
      console.warn('Failed to process analytics queue:', error.message)
    }
  }

  // Sanitize event parameters to prevent errors
  sanitizeParameters(params) {
    if (!params || typeof params !== 'object') return {}

    const sanitized = {}

    Object.entries(params).forEach(([key, value]) => {
      try {
        // Ensure key is valid
        const safeKey = String(key)
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .substring(0, 40)

        // Ensure value is safe
        if (value === null || value === undefined) {
          sanitized[safeKey] = ''
        } else if (typeof value === 'string') {
          sanitized[safeKey] = value.substring(0, 100)
        } else if (typeof value === 'number' && !isNaN(value)) {
          sanitized[safeKey] = value
        } else if (typeof value === 'boolean') {
          sanitized[safeKey] = value
        } else {
          sanitized[safeKey] = String(value).substring(0, 100)
        }
      } catch {
        // Skip problematic parameters
      }
    })

    return sanitized
  }

  // Search tracking
  trackSearch(searchTerm, resultsCount = 0, source = 'search_bar') {
    if (!searchTerm) return

    this.trackEvent('search', {
      search_term: String(searchTerm).substring(0, 100),
      results_count: Math.max(0, Number(resultsCount) || 0),
      source: String(source),
    })
  }

  // Filter usage tracking
  trackFilter(filterType, filterValue, activeCount = 0) {
    this.trackEvent('filter_applied', {
      filter_type: String(filterType),
      filter_value: String(filterValue).substring(0, 50),
      active_filter_count: Math.max(0, Number(activeCount) || 0),
    })
  }

  // Data export tracking
  trackExport(exportType, fileType, recordCount = 0) {
    this.trackEvent('file_download', {
      file_type: String(fileType),
      export_type: String(exportType),
      record_count: Math.max(0, Number(recordCount) || 0),
      value: 1, // Mark as conversion
    })
  }

  // Page view tracking (enhanced)
  trackPageView(pageName, additionalData = {}) {
    this.trackEvent('page_view', {
      page_title: String(pageName),
      ...additionalData,
    })
  }

  // Error tracking (anonymized)
  trackError(errorType, componentName, isFatal = false) {
    const errorDescription = `${String(errorType)}_${String(componentName)}`

    this.trackEvent('exception', {
      description: errorDescription,
      fatal: Boolean(isFatal),
      error_component: String(componentName),
    })
  }

  // Performance monitoring
  trackPerformance(metricName, value, context = {}) {
    this.trackEvent('custom_metric', {
      metric_name: metricName,
      metric_value: value,
      metric_category: 'performance',
      ...context,
    })
  }

  // Content engagement
  trackEngagement(contentType, contentId, action = 'view') {
    this.trackEvent('select_content', {
      content_type: String(contentType),
      content_id: String(contentId),
      engagement_action: String(action),
    })
  }

  // Generate session ID
  generateSessionId() {
    try {
      return (
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      )
    } catch {
      return 'session_' + Date.now()
    }
  }

  // Opt-out functionality
  optOut() {
    try {
      localStorage.setItem('analytics_opt_out', 'true')
      this.isEnabled = false
      console.log('Analytics disabled')
    } catch (error) {
      console.warn('Failed to opt out of analytics:', error.message)
    }
  }

  // Opt-in functionality
  optIn() {
    try {
      localStorage.removeItem('analytics_opt_out')
      this.init() // Re-initialize
      console.log('Analytics enabled')
    } catch (error) {
      console.warn('Failed to opt into analytics:', error.message)
    }
  }

  // Get analytics status
  getStatus() {
    return {
      enabled: this.isEnabled,
      initialized: this.initialized,
      queuedEvents: this.eventQueue.length,
      sessionId: this.sessionId,
    }
  }
}

// Create and export singleton instance
export const analytics = new AnalyticsService()

// Also export the class for testing
export { AnalyticsService }

// Development helper
if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') {
  if (typeof window !== 'undefined') {
    window.analytics = analytics // Make available in console for debugging
  }
}
