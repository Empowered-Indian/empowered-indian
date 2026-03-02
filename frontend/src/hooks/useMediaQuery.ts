import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive design using media queries
 * Returns boolean values for common breakpoints
 */
export const useMediaQuery = query => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    // Create a listener function
    const listener = event => {
      setMatches(event.matches)
    }

    // Add listener
    if (media.addEventListener) {
      media.addEventListener('change', listener)
    } else {
      // Fallback for older browsers
      media.addListener(listener)
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener)
      } else {
        // Fallback for older browsers
        media.removeListener(listener)
      }
    }
  }, [query])

  return matches
}

/**
 * Custom hook providing common responsive breakpoint checks
 * Based on Tailwind CSS default breakpoints
 */
export const useResponsive = () => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)')

  // Specific breakpoints
  const isSmallMobile = useMediaQuery('(max-width: 480px)')
  const isMediumMobile = useMediaQuery('(min-width: 481px) and (max-width: 768px)')

  // Touch device detection
  const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)')

  // Reduced motion preference
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isSmallMobile,
    isMediumMobile,
    isTouchDevice,
    prefersReducedMotion,

    // Helper functions
    isDesktopOrLarger: isDesktop || isLargeDesktop,
    isMobileOrTablet: isMobile || isTablet,
  }
}

export default useMediaQuery
