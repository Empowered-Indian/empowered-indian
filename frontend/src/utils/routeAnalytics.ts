type RouteAnalyticsMetadata = {
  pageName: string
  routePattern: string
  contentType: string
  contentId?: string
  search?: string
}

const sensitiveRoutePatterns = new Set([
  '/verify-email',
  '/unsubscribe/:token',
  '/unsubscribe-success',
])

const staticRoutes: Record<string, RouteAnalyticsMetadata> = {
  '/': {
    pageName: 'Home',
    routePattern: '/',
    contentType: 'marketing_page',
  },
  '/about-us': {
    pageName: 'About Us',
    routePattern: '/about-us',
    contentType: 'marketing_page',
  },
  '/faq': {
    pageName: 'FAQ',
    routePattern: '/faq',
    contentType: 'support_page',
  },
  '/privacy-policy': {
    pageName: 'Privacy Policy',
    routePattern: '/privacy-policy',
    contentType: 'legal_page',
  },
  '/terms-of-service': {
    pageName: 'Terms of Service',
    routePattern: '/terms-of-service',
    contentType: 'legal_page',
  },
  '/login': {
    pageName: 'Login',
    routePattern: '/login',
    contentType: 'auth_page',
  },
  '/verify-email': {
    pageName: 'Verify Email',
    routePattern: '/verify-email',
    contentType: 'auth_page',
  },
  '/unsubscribe-success': {
    pageName: 'Unsubscribe Success',
    routePattern: '/unsubscribe-success',
    contentType: 'mailing_list_page',
  },
  '/mplads': {
    pageName: 'MPLADS Dashboard',
    routePattern: '/mplads',
    contentType: 'dashboard',
  },
  '/mplads/dashboard': {
    pageName: 'MPLADS Dashboard',
    routePattern: '/mplads/dashboard',
    contentType: 'dashboard',
  },
  '/mplads/track-area': {
    pageName: 'Track Area',
    routePattern: '/mplads/track-area',
    contentType: 'analysis_page',
  },
  '/mplads/compare': {
    pageName: 'Compare',
    routePattern: '/mplads/compare',
    contentType: 'analysis_page',
  },
  '/mplads/report': {
    pageName: 'Report',
    routePattern: '/mplads/report',
    contentType: 'report_page',
  },
  '/mplads/search': {
    pageName: 'Search Results',
    routePattern: '/mplads/search',
    contentType: 'search_page',
  },
  '/mplads/states': {
    pageName: 'States',
    routePattern: '/mplads/states',
    contentType: 'state_list',
  },
  '/mplads/mps': {
    pageName: 'MPs',
    routePattern: '/mplads/mps',
    contentType: 'mp_list',
  },
  '/mplads/admin': {
    pageName: 'Admin',
    routePattern: '/mplads/admin',
    contentType: 'admin_page',
  },
}

const sanitizePathname = (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized || '/'
}

const decodePathSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

const getSingleSegmentParam = (pathname: string, routePrefix: string) => {
  const prefixWithSlash = `${routePrefix}/`

  if (!pathname.startsWith(prefixWithSlash)) {
    return undefined
  }

  const encodedSegment = pathname.slice(prefixWithSlash.length)

  if (!encodedSegment || encodedSegment.includes('/')) {
    return undefined
  }

  return decodePathSegment(encodedSegment)
}

export const getRouteAnalyticsMetadata = (
  pathname: string,
  search = ''
): RouteAnalyticsMetadata => {
  const normalizedPathname = sanitizePathname(pathname)
  const staticRoute = staticRoutes[normalizedPathname]

  if (staticRoute) {
    return {
      ...staticRoute,
      search,
    }
  }

  if (normalizedPathname.startsWith('/unsubscribe/')) {
    return {
      pageName: 'Unsubscribe',
      routePattern: '/unsubscribe/:token',
      contentType: 'mailing_list_page',
      search,
    }
  }

  const mpId = getSingleSegmentParam(normalizedPathname, '/mplads/mps')
  if (mpId) {
    return {
      pageName: 'MP Detail',
      routePattern: '/mplads/mps/:mpId',
      contentType: 'mp_profile',
      contentId: mpId,
      search,
    }
  }

  const stateId = getSingleSegmentParam(normalizedPathname, '/mplads/states')
  if (stateId) {
    return {
      pageName: 'State Detail',
      routePattern: '/mplads/states/:stateId',
      contentType: 'state_profile',
      contentId: stateId,
      search,
    }
  }

  return {
    pageName: 'Not Found',
    routePattern: '*',
    contentType: 'not_found',
    search,
  }
}

export const getRoutePageViewPayload = (pathname: string, search = '', origin = '') => {
  const metadata = getRouteAnalyticsMetadata(pathname, search)
  const pathWithSearch = `${pathname}${search}`
  const isSensitiveRoute = sensitiveRoutePatterns.has(metadata.routePattern)
  const pagePath = isSensitiveRoute ? metadata.routePattern : pathWithSearch || '/'
  const pageLocation = origin ? `${origin}${pagePath}` : pagePath

  return {
    pageName: metadata.pageName,
    parameters: {
      page_path: pagePath,
      page_location: pageLocation,
      route_pattern: metadata.routePattern,
      content_type: metadata.contentType,
      content_id: isSensitiveRoute ? '' : metadata.contentId || '',
      search: isSensitiveRoute ? '' : metadata.search || '',
    },
  }
}
