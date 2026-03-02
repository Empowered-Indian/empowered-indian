import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../utils/constants/api'

export const useFilterData = () => {
  const [filterData, setFilterData] = useState({
    states: [],
    houses: [],
    constituencies: [],
    workStatuses: ['Recommended', 'Sanctioned', 'In Progress', 'Completed'],
    sectors: ['Education', 'Health', 'Water & Sanitation', 'Roads', 'Others'],
  })

  const [loading, setLoading] = useState({
    states: false,
    houses: false,
    constituencies: false,
  })

  const [error, setError] = useState({
    states: null,
    houses: null,
    constituencies: null,
  })

  // Fetch all filter data at once
  const fetchFilterSummary = async () => {
    try {
      setLoading(prev => ({ ...prev, states: true, houses: true }))

      const response = await fetch(`${API_BASE_URL}/filters/summary`)

      if (!response.ok) {
        throw new Error(`Failed to fetch filter data: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.filters) {
        setFilterData(prev => ({
          ...prev,
          states: data.filters.states || [],
          houses: data.filters.houses || ['Lok Sabha', 'Rajya Sabha'],
          constituencies: data.filters.constituencies || [],
        }))

        setError(prev => ({
          ...prev,
          states: null,
          houses: null,
          constituencies: null,
        }))
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching filter summary:', err)

      // Set fallback data on error
      setFilterData(prev => ({
        ...prev,
        states: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat'], // Fallback
        houses: ['Lok Sabha', 'Rajya Sabha'],
      }))

      setError(prev => ({
        ...prev,
        states: err.message,
        houses: err.message,
        constituencies: err.message,
      }))
    } finally {
      setLoading(prev => ({
        ...prev,
        states: false,
        houses: false,
        constituencies: false,
      }))
    }
  }

  // Fetch constituencies by state
  const fetchConstituencies = async state => {
    if (!state || state === 'all') {
      return filterData.constituencies
    }

    try {
      setLoading(prev => ({ ...prev, constituencies: true }))

      const response = await fetch(
        `${API_BASE_URL}/filters/constituencies?state=${encodeURIComponent(state)}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch constituencies: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const constituencies = data.constituencies || []

        // Update constituencies in state
        setFilterData(prev => ({
          ...prev,
          constituencies: constituencies,
        }))

        setError(prev => ({ ...prev, constituencies: null }))
        return constituencies
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching constituencies:', err)
      setError(prev => ({ ...prev, constituencies: err.message }))
      return []
    } finally {
      setLoading(prev => ({ ...prev, constituencies: false }))
    }
  }

  // Fetch filter counts
  const fetchFilterCounts = async filters => {
    try {
      const queryParams = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(`${API_BASE_URL}/filters/counts?${queryParams}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch filter counts: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        return data.count || 0
      }

      return 0
    } catch (err) {
      console.error('Error fetching filter counts:', err)
      return 0
    }
  }

  // Initialize filter data on component mount
  useEffect(() => {
    fetchFilterSummary()
  }, [])

  return {
    filterData,
    loading,
    error,
    fetchConstituencies,
    fetchFilterCounts,
    refreshFilterData: fetchFilterSummary,
  }
}
