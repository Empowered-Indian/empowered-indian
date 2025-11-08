import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const FilterContext = createContext()

const defaultFilters = {
  // Search filters
  searchQuery: '',
  searchType: 'all', // all, mp, constituency, project

  // Location filters
  state: '',
  district: '',
  constituency: '',

  // MP filters
  party: '',
  house: 'Both Houses', // Lok Sabha, Rajya Sabha, Both Houses
  lsTerm: 18, // 17 or 18; default 18 for LS

  // Financial filters
  minUtilization: 0,
  maxUtilization: 100,
  minAmount: 0,
  maxAmount: 0,

  // Work filters
  workStatus: '', // recommended, sanctioned, in-progress, completed
  workCategory: '',
  sector: '',

  // Date filters
  yearFrom: '',
  yearTo: '',

  // Sorting
  sortBy: 'utilizationPercentage',
  sortOrder: 'desc',
}

const normalizeRange = (minVal, maxVal, { minDefault, maxDefault, allowEqual = true } = {}) => {
  const hasMin = minVal !== undefined && minVal !== null && minVal !== ''
  const hasMax = maxVal !== undefined && maxVal !== null && maxVal !== ''
  let min = hasMin ? Number(minVal) : (minDefault ?? undefined)
  let max = hasMax ? Number(maxVal) : (maxDefault ?? undefined)
  if (Number.isNaN(min)) min = minDefault
  if (Number.isNaN(max)) max = maxDefault
  if (min !== undefined && max !== undefined) {
    if ((allowEqual && min > max) || (!allowEqual && min >= max)) {
      // Swap to a valid range rather than invalidating
      const t = min
      min = max
      max = t
    }
  }
  return { min, max }
}

const STORAGE_KEY = 'mplads_filters'

// eslint-disable-next-line react-refresh/only-export-components
export const useFilters = () => {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}

export const FilterProvider = ({ children }) => {
  // Initialize from localStorage synchronously to avoid read/write races
  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return { ...defaultFilters, ...(saved ? JSON.parse(saved) : {}) }
    } catch (e) {
      console.error('Failed to parse saved filters:', e)
      return { ...defaultFilters }
    }
  })

  // Save filters to localStorage when they change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
      } catch (e) {
        console.error('Failed to save filters to localStorage:', e)
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [filters])

  // Cross-tab synchronization: listen for storage updates
  useEffect(() => {
    const onStorage = e => {
      if (e.key !== STORAGE_KEY) return
      try {
        const incoming = e.newValue ? JSON.parse(e.newValue) : null
        if (incoming && typeof incoming === 'object') {
          // Merge with defaults to avoid missing keys
          setFilters(prev => ({ ...defaultFilters, ...prev, ...incoming }))
        }
      } catch (err) {
        console.error('Failed to sync filters from storage:', err)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Enforce invariants: when viewing Both Houses, lock lsTerm to 18
  // Users can change term when house is specifically Lok Sabha
  useEffect(() => {
    if (filters.house === 'Both Houses' && Number(filters.lsTerm) !== 18) {
      setFilters(prev => ({ ...prev, lsTerm: 18 }))
    }
  }, [filters.house, filters.lsTerm])

  const updateFilter = useCallback((key, value) => {
    if (value === undefined) return
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateMultipleFilters = useCallback(updates => {
    if (!updates || typeof updates !== 'object') return
    const sanitized = { ...updates }
    // Remove undefineds to avoid clobbering
    Object.keys(sanitized).forEach(k => {
      if (sanitized[k] === undefined) delete sanitized[k]
    })
    // Normalize ranges if provided
    if ('minAmount' in sanitized || 'maxAmount' in sanitized) {
      const { min, max } = normalizeRange(
        sanitized.minAmount ?? filters.minAmount,
        sanitized.maxAmount ?? filters.maxAmount,
        { minDefault: 0, maxDefault: 0, allowEqual: true }
      )
      sanitized.minAmount = min ?? 0
      sanitized.maxAmount = max ?? 0
    }
    if ('minUtilization' in sanitized || 'maxUtilization' in sanitized) {
      const { min, max } = normalizeRange(
        sanitized.minUtilization ?? filters.minUtilization,
        sanitized.maxUtilization ?? filters.maxUtilization,
        { minDefault: 0, maxDefault: 100, allowEqual: true }
      )
      sanitized.minUtilization = min ?? 0
      sanitized.maxUtilization = max ?? 100
    }
    setFilters(prev => ({
      ...prev,
      ...sanitized,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({ ...defaultFilters })
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const getActiveFilterCount = useCallback(() => {
    const skipKeys = ['sortBy', 'sortOrder', 'searchType', 'lsTerm']
    return Object.entries(filters).filter(([key, value]) => {
      if (skipKeys.includes(key)) return false
      if (key === 'minUtilization' && value === 0) return false
      if (key === 'maxUtilization' && value === 100) return false
      if (key === 'minAmount' && value === 0) return false
      if (key === 'maxAmount' && value === 0) return false
      return value !== '' && value !== null && value !== undefined
    }).length
  }, [filters])

  const getApiParams = useCallback(() => {
    const params = {}

    // Add non-empty filters to params
    if (filters.searchQuery) params.search = filters.searchQuery
    if (filters.state) params.state = filters.state
    if (filters.district) params.district = filters.district
    if (filters.constituency) params.constituency = filters.constituency
    if (filters.house) params.house = filters.house
    // Always pass ls_term (backend defaults to 18 for LS if omitted, but we keep explicit)
    if (filters.lsTerm) params.ls_term = Number(filters.lsTerm)
    if (filters.workStatus) params.status = filters.workStatus
    if (filters.workCategory) params.category = filters.workCategory
    if (filters.sector) params.sector = filters.sector
    if (filters.yearFrom) params.year_from = filters.yearFrom
    if (filters.yearTo) params.year_to = filters.yearTo

    // Normalize and add numeric filters (range filtering)
    const util = normalizeRange(filters.minUtilization, filters.maxUtilization, {
      minDefault: 0,
      maxDefault: 100,
    })
    if (typeof util.min === 'number' && util.min > 0) params.min_utilization = util.min
    if (typeof util.max === 'number' && util.max < 100) params.max_utilization = util.max

    const amt = normalizeRange(filters.minAmount, filters.maxAmount, {
      minDefault: 0,
      maxDefault: 0,
    })
    if (typeof amt.min === 'number' && amt.min > 0) params.min_amount = amt.min
    if (typeof amt.max === 'number' && amt.max > 0) params.max_amount = amt.max

    // Add sorting
    if (filters.sortBy) {
      params.sort = filters.sortOrder === 'desc' ? `-${filters.sortBy}` : filters.sortBy
    }

    return params
  }, [filters])

  const value = useMemo(
    () => ({
      filters,
      updateFilter,
      updateMultipleFilters,
      resetFilters,
      getActiveFilterCount,
      getApiParams,
    }),
    [filters, updateFilter, updateMultipleFilters, resetFilters, getActiveFilterCount, getApiParams]
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}
