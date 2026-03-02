import { useState, useEffect } from 'react'
import { FiLoader, FiRefreshCw } from 'react-icons/fi'
import SkeletonLoader from './SkeletonLoader'
import { Button } from '@/components/ui/button'
import './LoadingState.css'

const LoadingState = ({
  type = 'default',
  message = 'Loading...',
  size = 'medium',
  showProgress = false,
  progressValue = 0,
  timeout = 30000, // 30 seconds
  onTimeout,
  className = '',
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const [dots, setDots] = useState('')

  // Round progress value to avoid decimals
  const roundedProgress = Math.round(progressValue)

  // Animated dots for loading message
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // Timeout handling
  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setHasTimedOut(true)
        onTimeout?.()
      }, timeout)

      return () => clearTimeout(timer)
    }
  }, [timeout, onTimeout])

  if (hasTimedOut) {
    return (
      <div className={`loading-state loading-timeout ${className}`}>
        <div className="loading-timeout-content">
          <FiRefreshCw className="loading-timeout-icon" />
          <h3>Taking longer than expected</h3>
          <p>The request is taking longer than usual. This might be due to high server load.</p>
          <Button
            variant="default"
            className="loading-retry-btn"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  const renderLoadingContent = () => {
    switch (type) {
      case 'skeleton':
        return <SkeletonLoader type="card" count={3} />

      case 'table':
        return <SkeletonLoader type="table" />

      case 'chart':
        return <SkeletonLoader type="chart" />

      case 'minimal':
        return (
          <div className="loading-minimal">
            <FiLoader className="loading-spinner-minimal" />
          </div>
        )

      case 'inline':
        return (
          <div className="loading-inline">
            <FiLoader className="loading-spinner-inline" />
            <span>
              {message}
              {dots}
            </span>
          </div>
        )

      default:
        return (
          <div className="loading-default">
            <div className="loading-spinner-container">
              <FiLoader className={`loading-spinner loading-spinner-${size}`} />
              {showProgress && (
                <div className="loading-progress">
                  <div className="loading-progress-bar" style={{ width: `${roundedProgress}%` }} />
                </div>
              )}
            </div>
            <div className="loading-message">
              <p>
                {message}
                {dots}
              </p>
              {showProgress && <span className="loading-percentage">{roundedProgress}%</span>}
            </div>
          </div>
        )
    }
  }

  return (
    <div className={`loading-state loading-${type} loading-${size} ${className}`}>
      {renderLoadingContent()}
    </div>
  )
}

// Specialized loading components for common use cases
export const TableLoadingState = ({ message = 'Loading data...', ...props }) => (
  <LoadingState type="table" message={message} {...props} />
)

export const ChartLoadingState = ({ message = 'Loading chart...', ...props }) => (
  <LoadingState type="chart" message={message} {...props} />
)

export const InlineLoadingState = ({ message = 'Loading...', ...props }) => (
  <LoadingState type="inline" message={message} size="small" {...props} />
)

export const MinimalLoadingState = ({ ...props }) => (
  <LoadingState type="minimal" size="small" {...props} />
)

// Enhanced loading state with filter feedback
export const FilterLoadingState = ({
  message = 'Applying filters...',
  filtersCount = 0,
  ...props
}) => (
  <LoadingState
    type="inline"
    message={
      filtersCount > 0
        ? `Applying ${filtersCount} filter${filtersCount > 1 ? 's' : ''}...`
        : message
    }
    size="small"
    {...props}
  />
)

// Search results loading state
export const SearchLoadingState = ({ query = '', message = 'Searching...', ...props }) => (
  <LoadingState
    type="inline"
    message={query ? `Searching for "${query}"...` : message}
    size="small"
    {...props}
  />
)

export default LoadingState
