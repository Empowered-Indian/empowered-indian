import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAnalytics } from '../../hooks/useAnalytics'
import { getRoutePageViewPayload } from '../../utils/routeAnalytics'

const RouteAnalytics = () => {
  const { pathname, search } = useLocation()
  const { trackPageView } = useAnalytics()
  const lastTrackedPath = useRef('')

  useEffect(() => {
    const pathWithSearch = `${pathname}${search}`

    if (lastTrackedPath.current === pathWithSearch) {
      return
    }

    lastTrackedPath.current = pathWithSearch

    const { pageName, parameters } = getRoutePageViewPayload(
      pathname,
      search,
      window.location.origin
    )

    trackPageView(pageName, parameters)
  }, [pathname, search, trackPageView])

  return null
}

export default RouteAnalytics
