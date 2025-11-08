import React from 'react'
import * as Sentry from '@sentry/react'
import { FiAlertTriangle, FiRefreshCw, FiHome, FiInfo } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import './ErrorBoundary.css'

class ErrorBoundary extends React.Component {
  static defaultProps = {
    level: 'page', // 'page', 'section', 'component'
    showDetails: false,
    onReset: null,
    fallback: null,
  }
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo)
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    })

    // Report error to Sentry with additional context
    Sentry.withScope(scope => {
      // Add context information
      scope.setTag('errorBoundary', this.props.level || 'unknown')
      scope.setTag('component', this.constructor.name)

      // Add component hierarchy information
      if (errorInfo?.componentStack) {
        scope.setContext('componentStack', {
          stack: errorInfo.componentStack,
        })
      }

      // Add user context (non-PII)
      scope.setUser({
        id: null, // No user tracking for government app
        ip_address: null, // No IP tracking
      })

      // Add additional context
      scope.setContext('errorBoundary', {
        level: this.props.level,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      })

      // Report the error
      Sentry.captureException(error)
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      // Default: reload the page
      window.location.reload()
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportError = () => {
    // In a real app, this would send error reports to a service
    const errorInfo = {
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }

    console.log('Error Report:', errorInfo)

    // Show user feedback
    alert('Error report has been logged. Thank you for helping us improve!')
  }

  render() {
    if (this.state.hasError) {
      const { fallback: CustomFallback } = this.props

      // If a custom fallback is provided, use it
      if (CustomFallback) {
        return (
          <CustomFallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onReset={this.handleReset}
            onGoHome={this.handleGoHome}
          />
        )
      }

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-boundary-header">
              <FiAlertTriangle className="error-icon" />
              <h1>Something went wrong</h1>
              <p className="error-message">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            <div className="error-boundary-details">
              <div className="error-suggestion">
                <FiInfo className="suggestion-icon" />
                <div>
                  <h3>What you can do:</h3>
                  <ul>
                    <li>Try refreshing the page</li>
                    <li>Go back to the home page</li>
                    <li>Check your internet connection</li>
                    <li>Contact support if the issue persists</li>
                  </ul>
                </div>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="error-technical-details">
                  <summary>Technical Details (Development Only)</summary>
                  <div className="error-technical-content">
                    <div className="error-section">
                      <h4>Error Message:</h4>
                      <pre className="error-text">{this.state.error.toString()}</pre>
                    </div>

                    {this.state.error.stack && (
                      <div className="error-section">
                        <h4>Stack Trace:</h4>
                        <pre className="error-stack">{this.state.error.stack}</pre>
                      </div>
                    )}

                    {this.state.errorInfo?.componentStack && (
                      <div className="error-section">
                        <h4>Component Stack:</h4>
                        <pre className="error-stack">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="error-actions">
              <Button
                variant="default"
                onClick={this.handleReset}
                className="error-action-primary gap-2 bg-blue-600 text-white hover:bg-blue-700"
                title="Refresh the page and try again"
              >
                <FiRefreshCw />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="error-action-secondary gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                title="Go back to the home page"
              >
                <FiHome />
                Go Home
              </Button>
              {!import.meta.env.DEV && (
                <Button
                  variant="outline"
                  onClick={this.handleReportError}
                  className="error-action-utility"
                  title="Help us fix this issue by reporting it"
                >
                  Report Issue
                </Button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
