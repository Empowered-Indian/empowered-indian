export { default as apiClient } from './apiClient'
export { summaryAPI } from './summary'
export { mpladsAPI } from './mplads'
export { worksAPI } from './works'
export { analyticsAPI } from './analytics'
export { expendituresAPI } from './expenditures'

import { summaryAPI } from './summary'
import { mpladsAPI } from './mplads'
import { worksAPI } from './works'
import { analyticsAPI } from './analytics'
import { expendituresAPI } from './expenditures'

// Re-export all APIs as a single object for convenience
export const api = {
  summary: summaryAPI,
  mplads: mpladsAPI,
  works: worksAPI,
  analytics: analyticsAPI,
  expenditures: expendituresAPI,
}
