import apiClient from './apiClient'
import { API_ENDPOINTS } from '../../utils/constants/api'

export const analyticsAPI = {
  // Get time-based utilization trends
  getTrends: async (params = {}) => {
    return apiClient.get(API_ENDPOINTS.ANALYTICS_TRENDS, { params })
  },

  // Get top performing MPs
  getTopPerformers: async (params = {}) => {
    return apiClient.get(API_ENDPOINTS.ANALYTICS_TOP_PERFORMERS, { params })
  },

  // Get performance distribution analysis
  getPerformanceDistribution: async (params = {}) => {
    return apiClient.get(API_ENDPOINTS.ANALYTICS_PERFORMANCE_DISTRIBUTION, { params })
  },
}
