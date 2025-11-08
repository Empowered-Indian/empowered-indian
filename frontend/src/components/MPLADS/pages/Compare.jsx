import { useState, useRef } from 'react'
import {
  FiPlus,
  FiX,
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi'
import { useMPSummary, usePerformanceDistribution } from '../../../hooks/useApi'
import { useResponsive } from '../../../hooks/useMediaQuery'
import { sanitizeInput } from '../../../utils/inputSanitization'
import SearchBar from '../components/Search/SearchBar'
import ComparisonBarChart from '../components/Charts/ComparisonBarChart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import './Compare.css'

const Compare = () => {
  const [selectedMPs, setSelectedMPs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showMPSelector, setShowMPSelector] = useState(false)
  const [currentComparisonIndex, setCurrentComparisonIndex] = useState(0)

  // Responsive hook
  const { isMobile } = useResponsive()

  // Refs for touch handling
  const comparisonContainerRef = useRef(null)
  const resultsRef = useRef(null)

  // Fetch MP data for search - always show results
  const { data: searchResults } = useMPSummary({
    search: searchQuery,
    limit: 50,
  })

  // Selected MPs already contain all needed data from the search results
  // No need to fetch additional details as useMPSummary provides full data

  // Fetch performance distribution for benchmarking
  const { data: performanceData } = usePerformanceDistribution()

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const getUtilizationColor = percentage => {
    if (percentage >= 70) return '#22c55e'
    if (percentage >= 40) return '#f59e0b'
    return '#ef4444'
  }

  // Create unique identifier for MP
  const getMPUniqueId = mp => `${mp.mpName}-${mp.constituency}-${mp.state}`

  const addMPToComparison = mp => {
    // Check if MP is already selected using unique identifier
    const mpId = getMPUniqueId(mp)
    const isAlreadySelected = selectedMPs.some(selected => getMPUniqueId(selected) === mpId)

    // Check if we can add more MPs
    const canAddMore = selectedMPs.length < 4

    // Only add if not already selected and we can add more
    if (!isAlreadySelected && canAddMore) {
      setSelectedMPs(prev => [...prev, mp])
    }
  }

  const removeMPFromComparison = mpToRemove => {
    const mpId = getMPUniqueId(mpToRemove)
    setSelectedMPs(selectedMPs.filter(mp => getMPUniqueId(mp) !== mpId))
  }

  const clearAllSelections = () => {
    setSelectedMPs([])
    setCurrentComparisonIndex(0)
  }

  const handleCompare = () => {
    setShowMPSelector(false)
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
  }

  const openMPSelector = () => {
    setShowMPSelector(true)
  }

  const closeMPSelector = () => {
    setShowMPSelector(false)
    setSearchQuery('') // Reset search when closing
  }

  const getAverageUtilization = () => {
    if (selectedMPs.length === 0) return 0
    const total = selectedMPs.reduce((sum, mp) => sum + (mp.utilizationPercentage || 0), 0)
    return total / selectedMPs.length
  }

  const getNationalAverage = () => {
    return performanceData?.data?.averageUtilization || 75 // Fallback
  }

  // Mobile navigation functions
  const navigateComparison = direction => {
    if (direction === 'prev' && currentComparisonIndex > 0) {
      setCurrentComparisonIndex(currentComparisonIndex - 1)
    } else if (direction === 'next' && currentComparisonIndex < selectedMPs.length - 1) {
      setCurrentComparisonIndex(currentComparisonIndex + 1)
    }
  }

  // Touch handling for mobile swipe
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const handleTouchStart = e => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = e => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (distance > minSwipeDistance) {
      // Swiped left - go to next
      navigateComparison('next')
    } else if (distance < -minSwipeDistance) {
      // Swiped right - go to previous
      navigateComparison('prev')
    }
  }

  return (
    <div className="compare-page">
      <div className="compare-header">
        <h1>Compare Constituencies</h1>
        <p>Compare performance and fund utilization across different constituencies and MPs</p>
      </div>

      <div className="comparison-controls">
        <div className="mp-selector">
          <h3>
            {isMobile ? `Compare MPs (${selectedMPs.length}/4)` : 'Select MPs to Compare (Max 4)'}
          </h3>
          <div className="two-step-header" aria-label="Comparison selection steps">
            <div className={`step ${selectedMPs.length === 0 ? 'active' : 'complete'}`}>
              <span className="step-index">1</span>
              <span className="step-text">Select first MP/Constituency</span>
            </div>
            <div
              className={`step ${selectedMPs.length >= 2 ? 'complete' : selectedMPs.length === 1 ? 'active' : ''}`}
            >
              <span className="step-index">2</span>
              <span className="step-text">Select second to compare</span>
            </div>
          </div>

          {selectedMPs.length > 0 && (
            <div className="selection-summary">
              <div className="selected-chips" role="list" aria-label="Selected MPs">
                {selectedMPs.map(mp => (
                  <div key={getMPUniqueId(mp)} className="chip" role="listitem">
                    <span className="chip-text">
                      {mp.mpName} · {mp.constituency}
                    </span>
                    <Button
                      variant="ghost"
                      className="chip-remove gap-2"
                      onClick={() => removeMPFromComparison(mp)}
                      aria-label={`Remove ${mp.mpName}`}
                    >
                      <FiX />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="selection-actions">
                <Button
                  variant="default"
                  className="compare-cta bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleCompare}
                  disabled={selectedMPs.length < 2}
                  aria-disabled={selectedMPs.length < 2}
                >
                  Compare
                </Button>
                <Button
                  variant="outline"
                  className="clear-selection"
                  onClick={clearAllSelections}
                  disabled={selectedMPs.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {isMobile && selectedMPs.length > 0 ? (
            /* Mobile MP Carousel */
            <div className="mobile-mp-carousel">
              <div className="carousel-header">
                <Button
                  variant="ghost"
                  className="carousel-nav-btn gap-2"
                  onClick={() => navigateComparison('prev')}
                  disabled={currentComparisonIndex === 0}
                  aria-label="Previous MP"
                >
                  <FiChevronLeft />
                </Button>

                <div className="carousel-indicator">
                  <span className="current-mp">{currentComparisonIndex + 1}</span>
                  <span className="separator">of</span>
                  <span className="total-mps">{selectedMPs.length}</span>
                </div>

                <Button
                  variant="ghost"
                  className="carousel-nav-btn gap-2"
                  onClick={() => navigateComparison('next')}
                  disabled={currentComparisonIndex === selectedMPs.length - 1}
                  aria-label="Next MP"
                >
                  <FiChevronRight />
                </Button>
              </div>

              <div
                className="mobile-mp-container"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                ref={comparisonContainerRef}
              >
                {selectedMPs.length > 0 && (
                  <div className="mobile-selected-mp-card">
                    <div className="mp-info">
                      <div className="mp-name">{selectedMPs[currentComparisonIndex]?.mpName}</div>
                      <div className="mp-constituency">
                        {selectedMPs[currentComparisonIndex]?.constituency},{' '}
                        {selectedMPs[currentComparisonIndex]?.state}
                      </div>
                      <div className="mp-party">
                        {selectedMPs[currentComparisonIndex]?.party} •{' '}
                        {selectedMPs[currentComparisonIndex]?.house}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="remove-mp gap-2"
                      onClick={() => removeMPFromComparison(selectedMPs[currentComparisonIndex])}
                      aria-label={`Remove ${selectedMPs[currentComparisonIndex]?.mpName}`}
                    >
                      <FiX />
                    </Button>
                  </div>
                )}
              </div>

              <div className="carousel-dots">
                {selectedMPs.map((_, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`dot ${index === currentComparisonIndex ? 'active' : ''}`}
                    onClick={() => setCurrentComparisonIndex(index)}
                    aria-label={`View MP ${index + 1}`}
                  />
                ))}
              </div>

              {selectedMPs.length > 1 && (
                <div className="swipe-hint">
                  <small>Swipe left or right to view other MPs</small>
                </div>
              )}
            </div>
          ) : (
            /* Desktop MP Cards */
            <div className="selected-mps">
              {selectedMPs.map(mp => (
                <div key={getMPUniqueId(mp)} className="selected-mp-card">
                  <div className="mp-info">
                    <div className="mp-name">{mp.mpName}</div>
                    <div className="mp-constituency">
                      {mp.constituency}, {mp.state}
                    </div>
                    <div className="mp-party">{mp.house}</div>
                  </div>
                  <Button
                    variant="ghost"
                    className="remove-mp gap-2"
                    onClick={() => removeMPFromComparison(mp)}
                    aria-label={`Remove ${mp.mpName}`}
                  >
                    <FiX />
                  </Button>
                </div>
              ))}

              {selectedMPs.length < 4 && (
                <Button variant="outline" className="add-mp-button gap-2" onClick={openMPSelector}>
                  <FiPlus />
                  <span>Add MP</span>
                </Button>
              )}
            </div>
          )}

          {/* Mobile Add MP Button */}
          {isMobile && selectedMPs.length < 4 && (
            <Button
              variant="outline"
              className="mobile-add-mp-button gap-2"
              onClick={openMPSelector}
            >
              <FiPlus />
              <span>Add {selectedMPs.length === 0 ? 'First' : 'Another'} MP</span>
            </Button>
          )}
        </div>

        {showMPSelector && (
          <div className="mp-selector-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Search and Select MP</h3>
                <Button
                  variant="ghost"
                  className="close-modal gap-2"
                  onClick={closeMPSelector}
                  aria-label="Close modal"
                >
                  <FiX />
                </Button>
              </div>

              <div className="search-container">
                <div className="two-step-inline">
                  <span
                    className={`inline-step ${selectedMPs.length === 0 ? 'active' : 'complete'}`}
                  >
                    Step 1
                  </span>
                  <span
                    className={`inline-step ${selectedMPs.length >= 2 ? 'complete' : selectedMPs.length === 1 ? 'active' : ''}`}
                  >
                    Step 2
                  </span>
                  <span className="inline-hint">
                    {selectedMPs.length === 0 && 'Select your first MP to compare'}
                    {selectedMPs.length === 1 && 'Select one more to compare'}
                    {selectedMPs.length >= 2 && 'You can add more or start comparing'}
                  </span>
                </div>
                <Input
                  type="text"
                  placeholder="Search by MP name, constituency, or state..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(sanitizeInput(e.target.value))}
                  className="search-input"
                />
                {selectedMPs.length > 0 && (
                  <div className="selected-chips modal-chips">
                    {selectedMPs.map(mp => (
                      <div key={getMPUniqueId(mp)} className="chip">
                        <span className="chip-text">
                          {mp.mpName} · {mp.constituency}
                        </span>
                        <Button
                          variant="ghost"
                          className="chip-remove gap-2"
                          onClick={() => removeMPFromComparison(mp)}
                          aria-label={`Remove ${mp.mpName}`}
                        >
                          <FiX />
                        </Button>
                      </div>
                    ))}
                    <div className="modal-actions">
                      <Button
                        variant="default"
                        className="compare-cta bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handleCompare}
                        disabled={selectedMPs.length < 2}
                        aria-disabled={selectedMPs.length < 2}
                      >
                        Compare
                      </Button>
                      <Button
                        variant="outline"
                        className="clear-selection"
                        onClick={clearAllSelections}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="search-results">
                {searchResults?.data?.map((mp, index) => {
                  const mpId = getMPUniqueId(mp)
                  const isAlreadySelected = selectedMPs.some(
                    selected => getMPUniqueId(selected) === mpId
                  )
                  const canSelect = !isAlreadySelected && selectedMPs.length < 4

                  return (
                    <div
                      key={`${mpId}-${index}`}
                      className={`mp-search-result ${
                        isAlreadySelected
                          ? 'already-selected'
                          : canSelect
                            ? 'selectable'
                            : 'disabled'
                      }`}
                      onClick={() => addMPToComparison(mp)}
                    >
                      <div className="mp-basic-info">
                        <div className="mp-name">{mp.mpName}</div>
                        <div className="mp-details">
                          <FiMapPin /> {mp.constituency}, {mp.state}
                        </div>
                        <div className="mp-party">{mp.house}</div>
                      </div>
                      <div className="mp-quick-stats">
                        <div className="utilization">
                          {mp.utilizationPercentage?.toFixed(1) || 0}% utilization
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedMPs.length > 0 && (
        <div className="comparison-results">
          <div className="comparison-summary">
            <div className="summary-cards">
              <Card className="summary-card">
                <div className="card-icon">
                  <FiUsers />
                </div>
                <CardContent className="card-content">
                  <div className="card-title">MPs Selected</div>
                  <div className="card-value">{selectedMPs.length}</div>
                </CardContent>
              </Card>

              <Card className="summary-card">
                <div className="card-icon">
                  <FiTrendingUp />
                </div>
                <CardContent className="card-content">
                  <div className="card-title">Average Utilization</div>
                  <div className="card-value">{getAverageUtilization().toFixed(1)}%</div>
                </CardContent>
              </Card>

              <Card className="summary-card">
                <div className="card-icon">
                  <FiBarChart2 />
                </div>
                <CardContent className="card-content">
                  <div className="card-title">vs National Average</div>
                  <div
                    className={`card-value ${
                      getAverageUtilization() > getNationalAverage() ? 'positive' : 'negative'
                    }`}
                  >
                    {(getAverageUtilization() - getNationalAverage()).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="comparison-charts" ref={resultsRef}>
            {isMobile ? (
              /* Mobile Comparison Cards */
              <div className="mobile-comparison-section">
                <div className="comparison-chart-mobile">
                  <h3>Fund Utilization Comparison</h3>
                  <ComparisonBarChart
                    data={{
                      categories: selectedMPs.map(mp => `${mp.mpName}\n${mp.constituency}`),
                      series: [
                        {
                          name: 'Fund Utilization %',
                          data: selectedMPs.map(mp => mp.utilizationPercentage || 0),
                        },
                        {
                          name: 'National Average',
                          data: selectedMPs.map(() => getNationalAverage()),
                        },
                      ],
                    }}
                  />
                </div>

                <div className="mobile-comparison-cards">
                  <h3>Detailed Comparison</h3>
                  {selectedMPs.map(mp => (
                    <div key={getMPUniqueId(mp)} className="mobile-mp-comparison-card">
                      <div className="comparison-card-header">
                        <div className="mp-info">
                          <h4>{mp.mpName}</h4>
                          <p>{mp.constituency}</p>
                        </div>
                        <div className="utilization-display">
                          <span
                            className="large-utilization-badge"
                            style={{
                              backgroundColor: getUtilizationColor(mp.utilizationPercentage),
                              color: 'white',
                            }}
                          >
                            {mp.utilizationPercentage?.toFixed(1) || 0}%
                          </span>
                        </div>
                      </div>

                      <div className="comparison-metrics">
                        <div className="metric-row">
                          <div className="metric-item">
                            <span className="metric-label">Allocated</span>
                            <span className="metric-value">
                              {formatCurrency(mp.allocatedAmount)}
                            </span>
                          </div>
                          <div className="metric-item">
                            <span className="metric-label">Utilized</span>
                            <span className="metric-value">
                              {formatCurrency(mp.totalExpenditure)}
                            </span>
                          </div>
                        </div>

                        <div className="metric-row">
                          <div className="metric-item">
                            <span className="metric-label">Works Completed</span>
                            <span className="metric-value">{mp.completedWorksCount || 0}</span>
                          </div>
                          <div className="metric-item">
                            <span className="metric-label">Completion Rate</span>
                            <span className="metric-value">
                              {mp.recommendedWorksCount > 0
                                ? (
                                    (mp.completedWorksCount / mp.recommendedWorksCount) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Desktop Charts and Table */
              <>
                <div className="chart-section">
                  <h3>Fund Utilization Comparison</h3>
                  <ComparisonBarChart
                    data={{
                      categories: selectedMPs.map(mp => `${mp.mpName}\n${mp.constituency}`),
                      series: [
                        {
                          name: 'Fund Utilization %',
                          data: selectedMPs.map(mp => mp.utilizationPercentage || 0),
                        },
                        {
                          name: 'National Average',
                          data: selectedMPs.map(() => getNationalAverage()),
                        },
                      ],
                    }}
                  />
                </div>

                <div className="comparison-table">
                  <h3>Detailed Comparison</h3>
                  <div className="table-container">
                    <table className="comparison-data-table">
                      <thead>
                        <tr>
                          <th>MP / Constituency</th>
                          <th>Allocated Amount</th>
                          <th>Utilized Amount</th>
                          <th>Utilization %</th>
                          <th>Completed Works</th>
                          <th>Recommended Works</th>
                          <th>Completion Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMPs.map(mp => (
                          <tr key={getMPUniqueId(mp)}>
                            <td>
                              <div className="mp-cell">
                                <div className="mp-name">{mp.mpName}</div>
                                <div className="mp-constituency">{mp.constituency}</div>
                              </div>
                            </td>
                            <td>{formatCurrency(mp.allocatedAmount)}</td>
                            <td>{formatCurrency(mp.totalExpenditure)}</td>
                            <td>
                              <span
                                className="utilization-badge"
                                style={{
                                  backgroundColor: getUtilizationColor(mp.utilizationPercentage),
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                }}
                              >
                                {mp.utilizationPercentage?.toFixed(1) || 0}%
                              </span>
                            </td>
                            <td>{mp.completedWorksCount || 0}</td>
                            <td>{mp.recommendedWorksCount || 0}</td>
                            <td>
                              {mp.recommendedWorksCount > 0
                                ? (
                                    (mp.completedWorksCount / mp.recommendedWorksCount) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="comparison-insights">
            <h3>Key Insights</h3>
            <div className="insights-grid">
              <Card className="insight-card">
                <CardHeader>
                  <CardTitle>Highest Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const highest = selectedMPs.reduce((max, mp) =>
                      (mp.utilizationPercentage || 0) > (max.utilizationPercentage || 0) ? mp : max
                    )
                    return (
                      <div>
                        <div className="insight-mp">{highest.mpName}</div>
                        <div className="insight-value">
                          {highest.utilizationPercentage?.toFixed(1) || 0}%
                        </div>
                        <div className="insight-context">Highest fund utilization rate</div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              <Card className="insight-card">
                <CardHeader>
                  <CardTitle>Most Works Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const mostWorks = selectedMPs.reduce((max, mp) =>
                      (mp.completedWorksCount || 0) > (max.completedWorksCount || 0) ? mp : max
                    )
                    return (
                      <div>
                        <div className="insight-mp">{mostWorks.mpName}</div>
                        <div className="insight-value">
                          {mostWorks.completedWorksCount || 0} works
                        </div>
                        <div className="insight-context">
                          Highest number of development projects delivered
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              <Card className="insight-card">
                <CardHeader>
                  <CardTitle>Above National Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="insight-value">
                    {
                      selectedMPs.filter(
                        mp => (mp.utilizationPercentage || 0) > getNationalAverage()
                      ).length
                    }{' '}
                    of {selectedMPs.length}
                  </div>
                  <div className="insight-context">
                    MPs performing better than national average ({getNationalAverage()}%)
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {selectedMPs.length === 0 && (
        <div className="empty-comparison">
          <div className="empty-content">
            <FiBarChart2 size={48} />
            <h3>Start Comparing</h3>
            <p>
              Select MPs from the search above to compare their performance and fund utilization
            </p>
            <Button
              variant="default"
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={openMPSelector}
            >
              <FiPlus />
              Add First MP
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Compare
