import axios from 'axios'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../../utils/constants/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  config => {
    // You can add auth tokens here if needed
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    const message = error.response?.data?.error || error.message || 'Something went wrong'

    // Don't show toast for cancelled requests
    const skipToast = error.config?.skipErrorToast === true
    if (error.code !== 'ERR_CANCELED' && !skipToast) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
