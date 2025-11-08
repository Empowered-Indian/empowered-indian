import apiClient from './apiClient'
import { API_ENDPOINTS } from '../../utils/constants/api'

export const expendituresAPI = {
  // Get expenditures with filters
  getExpenditures: async (params = {}) => {
    const { page = 1, limit = 100, ...filters } = params
    return apiClient.get(API_ENDPOINTS.EXPENDITURES, {
      params: { page, limit, ...filters },
    })
  },

  // Get expenditure categories
  getExpenditureCategories: async () => {
    return apiClient.get(API_ENDPOINTS.EXPENDITURE_CATEGORIES)
  },
}
