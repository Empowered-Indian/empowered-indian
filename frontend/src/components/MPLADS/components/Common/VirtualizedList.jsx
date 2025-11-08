import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import './VirtualizedList.css'

const VirtualizedList = ({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  emptyMessage = 'No items to display',
  loadMore = null,
  hasMore = false,
  isLoading = false,
  enablePullToRefresh = false,
  onRefresh = null,
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [, setTouchEnd] = useState({ x: 0, y: 0 })
  const [scrollMomentum, setScrollMomentum] = useState(0)
  const scrollElementRef = useRef(null)
  const containerRef = useRef(null)
  const lastScrollTime = useRef(0)
  const lastScrollTop = useRef(0)
  const momentumRaf = useRef(null)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  // Touch event handlers for mobile optimization
  const handleTouchStart = useCallback(
    e => {
      if (isMobile) {
        setTouchStart({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        })
        setPullDistance(0)

        // Cancel any ongoing momentum animation
        if (momentumRaf.current) {
          cancelAnimationFrame(momentumRaf.current)
          momentumRaf.current = null
        }
      }
    },
    [isMobile]
  )

  const handleTouchMove = useCallback(
    e => {
      if (!isMobile || !touchStart) return

      const currentY = e.touches[0].clientY
      const deltaY = currentY - touchStart.y

      // Pull-to-refresh logic
      if (enablePullToRefresh && onRefresh && scrollElementRef.current) {
        const scrollTop = scrollElementRef.current.scrollTop

        if (scrollTop <= 0 && deltaY > 0 && !isRefreshing) {
          e.preventDefault()
          const pullDist = Math.min(deltaY * 0.5, 80) // Damping effect
          setPullDistance(pullDist)
        }
      }

      setTouchEnd({
        x: e.touches[0].clientX,
        y: currentY,
      })
    },
    [isMobile, touchStart, enablePullToRefresh, onRefresh, isRefreshing]
  )

  const handleTouchEnd = useCallback(async () => {
    if (!isMobile) return

    // Pull-to-refresh trigger
    if (pullDistance > 60 && enablePullToRefresh && onRefresh && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh error:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    setPullDistance(0)
    setTouchStart(null)
    setTouchEnd(null)
  }, [isMobile, pullDistance, enablePullToRefresh, onRefresh, isRefreshing])

  // Enhanced scroll handler with momentum tracking
  const handleScroll = useCallback(
    e => {
      const currentScrollTop = e.target.scrollTop
      const currentTime = Date.now()

      setScrollTop(currentScrollTop)

      // Calculate momentum for mobile
      if (isMobile && lastScrollTime.current) {
        const timeDelta = currentTime - lastScrollTime.current
        const scrollDelta = currentScrollTop - lastScrollTop.current

        if (timeDelta > 0 && timeDelta < 100) {
          // Only calculate for recent scrolls
          const velocity = scrollDelta / timeDelta
          setScrollMomentum(velocity * 10) // Scale factor for momentum
        }
      }

      lastScrollTime.current = currentTime
      lastScrollTop.current = currentScrollTop

      // Check if we need to load more
      if (loadMore && hasMore && !isLoading) {
        const scrollPercentage = (currentScrollTop + containerHeight) / e.target.scrollHeight

        if (scrollPercentage > 0.8) {
          loadMore()
        }
      }
    },
    [containerHeight, loadMore, hasMore, isLoading, isMobile]
  )

  // Enhanced momentum scrolling for mobile
  const applyMomentumScrolling = useCallback(() => {
    if (!isMobile || Math.abs(scrollMomentum) < 0.1) {
      setScrollMomentum(0)
      return
    }

    if (scrollElementRef.current) {
      const newScrollTop = scrollElementRef.current.scrollTop + scrollMomentum
      scrollElementRef.current.scrollTop = Math.max(
        0,
        Math.min(
          scrollElementRef.current.scrollHeight - scrollElementRef.current.clientHeight,
          newScrollTop
        )
      )
    }

    setScrollMomentum(scrollMomentum * 0.92) // Friction factor
    momentumRaf.current = requestAnimationFrame(applyMomentumScrolling)
  }, [isMobile, scrollMomentum])

  // Start momentum scrolling
  useEffect(() => {
    if (Math.abs(scrollMomentum) > 0.1) {
      momentumRaf.current = requestAnimationFrame(applyMomentumScrolling)
    }
    return () => {
      if (momentumRaf.current) {
        cancelAnimationFrame(momentumRaf.current)
      }
    }
  }, [scrollMomentum, applyMomentumScrolling])

  // Update container height on resize
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateContainerHeight()

    // Use ResizeObserver if available, fallback to window resize
    if (window.ResizeObserver && containerRef.current) {
      const resizeObserver = new ResizeObserver(updateContainerHeight)
      resizeObserver.observe(containerRef.current)
      return () => resizeObserver.disconnect()
    } else {
      window.addEventListener('resize', updateContainerHeight)
      return () => window.removeEventListener('resize', updateContainerHeight)
    }
  }, [])

  // Cleanup momentum animation on unmount
  useEffect(() => {
    return () => {
      if (momentumRaf.current) {
        cancelAnimationFrame(momentumRaf.current)
      }
    }
  }, [])

  // Reset scroll position when items change significantly
  useEffect(() => {
    if (scrollElementRef.current && items.length === 0) {
      scrollElementRef.current.scrollTop = 0
      setScrollTop(0)
      setScrollMomentum(0)
    }
  }, [items.length])

  // Performance optimization: Use passive event listeners on mobile
  useEffect(() => {
    if (!isMobile || !scrollElementRef.current) return

    const scrollElement = scrollElementRef.current

    // Add passive touch listeners for better performance
    const passiveOptions = { passive: true }

    scrollElement.addEventListener('touchstart', handleTouchStart, passiveOptions)
    scrollElement.addEventListener('touchend', handleTouchEnd, passiveOptions)

    return () => {
      scrollElement.removeEventListener('touchstart', handleTouchStart)
      scrollElement.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, handleTouchStart, handleTouchEnd])

  if (items.length === 0 && !isLoading) {
    return (
      <div className={`virtualized-list-empty ${className} ${isMobile ? 'mobile' : ''}`}>
        <div className="empty-state">
          {isMobile ? (
            <>
              <div className="empty-icon">📝</div>
              <p className="empty-title">No items found</p>
              <p className="empty-subtitle">{emptyMessage}</p>
              {enablePullToRefresh && onRefresh && (
                <Button
                  variant="default"
                  className="mobile-refresh-btn"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Refreshing...' : 'Tap to refresh'}
                </Button>
              )}
            </>
          ) : (
            <p>{emptyMessage}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`virtualized-list-container ${className} ${isMobile ? 'mobile' : ''}`}
    >
      {/* Pull-to-refresh indicator */}
      {isMobile && enablePullToRefresh && (
        <div
          className={`pull-to-refresh ${pullDistance > 60 ? 'active' : ''} ${isRefreshing ? 'refreshing' : ''}`}
          style={{
            transform: `translateY(${Math.min(pullDistance, 80)}px)`,
            opacity: pullDistance > 0 ? 1 : 0,
          }}
        >
          <div className="refresh-indicator">
            {isRefreshing ? (
              <>
                <div className="loading-spinner small"></div>
                <span>Refreshing...</span>
              </>
            ) : pullDistance > 60 ? (
              <>
                <div className="refresh-arrow up">↑</div>
                <span>Release to refresh</span>
              </>
            ) : (
              <>
                <div className="refresh-arrow down">↓</div>
                <span>Pull to refresh</span>
              </>
            )}
          </div>
        </div>
      )}

      <div
        ref={scrollElementRef}
        className={`virtualized-list-scroll ${isMobile ? 'mobile-optimized' : ''}`}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          paddingTop: isMobile && enablePullToRefresh ? '4px' : '0',
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.5}px)` : 'none',
          transition: pullDistance === 0 && !isRefreshing ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        <div className="virtualized-list-total" style={{ height: `${totalHeight}px` }}>
          <div
            className="virtualized-list-visible"
            style={{ transform: `translateY(${offsetY}px)` }}
          >
            {visibleItems.map((item, index) => (
              <div
                key={startIndex + index}
                className={`virtualized-list-item ${isMobile ? 'mobile' : ''}`}
                style={{ height: `${itemHeight}px` }}
              >
                {renderItem(item, startIndex + index)}
              </div>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="virtualized-list-loading">
            <div className="loading-spinner"></div>
            <p>{isMobile ? 'Loading...' : 'Loading more items...'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VirtualizedList
