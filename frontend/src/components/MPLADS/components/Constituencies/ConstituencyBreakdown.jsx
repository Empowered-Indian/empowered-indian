import { useState, useMemo } from 'react'
import { FiMapPin, FiTrendingUp, FiDollarSign, FiCheckCircle, FiSearch } from 'react-icons/fi'
import { useConstituencySummary } from '../../../../hooks/useApi'
import ComparisonBarChart from '../Charts/ComparisonBarChart'
import './ConstituencyBreakdown.css'

const ConstituencyBreakdown = ({ stateName, constituencies = [] }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('utilization')
  const [exactMatch, setExactMatch] = useState(false)

  // Fetch real constituency data from API
  const {
    data: constituencyResponse,
    isLoading,
    error,
  } = useConstituencySummary({
    state: stateName,
    sortBy: sortBy === 'utilization' ? 'utilizationPercentage' : sortBy,
    limit: 50,
  })

  // Use real data from API or passed props
  const constituencyData = useMemo(() => {
    return constituencyResponse?.data || constituencies || []
  }, [constituencyResponse?.data, constituencies])

  // Filter constituencies based on search
  const filteredConstituencies = useMemo(() => {
    if (!searchQuery) return constituencyData

    const query = searchQuery.toLowerCase().trim()

    return constituencyData.filter(constituency => {
      const name = constituency.name.toLowerCase()

      if (exactMatch) {
        // Exact match mode - match the full name or the name without the suffix
        // This allows "Mathura" to match "MATHURA" but not "MATHURAPUR(SC)"
        const nameWithoutSuffix = name.replace(/\(.*\)$/, '').trim()
        return name === query || nameWithoutSuffix === query
      } else {
        // Partial match mode - original behavior
        return name.includes(query)
      }
    })
  }, [constituencyData, searchQuery, exactMatch])

  // Sort constituencies
  const sortedConstituencies = useMemo(() => {
    const sorted = [...filteredConstituencies]

    switch (sortBy) {
      case 'utilization':
        return sorted.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)
      case 'allocated':
        return sorted.sort((a, b) => b.totalAllocated - a.totalAllocated)
      case 'completed':
        return sorted.sort((a, b) => b.totalWorksCompleted - a.totalWorksCompleted)
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return sorted
    }
  }, [filteredConstituencies, sortBy])

  // Prepare data for chart
  const chartData = useMemo(() => {
    const topConstituencies = sortedConstituencies.slice(0, 10)
    return {
      categories: topConstituencies.map(c => c.name),
      series: [
        {
          name: 'Fund Utilization %',
          data: topConstituencies.map(c => c.utilizationPercentage),
        },
      ],
    }
  }, [sortedConstituencies])

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short',
    }).format(amount || 0)
  }

  const formatNumber = num => {
    return new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(num || 0)
  }

  const getUtilizationClass = percentage => {
    if (percentage >= 90) return 'high'
    if (percentage >= 70) return 'medium'
    return 'low'
  }

  if (isLoading) {
    return (
      <div className="constituency-breakdown">
        <div className="breakdown-header">
          <h3>Constituency-wise Analysis for {stateName}</h3>
          <p>Fund utilization and project implementation across constituencies</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading constituency data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="constituency-breakdown">
        <div className="breakdown-header">
          <h3>Constituency-wise Analysis for {stateName}</h3>
          <p>Fund utilization and project implementation across constituencies</p>
        </div>
        <div className="error-state">
          <p>Error loading constituency data: {error.message}</p>
          <p>Showing demo data for visualization purposes.</p>
        </div>
      </div>
    )
  }

  if (!constituencyData.length) {
    return (
      <div className="constituency-breakdown">
        <div className="breakdown-header">
          <h3>Constituency-wise Analysis for {stateName}</h3>
          <p>Fund utilization and project implementation across constituencies</p>
        </div>
        <div className="no-data-state">
          <p>No constituency data available for {stateName}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="constituency-breakdown">
      <div className="breakdown-header">
        <h3>Constituency-wise Analysis for {stateName}</h3>
        <p>Fund utilization and project implementation across constituencies</p>
      </div>

      <div className="constituency-controls">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search constituencies..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <label className="exact-match-toggle">
            <input
              type="checkbox"
              checked={exactMatch}
              onChange={e => setExactMatch(e.target.checked)}
            />
            <span>Exact match</span>
          </label>
        </div>
        <div className="sort-control">
          <label>Sort by:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="utilization">Utilization %</option>
            <option value="allocated">Funds Allocated</option>
            <option value="completed">Works Completed</option>
            <option value="name">Constituency Name</option>
          </select>
        </div>
      </div>

      <div className="constituency-chart">
        <h4>Top 10 Constituencies by Fund Utilization</h4>
        <ComparisonBarChart
          data={chartData}
          title=""
          xAxisLabel="Constituencies"
          yAxisLabel="Fund Utilization %"
        />
      </div>

      <div className="constituency-table">
        <h4>Constituency Details</h4>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Constituency</th>
                <th>MP Name</th>
                <th>House</th>
                <th>Allocated</th>
                <th>Utilized</th>
                <th>Utilization %</th>
                <th>Works Completed</th>
              </tr>
            </thead>
            <tbody>
              {sortedConstituencies.map(constituency => (
                <tr key={constituency.id || constituency.name}>
                  <td className="constituency-name">
                    <FiMapPin className="constituency-icon" />
                    {constituency.name}
                  </td>
                  <td>{constituency.mpName}</td>
                  <td>{constituency.house}</td>
                  <td>{formatCurrency(constituency.totalAllocated)}</td>
                  <td>{formatCurrency(constituency.totalExpenditure)}</td>
                  <td>
                    <span
                      className={`utilization-badge utilization-${getUtilizationClass(constituency.utilizationPercentage)}`}
                    >
                      {constituency.utilizationPercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td>{formatNumber(constituency.totalWorksCompleted)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ConstituencyBreakdown
