const getApiBaseUrl = () => {
  const environment = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development'

  if (environment === 'production') {
    return (
      import.meta.env.VITE_API_URL_PRODUCTION ||
      import.meta.env.VITE_API_URL ||
      'https://your-production-domain.com/api'
    )
  } else {
    return (
      import.meta.env.VITE_API_URL_DEVELOPMENT ||
      import.meta.env.VITE_API_URL ||
      'http://localhost:5001/api'
    )
  }
}

export const API_BASE_URL = getApiBaseUrl()

export const API_ENDPOINTS = {
  // Summary endpoints
  SUMMARY_OVERVIEW: '/summary/overview',
  SUMMARY_STATES: '/summary/states',
  SUMMARY_MPS: '/summary/mps',
  SUMMARY_CONSTITUENCIES: '/summary/constituencies',

  // MPLADS endpoints
  MPLADS_MP_DETAILS: '/mplads/mps',
  MPLADS_SEARCH: '/mplads/search',
  MPLADS_CONSTITUENCIES: '/mplads/constituencies',
  MPLADS_SECTORS: '/mplads/sectors',
  MPLADS_TRENDS: '/mplads/trends',
  MPLADS_TERMS: '/mplads/terms',

  // Works endpoints
  WORKS_COMPLETED: '/works/completed',
  WORKS_RECOMMENDED: '/works/recommended',
  WORKS_CATEGORIES: '/works/categories',
  WORKS_CONSTITUENCIES: '/works/constituencies',

  // Analytics endpoints
  ANALYTICS_TRENDS: '/analytics/trends',
  ANALYTICS_TOP_PERFORMERS: '/analytics/top-performers',
  ANALYTICS_PERFORMANCE_DISTRIBUTION: '/analytics/performance-distribution',

  // Expenditure endpoints
  EXPENDITURES: '/expenditures',
  EXPENDITURE_CATEGORIES: '/expenditures/categories',
}

export const CACHE_TIMES = {
  SUMMARY: 24 * 60 * 60 * 1000, // 24 hours
  ANALYTICS: 24 * 60 * 60 * 1000, // 24 hours
  EXPENDITURE: 6 * 60 * 60 * 1000, // 6 hours
  WORKS: 12 * 60 * 60 * 1000, // 12 hours
  MP_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
}
