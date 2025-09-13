import { useState, useMemo } from 'react';
import { FiSearch, FiFilter, FiDownload, FiInfo, FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import { useStateSummary } from '../../../hooks/useApi';
import StateCard from '../components/States/StateCard';
import InfoTooltip from '../components/Common/InfoTooltip';
import SkeletonLoader from '../components/Common/SkeletonLoader';
import './StateList.css';
import { formatINRCompact } from '../../../utils/formatters';
import { useFilters } from '../../../contexts/FilterContext';
import { getPeriodLabel } from '../../../utils/lsTerm';
import { sanitizeInput } from '../../../utils/inputSanitization';

const StateList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('utilizationPercentage');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filterRange, setFilterRange] = useState('all'); // all, high, medium, low

  // Fetch once; perform filter/sort client-side to avoid extra calls
  const { data, isLoading, error } = useStateSummary();

  const { filters } = useFilters();
  const periodLabel = (filters?.house || 'Lok Sabha') === 'Lok Sabha'
    ? getPeriodLabel(filters?.lsTerm || 18)
    : (filters?.house === 'Rajya Sabha'
      ? 'Rajya Sabha'
      : `Both Houses • ${getPeriodLabel(filters?.lsTerm || 18)}`);

  const states = useMemo(() => {
    return data?.data || [];
  }, [data?.data]);

  // Calculate national statistics and remove duplicates
  const { uniqueStates, nationalStats } = useMemo(() => {
    if (states.length === 0) return { uniqueStates: [], nationalStats: null };

    // Remove duplicates by state name
    const stateMap = new Map();
    states.forEach(state => {
      const stateName = state.state || state.name;
      if (stateName && (!stateMap.has(stateName) || state.mpCount > (stateMap.get(stateName).mpCount || 0))) {
        stateMap.set(stateName, state);
      }
    });
    
    const uniqueStates = Array.from(stateMap.values());

    const totalAllocated = uniqueStates.reduce((sum, state) => sum + (state.totalAllocated || 0), 0);
    const totalExpenditure = uniqueStates.reduce((sum, state) => sum + (state.totalExpenditure || 0), 0);
    const avgUtilization = uniqueStates.reduce((sum, state) => sum + (state.utilizationPercentage || 0), 0) / uniqueStates.length;

    return {
      uniqueStates,
      nationalStats: {
        totalStates: uniqueStates.length,
        totalAllocated,
        totalExpenditure,
        avgUtilization
      }
    };
  }, [states]);

  // Filter and sort states locally to avoid unnecessary API calls
  const filteredStates = useMemo(() => {
    let filtered = uniqueStates;

    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((state) => {
        const stateName = (state.state || state.name || '').toLowerCase();
        return stateName.includes(q);
      });
    }

    // Apply performance filter
    if (filterRange !== 'all') {
      filtered = filtered.filter((state) => {
        const utilization = state.utilizationPercentage || 0;
        switch (filterRange) {
          case 'high':
            return utilization >= 80;
          case 'medium':
            return utilization >= 50 && utilization < 80;
          case 'low':
            return utilization < 50;
          default:
            return true;
        }
      });
    }

    // Apply sort locally
    const sorted = [...filtered].sort((a, b) => {
      const getVal = (s) => {
        switch (sortBy) {
          case 'name':
            return (s.state || s.name || '').toString();
          case 'totalAllocated':
            return Number(s.totalAllocated || 0);
          case 'totalExpenditure':
            return Number(s.totalExpenditure || 0);
          case 'totalWorksCompleted':
            return Number(s.totalWorksCompleted || 0);
          case 'utilizationPercentage':
          default:
            return Number(s.utilizationPercentage || 0);
        }
      };

      const va = getVal(a);
      const vb = getVal(b);

      if (sortBy === 'name') {
        // String compare
        const cmp = va.localeCompare(vb, undefined, { sensitivity: 'base' });
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      // Numeric compare
      const cmp = va - vb;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [uniqueStates, searchQuery, filterRange, sortBy, sortOrder]);

  // Currency formatting handled via formatINRCompact


  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="states-page">
        <div className="states-header">
          <div className="header-content">
            <SkeletonLoader type="text" width="300px" height="2rem" />
            <SkeletonLoader type="text" width="400px" height="1rem" />
          </div>
          
          <div className="national-stats">
            {[1, 2, 3, 4].map(i => (
              <SkeletonLoader key={i} type="stat" />
            ))}
          </div>
        </div>
        
        <div className="states-controls">
          <div className="search-section">
            <SkeletonLoader type="text" width="300px" height="40px" />
          </div>
          <div className="control-buttons">
            <SkeletonLoader type="text" width="150px" height="40px" />
            <SkeletonLoader type="text" width="150px" height="40px" />
            <SkeletonLoader type="text" width="100px" height="40px" />
          </div>
        </div>
        
        <div className="performance-insights">
          <div className="insights-grid">
            {[1, 2, 3].map(i => (
              <SkeletonLoader key={i} type="card" />
            ))}
          </div>
        </div>

        
        <div className="states-content">
          <SkeletonLoader type="text" width="150px" height="1.5rem" />
          <div className="states-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <SkeletonLoader key={i} type="card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="states-error">
        <p>Error loading state data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="states-page">
      <div className="states-header">
        <div className="header-content">
          <div className="title-row">
            <h1>State-wise MPLADS Performance</h1>
            <InfoTooltip 
              content="This dashboard includes data from current and recent MPs with active MPLADS projects. MP counts may exceed current parliamentary seats due to ongoing multi-year projects from previous terms. Data spans multiple parliamentary sessions to show complete project lifecycles."
              position="bottom"
              size="medium"
            />
          </div>
          <p>Comprehensive overview of fund utilization across all states and union territories</p>
        </div>

        {nationalStats && (
          <div className="national-stats">
            <div className="stat-box">
              <span className="stat-label">Total States/UTs</span>
              <span className="stat-value">{nationalStats.totalStates}</span>
              <span className="stat-period">{periodLabel}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Total Allocated</span>
              <span className="stat-value">{formatINRCompact(nationalStats.totalAllocated)}</span>
              <span className="stat-period">{periodLabel}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Total Utilized</span>
              <span className="stat-value">{formatINRCompact(nationalStats.totalExpenditure)}</span>
              <span className="stat-period">{periodLabel}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Avg. Utilization</span>
              <span className="stat-value">{nationalStats.avgUtilization.toFixed(1)}%</span>
              <span className="stat-period">{periodLabel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="performance-insights">
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon high">
              <FiTrendingUp />
            </div>
            <div className="insight-content">
              <h3>High Performers</h3>
              <p className="insight-count">{uniqueStates.filter(s => (s.utilizationPercentage || 0) >= 80).length}</p>
              <p className="insight-desc">States with ≥80% utilization</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon medium">
              <FiMinus />
            </div>
            <div className="insight-content">
              <h3>Average Performers</h3>
              <p className="insight-count">{uniqueStates.filter(s => {
                const util = s.utilizationPercentage || 0;
                return util >= 50 && util < 80;
              }).length}</p>
              <p className="insight-desc">States with 50-79% utilization</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon low">
              <FiTrendingDown />
            </div>
            <div className="insight-content">
              <h3>Needs Improvement</h3>
              <p className="insight-count">{uniqueStates.filter(s => (s.utilizationPercentage || 0) < 50).length}</p>
              <p className="insight-desc">States with &lt;50% utilization</p>
            </div>
          </div>
        </div>
      </div>

      <div className="states-controls">
        <div className="search-section">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Filter states and UTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
            />
          </div>
        </div>

        <div className="control-buttons">
          <div className="filter-controls">
            <label>Performance:</label>
            <select 
              value={filterRange} 
              onChange={(e) => setFilterRange(e.target.value)}
              className="sort-select"
            >
              <option value="all">All States</option>
              <option value="high">High (≥80%)</option>
              <option value="medium">Medium (50-79%)</option>
              <option value="low">Low (&lt;50%)</option>
            </select>
          </div>
          
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => handleSort(e.target.value)}
              className="sort-select"
            >
              <option value="utilizationPercentage">Utilization %</option>
              <option value="totalAllocated">Total Allocated</option>
              <option value="totalExpenditure">Total Expenditure</option>
              <option value="totalWorksCompleted">Works Completed</option>
              <option value="name">State Name</option>
            </select>
          </div>

          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>

          <button className="download-btn" disabled>
            <FiDownload />
            Export
          </button>
        </div>
      </div>


      {/* States Grid/List */}
      <div className="states-content">
        <div className="content-header">
          <h2>All States & UTs ({filteredStates.length}{filteredStates.length !== uniqueStates.length ? ` of ${uniqueStates.length}` : ''})</h2>
          {filterRange !== 'all' && (
            <div className="active-filter">
              <span className="filter-label">Showing: {filterRange === 'high' ? 'High Performers' : filterRange === 'medium' ? 'Average Performers' : 'Needs Improvement'}</span>
              <button 
                className="clear-filter"
                onClick={() => setFilterRange('all')}
                title="Clear filter"
              >
                ×
              </button>
            </div>
          )}
        </div>
        {filteredStates.length > 0 ? (
          <div className={`states-${viewMode}`}>
            {filteredStates.map((state, index) => (
              <StateCard 
                key={state._id || state.state || index} 
                state={{
                  ...state,
                  name: state.state || state.name || 'Unknown State',
                  rank: index + 1,
                  totalStates: states.length
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="no-states">
            <p>No states found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateList;
