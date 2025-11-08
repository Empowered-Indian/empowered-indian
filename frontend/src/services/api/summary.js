import apiClient from './apiClient'
import { API_ENDPOINTS } from '../../utils/constants/api'

export const summaryAPI = {
  // Get overall dashboard overview
  getOverview: async (params = {}) => {
    return apiClient.get(API_ENDPOINTS.SUMMARY_OVERVIEW, { params })
  },

  // Get state-wise summary
  getStateSummary: async (params = {}) => {
    // Default to showing all states (India has ~37 states/UTs)
    const { limit = 50, ...otherParams } = params
    return apiClient.get(API_ENDPOINTS.SUMMARY_STATES, {
      params: { limit, ...otherParams },
    })
  },

  // Get MP-wise summary with pagination
  getMPSummary: async (params = {}) => {
    const { page = 1, limit = 20, ...filters } = params
    return apiClient.get(API_ENDPOINTS.SUMMARY_MPS, {
      params: { page, limit, ...filters },
    })
  },

  // Get constituency-wise summary for a state
  getConstituencySummary: async (params = {}) => {
    const { limit = 50, ...otherParams } = params
    return apiClient.get(API_ENDPOINTS.SUMMARY_CONSTITUENCIES, {
      params: { limit, ...otherParams },
    })
  },
}
