import { useState, useEffect } from 'react'
import { AuthContext } from './AuthContextDef'
import { API_BASE_URL } from '../utils/constants/api'
import { apiRequest, cancelAllRequests } from '../utils/apiClient'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('authToken'))

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await apiRequest(`${API_BASE_URL}/auth/verify`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.data.user)
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken')
            setToken(null)
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('authToken')
          setToken(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [token])

  // Login function
  const login = async (email, password) => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        const { user, token } = data.data
        localStorage.setItem('authToken', token)
        setToken(token)
        setUser(user)
        return { success: true }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Login failed. Please try again.' }
    }
  }

  // Logout function
  const logout = () => {
    // Cancel in-flight requests to prevent stale token usage
    try {
      cancelAllRequests()
    } catch {
      /* no-op */
    }
    localStorage.removeItem('authToken')
    setToken(null)
    setUser(null)
  }

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin'
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!token
  }

  // Get auth headers for API requests
  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin,
    isAuthenticated,
    getAuthHeaders,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
