import { FiX, FiFilter, FiRotateCcw } from 'react-icons/fi'
import { useFilters } from '../../../../contexts/FilterContext'
import { Button } from '@/components/ui/button'
import './ActiveFilters.css'

const ActiveFilters = ({ className = '' }) => {
  const { filters, updateFilter, resetFilters, getActiveFilterCount } = useFilters()

  const activeFilterCount = getActiveFilterCount()

  if (activeFilterCount === 0) {
    return null
  }

  const getFilterDisplayValue = (key, value) => {
    if (!value || value === '' || value === 0) return null

    // Skip default values that shouldn't be shown as active
    if (key === 'minUtilization' && value === 0) return null
    if (key === 'maxUtilization' && value === 100) return null
    if (key === 'minAmount' && value === 0) return null
    if (key === 'maxAmount' && value === 0) return null

    const labels = {
      searchQuery: 'Search',
      state: 'State',
      constituency: 'Constituency',
      house: 'House',
      minUtilization: 'Min Utilization',
      maxUtilization: 'Max Utilization',
      minAmount: 'Min Amount',
      maxAmount: 'Max Amount',
      workStatus: 'Status',
      sector: 'Sector',
      yearFrom: 'From Year',
      yearTo: 'To Year',
    }

    const formatValue = (key, value) => {
      if (key.includes('Utilization')) return `${value}%`
      if (key.includes('Amount')) return `₹${value} Cr`
      if (key === 'workStatus')
        return value.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
      return value
    }

    return {
      key,
      label: labels[key] || key,
      value: formatValue(key, value),
      displayValue: `${labels[key] || key}: ${formatValue(key, value)}`,
    }
  }

  const activeFilters = Object.entries(filters)
    .map(([key, value]) => getFilterDisplayValue(key, value))
    .filter(Boolean)
    .filter(filter => !['sortBy', 'sortOrder', 'searchType'].includes(filter.key))

  const removeFilter = key => {
    // Reset to default values based on filter type
    if (key === 'minUtilization') {
      updateFilter(key, 0)
    } else if (key === 'maxUtilization') {
      updateFilter(key, 100)
    } else if (key === 'minAmount' || key === 'maxAmount') {
      updateFilter(key, 0)
    } else {
      updateFilter(key, '')
    }
  }

  return (
    <div className={`active-filters ${className}`}>
      <div className="active-filters-header">
        <div className="active-filters-title">
          <FiFilter />
          <span>Active Filters</span>
          <span className="active-filters-count">{activeFilterCount}</span>
        </div>
        <Button
          variant="outline"
          className="clear-all-filters-btn gap-2"
          onClick={resetFilters}
          title="Clear all filters"
          aria-label="Clear all filters"
        >
          <FiRotateCcw />
          <span>Clear All</span>
        </Button>
      </div>

      <div className="active-filters-list">
        {activeFilters.map(filter => (
          <div key={filter.key} className="active-filter-tag">
            <span className="filter-label">{filter.label}</span>
            <span className="filter-value">{filter.value}</span>
            <Button
              variant="ghost"
              className="remove-filter-btn"
              onClick={() => removeFilter(filter.key)}
              title={`Remove ${filter.label} filter`}
              aria-label={`Remove ${filter.label} filter`}
            >
              <FiX />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ActiveFilters
