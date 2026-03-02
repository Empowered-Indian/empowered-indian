import apiClient from './apiClient'
import { API_ENDPOINTS } from '../../utils/constants/api'

export const worksAPI = {
  // Get completed works with filters
  getCompletedWorks: async (params = {}) => {
    const {
      page = 1,
      limit = 20,
      house,
      ls_term,
      mp_id,
      state,
      constituency,
      district,
      category,
      year,
      min_cost,
      max_cost,
      sort,
      search,
    } = params

    // Filter out empty string values
    const cleanParams = {
      page,
      limit,
      ...(house && { house }),
      ...(ls_term !== undefined && { ls_term }),
      ...(mp_id && { mp_id }),
      ...(state && { state }),
      ...(constituency && { constituency }),
      ...(district && { district }),
      ...(category && { category }),
      ...(year && { year }),
      ...(min_cost !== undefined && min_cost !== '' && { min_cost }),
      ...(max_cost !== undefined && max_cost !== '' && { max_cost }),
      ...(sort && { sort }),
      ...(search && { search }),
    }

    return apiClient.get(API_ENDPOINTS.WORKS_COMPLETED, {
      params: cleanParams,
    })
  },

  // Get recommended works with filters
  getRecommendedWorks: async (params = {}) => {
    const {
      page = 1,
      limit = 20,
      house,
      ls_term,
      mp_id,
      state,
      constituency,
      district,
      category,
      year,
      status,
      min_cost,
      max_cost,
      sort,
      search,
      has_payments,
    } = params

    // Filter out empty string values
    const cleanParams = {
      page,
      limit,
      ...(house && { house }),
      ...(ls_term !== undefined && { ls_term }),
      ...(mp_id && { mp_id }),
      ...(state && { state }),
      ...(constituency && { constituency }),
      ...(district && { district }),
      ...(category && { category }),
      ...(year && { year }),
      ...(status && { status }),
      ...(min_cost !== undefined && min_cost !== '' && { min_cost }),
      ...(max_cost !== undefined && max_cost !== '' && { max_cost }),
      ...(sort && { sort }),
      ...(search && { search }),
      ...(has_payments !== undefined && has_payments !== '' && { has_payments }),
    }

    return apiClient.get(API_ENDPOINTS.WORKS_RECOMMENDED, {
      params: cleanParams,
    })
  },

  // Get work categories
  getWorkCategories: async () => {
    return apiClient.get(API_ENDPOINTS.WORKS_CATEGORIES)
  },

  // Get constituencies
  getConstituencies: async (params = {}) => {
    const { state } = params
    return apiClient.get(API_ENDPOINTS.WORKS_CONSTITUENCIES, {
      params: { state },
    })
  },

  // Get payment details for a specific work
  getWorkPayments: async workId => {
    return apiClient.get(`/works/${workId}/payments`)
  },

  // Get payment details for a specific recommendation
  getRecommendationPayments: async recommendationId => {
    return apiClient.get(`/works/recommendations/${recommendationId}/payments`)
  },
}
