import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
// Replace react-icons with Lucide for a more elegant look
import { ArrowLeft, Users, IndianRupee, TrendingUp, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useMPSummary, useStateSummary } from '../../../hooks/useApi';
import FundUtilizationGauge from '../components/Charts/FundUtilizationGauge';
import MPPersonalityDistribution from '../components/Charts/MPPersonalityDistribution';
import ProjectListing from '../components/Projects/ProjectListing';
import './StateDetail.css';
import { formatINRCompact } from '../../../utils/formatters';
import { buildMPSlugHuman, normalizeMPSlug } from '../../../utils/slug';
import { useFilters } from '../../../contexts/FilterContext';

const StateDetail = () => {
  const { stateId } = useParams();
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCards, setExpandedCards] = useState(new Set(['summary']));
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [mpSortBy, setMpSortBy] = useState('utilization');
  const [mpSortOrder, setMpSortOrder] = useState('desc');

  // Convert URL parameter back to proper state name
  const properStateName = stateId?.replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Fetch state summary data
  const { data: stateData, isLoading: stateLoading } = useStateSummary({
    state: properStateName
  });

  // Fetch MPs data for this state
  const { data: mpsData, isLoading: mpsLoading } = useMPSummary({
    state: properStateName,
    limit: 200 // Increased to accommodate all MPs from any state (UP has 119, highest in India)
  });

  // Mobile detection and touch handling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleCard = (cardId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const handleTouchStart = (e) => {
    if (isMobile) {
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isMobile) {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50 && Math.abs(distanceY) < 100;
    const isRightSwipe = distanceX < -50 && Math.abs(distanceY) < 100;
    
    const tabs = ['overview', 'mps', 'projects'];
    const currentIndex = tabs.indexOf(activeTab);
    
    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  // No need for sector data and trends anymore since we're using MP personality distribution

  const stateInfo = stateData?.data?.[0] || {};
  const mps = mpsData?.data || [];

  // Handle MP table sorting
  const handleMpSort = (field) => {
    if (mpSortBy === field) {
      setMpSortOrder(mpSortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setMpSortBy(field);
      setMpSortOrder(field === 'name' || field === 'constituency' || field === 'house' ? 'asc' : 'desc');
    }
  };

  // Sort MPs based on current sort criteria
  const sortedMPs = useMemo(() => {
    const sorted = [...mps];
    
    const compareValues = (a, b, getValue) => {
      const aValue = getValue(a);
      const bValue = getValue(b);
      
      if (mpSortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    };
    
    switch (mpSortBy) {
      case 'name':
        return sorted.sort((a, b) => {
          const aName = a.mpName || a.name;
          const bName = b.mpName || b.name;
          if (mpSortOrder === 'asc') {
            return aName.localeCompare(bName);
          } else {
            return bName.localeCompare(aName);
          }
        });
      case 'constituency':
        return sorted.sort((a, b) => {
          if (mpSortOrder === 'asc') {
            return a.constituency.localeCompare(b.constituency);
          } else {
            return b.constituency.localeCompare(a.constituency);
          }
        });
      case 'house':
        return sorted.sort((a, b) => {
          if (mpSortOrder === 'asc') {
            return a.house.localeCompare(b.house);
          } else {
            return b.house.localeCompare(a.house);
          }
        });
      case 'allocated':
        return sorted.sort((a, b) => compareValues(a, b, mp => mp.allocatedAmount || mp.totalAllocated || 0));
      case 'utilized':
        return sorted.sort((a, b) => compareValues(a, b, mp => mp.totalExpenditure || 0));
      case 'utilization':
      default:
        return sorted.sort((a, b) => compareValues(a, b, mp => mp.utilizationPercentage || 0));
    }
  }, [mps, mpSortBy, mpSortOrder]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const getUtilizationClass = (percentage) => {
    if (percentage >= 90) return 'high';
    if (percentage >= 70) return 'medium';
    return 'low';
  };

  // Helper function to render sortable MP table headers
  const renderMpSortableHeader = (field, label) => {
    const isActive = mpSortBy === field;
    const icon = isActive ? 
      (mpSortOrder === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />) :
      <ChevronDown size={16} style={{ opacity: 0.6 }} />;
    
    return (
      <th 
        className={`sortable-header ${isActive ? 'active' : ''}`}
        onClick={() => handleMpSort(field)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {label}
          {icon}
        </span>
      </th>
    );
  };

  if (stateLoading) {
    return (
      <div className="state-detail-loading">
        <div className="loading-spinner" role="status" aria-live="polite" aria-label="Loading state data"></div>
        <p>Loading state data...</p>
      </div>
    );
  }

  return (
    <div className="state-detail-page">
      <div className="state-detail-header">
        <Link to="/mplads/states" className="back-link">
          <ArrowLeft aria-hidden="true" />
          Back to All States
        </Link>
        
        <div className="state-title-section">
          <h1>{properStateName}</h1>
          <p>Detailed MPLADS performance analysis</p>
        </div>

        {/* Mobile Collapsible Summary Card */}
        {isMobile ? (
          <div className="mobile-summary-card">
            <button
              className="summary-card-header"
              onClick={() => toggleCard('summary')}
              aria-expanded={expandedCards.has('summary')}
            >
              <h3 id="summary-heading">Key Statistics</h3>
              {expandedCards.has('summary') ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
            </button>
            {expandedCards.has('summary') && (
              <div className="state-summary-stats mobile-summary-expanded" role="region" aria-labelledby="summary-heading">
                <div className="summary-stat">
                  <span className="stat-icon" aria-hidden="true"><Users size={24} strokeWidth={1.75} /></span>
                  <div>
                    <span className="stat-value">{stateInfo.mpCount || stateInfo.totalMPs || 0}</span>
                    <span className="stat-label">Total MPs</span>
                  </div>
                </div>
                <div className="summary-stat">
                  <span className="stat-icon" aria-hidden="true"><IndianRupee size={24} strokeWidth={1.75} /></span>
                  <div>
                    <span className="stat-value">{formatINRCompact(stateInfo.totalAllocated)}</span>
                    <span className="stat-label">Total Allocated</span>
                  </div>
                </div>
                <div className="summary-stat">
                  <span className="stat-icon" aria-hidden="true"><TrendingUp size={24} strokeWidth={1.75} /></span>
                  <div>
                    <span className={`stat-value utilization-${getUtilizationClass(stateInfo.utilizationPercentage)}`}>
                      {stateInfo.utilizationPercentage?.toFixed(2) || 0}%
                    </span>
                    <span className="stat-label">Fund Utilization</span>
                  </div>
                </div>
                <div className="summary-stat">
                  <span className="stat-icon" aria-hidden="true"><CheckCircle2 size={24} strokeWidth={1.75} /></span>
                  <div>
                    <span className="stat-value">{formatNumber(stateInfo.totalWorksCompleted)}</span>
                    <span className="stat-label">Works Completed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="state-summary-stats" role="region" aria-label="Key statistics">
            <div className="summary-stat">
              <span className="stat-icon" aria-hidden="true"><Users size={28} strokeWidth={1.75} /></span>
              <div>
                <span className="stat-value">{stateInfo.mpCount || stateInfo.totalMPs || 0}</span>
                <span className="stat-label">Total MPs</span>
              </div>
            </div>
            <div className="summary-stat">
              <span className="stat-icon" aria-hidden="true"><IndianRupee size={28} strokeWidth={1.75} /></span>
              <div>
                <span className="stat-value">{formatINRCompact(stateInfo.totalAllocated)}</span>
                <span className="stat-label">Total Allocated</span>
              </div>
            </div>
            <div className="summary-stat">
              <span className="stat-icon" aria-hidden="true"><TrendingUp size={28} strokeWidth={1.75} /></span>
              <div>
                <span className={`stat-value utilization-${getUtilizationClass(stateInfo.utilizationPercentage)}`}>
                  {stateInfo.utilizationPercentage?.toFixed(2) || 0}%
                </span>
                <span className="stat-label">Fund Utilization</span>
              </div>
            </div>
            <div className="summary-stat">
              <span className="stat-icon" aria-hidden="true"><CheckCircle2 size={28} strokeWidth={1.75} /></span>
              <div>
                <span className="stat-value">{formatNumber(stateInfo.totalWorksCompleted)}</span>
                <span className="stat-label">Works Completed</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="state-tabs" 
           onTouchStart={handleTouchStart}
           onTouchMove={handleTouchMove}
           onTouchEnd={handleTouchEnd}>
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mps' ? 'active' : ''}`}
          onClick={() => setActiveTab('mps')}
        >
          {isMobile ? 'MPs' : 'MPs Performance'}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
      </div>

      <div className="state-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {isMobile ? (
              /* Mobile Card-Based Layout */
              <div className="mobile-overview">
                <div className="mobile-card">
                  <button
                    className="card-header"
                    onClick={() => toggleCard('utilization')}
                    aria-expanded={expandedCards.has('utilization')}
                    aria-controls="utilization-panel"
                  >
                    <h3 id="utilization-heading">Fund Utilization</h3>
                    {expandedCards.has('utilization') ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                  </button>
                  {expandedCards.has('utilization') && (
                    <div id="utilization-panel" className="card-content" role="region" aria-labelledby="utilization-heading">
                      <FundUtilizationGauge 
                        utilization={stateInfo.utilizationPercentage || 0}
                        title={`${properStateName || 'State'} Utilization`}
                      />
                    </div>
                  )}
                </div>

                <div className="mobile-card">
                  <button
                    className="card-header"
                    onClick={() => toggleCard('personalities')}
                    aria-expanded={expandedCards.has('personalities')}
                    aria-controls="personalities-panel"
                  >
                    <h3 id="personalities-heading">MP Performance Profiles</h3>
                    {expandedCards.has('personalities') ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                  </button>
                  {expandedCards.has('personalities') && (
                    <div id="personalities-panel" className="card-content" role="region" aria-labelledby="personalities-heading">
                      <MPPersonalityDistribution 
                        data={mps}
                        title={`Performance Profiles in ${properStateName}`}
                      />
                    </div>
                  )}
                </div>

                <div className="mobile-card">
                  <button
                    className="card-header"
                    onClick={() => toggleCard('financial')}
                    aria-expanded={expandedCards.has('financial')}
                    aria-controls="financial-panel"
                  >
                    <h3 id="financial-heading">Financial Breakdown</h3>
                    {expandedCards.has('financial') ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                  </button>
                  {expandedCards.has('financial') && (
                    <div id="financial-panel" className="card-content" role="region" aria-labelledby="financial-heading">
                      <div className="mobile-breakdown-grid">
                        <div className="breakdown-item">
                          <span className="breakdown-label">Total Allocation</span>
                          <span className="breakdown-value">{formatCurrency(stateInfo.totalAllocated)}</span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Total Expenditure</span>
                          <span className="breakdown-value">{formatCurrency(stateInfo.totalExpenditure)}</span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Unspent Balance</span>
                          <span className="breakdown-value">
                            {formatCurrency((stateInfo.totalAllocated || 0) - (stateInfo.totalExpenditure || 0))}
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Average per MP</span>
                          <span className="breakdown-value">
                            {formatCurrency((stateInfo.totalAllocated || 0) / (stateInfo.totalMPs || 1))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Desktop Layout */
              <>
                <div className="charts-grid">
                  <div className="chart-container">
                    <h3>Fund Utilization</h3>
                    <FundUtilizationGauge 
                      utilization={stateInfo.utilizationPercentage || 0}
                      title={`${properStateName || 'State'} Utilization`}
                    />
                  </div>
                  <div className="chart-container">
                    <h3>MP Personality Types</h3>
                    <MPPersonalityDistribution 
                      data={mps}
                      title={`MP Performance Profiles in ${properStateName}`}
                    />
                  </div>
                </div>

                <div className="financial-breakdown">
                  <h3>Financial Breakdown</h3>
                  <div className="breakdown-grid">
                    <div className="breakdown-item">
                      <span className="breakdown-label">Total Allocation</span>
                      <span className="breakdown-value">{formatCurrency(stateInfo.totalAllocated)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Total Expenditure</span>
                      <span className="breakdown-value">{formatCurrency(stateInfo.totalExpenditure)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Unspent Balance</span>
                      <span className="breakdown-value">
                        {formatCurrency((stateInfo.totalAllocated || 0) - (stateInfo.totalExpenditure || 0))}
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Average per MP</span>
                      <span className="breakdown-value">
                        {formatCurrency((stateInfo.totalAllocated || 0) / (stateInfo.totalMPs || 1))}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'mps' && (
          <div className="mps-section">
            <h3>MPs Performance in {properStateName}</h3>
            {mpsLoading ? (
              <div className="loading">Loading MPs data...</div>
            ) : sortedMPs.length > 0 ? (
              isMobile ? (
                /* Mobile Card List */
                <div className="mobile-mp-list">
                  <div className="mobile-sort-control" style={{ marginBottom: '1rem' }}>
                    <label style={{ marginRight: '0.5rem', fontSize: '0.875rem', color: '#4a5568' }}>Sort by:</label>
                    <select 
                      value={mpSortBy} 
                      onChange={(e) => {
                        const newField = e.target.value;
                        setMpSortBy(newField);
                        setMpSortOrder(newField === 'name' || newField === 'constituency' || newField === 'house' ? 'asc' : 'desc');
                      }}
                      style={{ 
                        padding: '0.25rem 0.5rem', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.875rem' 
                      }}
                    >
                      <option value="utilization">Utilization %</option>
                      <option value="allocated">Allocated Amount</option>
                      <option value="utilized">Utilized Amount</option>
                      <option value="name">MP Name</option>
                      <option value="constituency">Constituency</option>
                      <option value="house">House</option>
                    </select>
                  </div>
                  {sortedMPs.map((mp) => (
                    <div key={mp.id || mp._id} className="mobile-mp-card">
                      <div className="mp-card-header">
                        <div className="mp-primary-info">
                          <Link to={`/mplads/mps/${encodeURIComponent(normalizeMPSlug(buildMPSlugHuman(mp, { lsTerm: filters?.lsTerm }) || String(mp.id || mp._id)))}`} className="mp-name-link">
                            <h4>{mp.mpName || mp.name}</h4>
                          </Link>
                          <p className="mp-constituency">{mp.constituency}</p>
                        </div>
                        <span className={`utilization-badge utilization-${getUtilizationClass(mp.utilizationPercentage)}`}>
                          {mp.utilizationPercentage?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="mp-card-details">
                        <div className="mp-detail-item">
                          <span className="detail-label">House</span>
                          <span className="detail-value">{mp.house}</span>
                        </div>
                        <div className="mp-detail-item">
                          <span className="detail-label">Allocated</span>
                          <span className="detail-value">{formatCurrency(mp.allocatedAmount || mp.totalAllocated)}</span>
                        </div>
                        <div className="mp-detail-item">
                          <span className="detail-label">Utilized</span>
                          <span className="detail-value">{formatCurrency(mp.totalExpenditure)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop Table */
                <div className="mps-table">
                  <table>
                    <thead>
                      <tr>
                        {renderMpSortableHeader('name', 'MP Name')}
                        {renderMpSortableHeader('constituency', 'Constituency')}
                        {renderMpSortableHeader('house', 'House')}
                        {renderMpSortableHeader('allocated', 'Allocated')}
                        {renderMpSortableHeader('utilized', 'Utilized')}
                        {renderMpSortableHeader('utilization', 'Utilization %')}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMPs.map((mp) => (
                        <tr key={mp.id || mp._id}>
                          <td>
                            <Link to={`/mplads/mps/${encodeURIComponent(normalizeMPSlug(buildMPSlugHuman(mp, { lsTerm: filters?.lsTerm }) || String(mp.id || mp._id)))}`} className="mp-link">
                              {mp.mpName || mp.name}
                            </Link>
                          </td>
                          <td>{mp.constituency}</td>
                          <td>{mp.house}</td>
                          <td>{formatCurrency(mp.allocatedAmount || mp.totalAllocated)}</td>
                          <td>{formatCurrency(mp.totalExpenditure)}</td>
                          <td>
                            <span className={`utilization-badge utilization-${getUtilizationClass(mp.utilizationPercentage)}`}>
                              {mp.utilizationPercentage?.toFixed(2) || 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="no-data">No MP data available for this state.</div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="projects-section">
            <ProjectListing stateName={properStateName} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StateDetail;
