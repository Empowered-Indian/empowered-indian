import apiClient from './apiClient'
import { API_ENDPOINTS } from '../../utils/constants/api'

export const mpladsAPI = {
  // Get individual MP details
  getMPDetails: async (mpId, params = {}) => {
    return apiClient.get(`${API_ENDPOINTS.MPLADS_MP_DETAILS}/${mpId}`, { params })
  },

  // Get MP's works
  getMPWorks: async (mpId, params = {}) => {
    return apiClient.get(`${API_ENDPOINTS.MPLADS_MP_DETAILS}/${mpId}/works`, { params })
  },

  // Search MPs by name or constituency
  searchMPs: async (query, params = {}) => {
    return apiClient.get(API_ENDPOINTS.MPLADS_SEARCH, {
      params: { q: query, ...params },
    })
  },

  // Get constituency details
  getConstituencyDetails: async constituencyId => {
    return apiClient.get(`${API_ENDPOINTS.MPLADS_CONSTITUENCIES}/${constituencyId}`)
  },

  // Get sector-wise data
  getSectorWiseData: async (params = {}) => {
    return apiClient.get(API_ENDPOINTS.MPLADS_SECTORS, { params })
  },

  // Get year-wise trends
  getYearWiseTrends: async (params = {}) => {
    return apiClient.get(API_ENDPOINTS.MPLADS_TRENDS, { params })
  },

  // Get available Lok Sabha terms
  getTerms: async () => {
    return apiClient.get(API_ENDPOINTS.MPLADS_TERMS)
  },
}
