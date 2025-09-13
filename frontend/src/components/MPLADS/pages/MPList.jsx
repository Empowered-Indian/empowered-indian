import { useState, useMemo, useEffect, useRef, memo } from 'react';
import { FiSearch, FiFilter, FiDownload, FiInfo, FiTrendingUp, FiTrendingDown, FiMinus, FiUsers } from 'react-icons/fi';
import { useMPSummary, useOverview } from '../../../hooks/useApi';
import MPCard from '../components/MPs/MPCard';
import InfoTooltip from '../components/Common/InfoTooltip';
import SkeletonLoader from '../components/Common/SkeletonLoader';
import ErrorDisplay from '../components/Common/ErrorDisplay';
import ResultsFeedback from '../components/Common/ResultsFeedback';
import { showInfoToast } from '../../../utils/errorHandling.jsx';
import './MPList.css';
import { formatINRCompact } from '../../../utils/formatters';
import { sanitizeInput } from '../../../utils/inputSanitization';
import { useFilters } from '../../../contexts/FilterContext';
import { getPeriodLabel } from '../../../utils/lsTerm';

const MPList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('utilizationPercentage');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [filterRange, setFilterRange] = useState('all');
  // Use global house/lsTerm from FilterContext instead of local override
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(48); // default to a multiple of typical 4-column grid
  const [allMPs, setAllMPs] = useState([]);
  const gridRef = useRef(null);
  const [columns, setColumns] = useState(4);

  const { data, isLoading, isFetching, error, refetch } = useMPSummary({
    search: debouncedSearchQuery,
    sortBy,
    order: sortOrder,
    // Do not pass house/ls_term here; rely on FilterContext via useMPSummary
    page,
    limit
  });

  // Get all MPs for statistics (no pagination)
  const { data: allMPsData } = useMPSummary({
    page: 1,
    limit: 800 // Get all MPs for statistics
  });

  const { data: overviewData } = useOverview();
  const { filters, updateFilter } = useFilters();
  const uiHouse = (filters?.house || 'Lok Sabha') === 'Both Houses' ? 'all' : (filters?.house || 'Lok Sabha');
  const periodLabel = (filters?.house || 'Lok Sabha') === 'Lok Sabha'
    ? getPeriodLabel(filters?.lsTerm || 18)
    : (filters?.house === 'Rajya Sabha'
      ? 'Rajya Sabha'
      : `Both Houses • ${getPeriodLabel(filters?.lsTerm || 18)}`);

  const mps = useMemo(() => {
    return data?.data || [];
  }, [data?.data]);
  const totalMPs = data?.pagination?.totalCount || 0;
  const totalPages = data?.pagination?.totalPages || Math.ceil(totalMPs / limit);
  const hasMore = page < totalPages;

  // Detect grid column count and align page size (limit) to a multiple of columns
  useEffect(() => {
    if (!gridRef.current) return;
    const MIN_CARD_WIDTH = 350; // matches CSS minmax(350px, 1fr)
    const GRID_GAP = 24;        // matches CSS gap

    const computeColumns = () => {
      if (!gridRef.current) return 4; // Default fallback
      const width = gridRef.current.clientWidth || 0;
      const col = Math.max(1, Math.floor((width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
      return col;
    };

    const apply = () => {
      if (!gridRef.current) return; // Guard clause
      const col = computeColumns();
      if (col !== columns) {
        setColumns(col);
        const newLimit = col * 12; // 12 rows per load; keeps rows full
        setLimit(newLimit);
        setPage(1);
        setAllMPs([]);
      }
    };

    apply();
    const ro = new ResizeObserver(apply);
    if (gridRef.current) {
      ro.observe(gridRef.current);
    }
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, [columns]);

  // Ensure initial computation when items mount or view mode toggles
  useEffect(() => {
    if (viewMode !== 'grid') return;
    if (!gridRef.current) return;
    const MIN_CARD_WIDTH = 350;
    const GRID_GAP = 24;
    const width = gridRef.current.clientWidth || 0;
    const col = Math.max(1, Math.floor((width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
    if (col !== columns) {
      setColumns(col);
      const newLimit = col * 12;
      setLimit(newLimit);
      setPage(1);
      setAllMPs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, allMPs.length]);

  // Accumulate MPs across pages for infinite scrolling
  useEffect(() => {
    if (!mps) return;
    if (page === 1) {
      setAllMPs(mps);
    } else if (mps.length > 0) {
      setAllMPs(prev => {
        // Avoid duplicates by id
        const existingIds = new Set(prev.map(x => x.id || x._id));
        const next = mps.filter(x => !existingIds.has(x.id || x._id));
        return [...prev, ...next];
      });
    }
  }, [mps, page]);

  // Debounce search query (increase to 800ms for heavy operations)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset accumulated list when core filters/sort change (but not on search)
  useEffect(() => {
    setAllMPs([]);
    setPage(1);
  }, [sortBy, sortOrder, filterRange, filters.house, filters.lsTerm]);

  // Show search status without clearing content during debounce
  const isSearching = searchQuery !== debouncedSearchQuery;

  // Removed auto-loading via IntersectionObserver to keep the page footer reachable.

  // Calculate filtered MPs and available houses (memoized)
  const { filteredMPs, houses } = useMemo(() => {
    const source = allMPs.length > 0 ? allMPs : mps;
    if (source.length === 0) return { filteredMPs: [], houses: [] };

    // Apply performance filter based on utilization percentage
    let filtered = source;
    if (filterRange !== 'all') {
      filtered = filtered.filter(mp => {
        const utilization = mp.utilizationPercentage || 0;
        switch (filterRange) {
          case 'high':
            return utilization >= 70;
          case 'medium':
            return utilization >= 40 && utilization < 70;
          case 'low':
            return utilization < 40;
          default:
            return true;
        }
      });
    }

    // Get unique houses for filters
    const uniqueHouses = [...new Set(source.map(mp => mp.house).filter(Boolean))].sort();

    return {
      filteredMPs: filtered,
      houses: uniqueHouses
    };
  }, [allMPs, mps, filterRange]);

  // National statistics should depend on stable overview data to avoid re-renders on search
  const nationalStats = useMemo(() => {
    // When filtering a specific house, prefer overview stats
    if (uiHouse !== 'all') {
      const overviewStats = overviewData?.data;
      if (overviewStats) {
        return {
          totalMPs: overviewStats.totalMPs,
          totalAllocated: overviewStats.totalAllocated,
          totalExpenditure: overviewStats.totalExpenditure,
          avgUtilization: overviewStats.utilizationPercentage,
          totalCompleted: overviewStats.totalWorksCompleted
        };
      }
    }
    // Fallback only if overview not available
    const source = allMPs.length > 0 ? allMPs : mps;
    if (!source || source.length === 0) return null;
    return {
      totalMPs: totalMPs,
      totalAllocated: source.reduce((sum, mp) => sum + (mp.allocatedAmount || mp.totalAllocated || 0), 0),
      totalExpenditure: source.reduce((sum, mp) => sum + (mp.totalExpenditure || 0), 0),
      avgUtilization: source.reduce((sum, mp) => sum + (mp.utilizationPercentage || 0), 0) / source.length || 0,
      totalCompleted: source.reduce((sum, mp) => sum + (mp.completedWorksCount || 0), 0)
    };
  }, [overviewData, allMPs, mps, totalMPs]);

  // Memoized static UI blocks
  const NationalStatsDisplay = useMemo(() => {
    return function NationalStatsDisplay({ stats }) {
      if (!stats) return null;
      return (
        <div className="national-stats">
          <div className="stat-box">
            <div className="stat-label-row">
              <span className="stat-label">Total MPs</span>
              <InfoTooltip 
                content="Includes current and recent MPs with active MPLADS projects. Count may exceed current parliamentary seats due to ongoing multi-year projects from previous terms."
                position="bottom"
                size="small"
              />
            </div>
            <span className="stat-value">{formatNumber(stats.totalMPs)}</span>
            <span className="stat-period">{periodLabel}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Allocated</span>
            <span className="stat-value">{formatINRCompact(stats.totalAllocated)}</span>
            <span className="stat-period">{periodLabel}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Utilized</span>
            <span className="stat-value">{formatINRCompact(stats.totalExpenditure)}</span>
            <span className="stat-period">{periodLabel}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Avg. Utilization</span>
            <span className="stat-value">{stats.avgUtilization.toFixed(1)}%</span>
            <span className="stat-period">{periodLabel}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Works Completed</span>
            <span className="stat-value">{formatNumber(stats.totalCompleted)}</span>
            <span className="stat-period">{periodLabel}</span>
          </div>
        </div>
      );
    };
  }, []);

  const MemoNationalStatsDisplay = useMemo(() =>
    memo(NationalStatsDisplay)
  , [NationalStatsDisplay]);

  const PerformanceInsights = useMemo(() => {
    return function PerformanceInsights({ data }) {
      const items = Array.isArray(data) ? data : [];
      const high = items.filter(mp => (mp.utilizationPercentage || 0) >= 70).length;
      const medium = items.filter(mp => {
        const util = mp.utilizationPercentage || 0;
        return util >= 40 && util < 70;
      }).length;
      const low = items.filter(mp => (mp.utilizationPercentage || 0) < 40).length;
      return (
        <div className="performance-insights">
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon high">
                <FiTrendingUp />
              </div>
              <div className="insight-content">
                <h3>High Performers</h3>
                <p className="insight-count">{high}</p>
                <p className="insight-desc">MPs with ≥70% utilization</p>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon medium">
                <FiMinus />
              </div>
              <div className="insight-content">
                <h3>Average Performers</h3>
                <p className="insight-count">{medium}</p>
                <p className="insight-desc">MPs with 40-69% utilization</p>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon low">
                <FiTrendingDown />
              </div>
              <div className="insight-content">
                <h3>Needs Improvement</h3>
                <p className="insight-count">{low}</p>
                <p className="insight-desc">MPs with &lt;40% utilization</p>
              </div>
            </div>
          </div>
        </div>
      );
    };
  }, []);

  const MemoPerformanceInsights = useMemo(() =>
    memo(PerformanceInsights)
  , [PerformanceInsights]);

  // Removed unused formatCurrency function

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };


  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleSearch = (query) => {
    setSearchQuery(sanitizeInput(query));
    setPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'range':
        setFilterRange(value);
        break;
      case 'house':
        // Proxy to global filter context: map 'all' to 'Both Houses'
        updateFilter('house', value === 'all' ? 'Both Houses' : value);
        break;
    }
    setPage(1);
  };

  const isInitialLoading = isLoading && !data?.data && allMPs.length === 0;

  if (isInitialLoading) {
    return (
      <div className="mp-list">
        <div className="mp-list-header">
          <SkeletonLoader type="text" width="200px" height="2rem" />
          <SkeletonLoader type="text" width="150px" height="1rem" />
        </div>
        
        <div className="mp-controls">
          <SkeletonLoader type="text" width="300px" height="40px" />
          <SkeletonLoader type="text" width="150px" height="40px" />
        </div>
        
        <div className="mp-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <SkeletonLoader key={i} type="card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mp-list">
        <ErrorDisplay 
          error={error}
          onRetry={refetch}
          title="Unable to load MP data"
        />
      </div>
    );
  }

  const hasContextFilters = Boolean(searchQuery) || filterRange !== 'all' || uiHouse !== 'all';

  return (
    <div className="mps-page">
      <div className="mps-header">
        <div className="header-content">
          <div className="title-row">
            <h1>Member of Parliament Fund Utilization</h1>
            <InfoTooltip 
              content="This dashboard shows comprehensive MPLADS fund utilization data for all MPs. Data includes current and recent MPs with active projects across multiple parliamentary sessions."
              position="bottom"
              size="medium"
            />
          </div>
          <p>Browse and analyze individual MP performance across constituencies</p>
        </div>

        {nationalStats && (
          <MemoNationalStatsDisplay stats={nationalStats} />
        )}
      </div>

      {/* Performance Insights */}
      <MemoPerformanceInsights data={allMPsData?.data || []} />

      <div className="mps-controls">
        <div className="search-section">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search MPs, constituencies, or states..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {isSearching && (
              <span className="search-status" aria-live="polite" style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, color: 'var(--text-tertiary)'
              }}>
                Searching…
              </span>
            )}
          </div>
        </div>

        <div className="control-buttons">
          <div className="filter-controls">
            <div className="filter-group">
              <label>Utilization Level:</label>
              <select 
                value={filterRange} 
                onChange={(e) => handleFilterChange('range', e.target.value)}
                className="filter-select"
              >
                <option value="all">All MPs</option>
                <option value="high">High Utilization (≥70%)</option>
                <option value="medium">Medium Utilization (40-69%)</option>
                <option value="low">Low Utilization (&lt;40%)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>House:</label>
              <select 
                value={uiHouse} 
                onChange={(e) => handleFilterChange('house', e.target.value)}
                className="filter-select"
              >
                <option value="all">Both Houses</option>
                {houses.map(house => (
                  <option key={house} value={house}>{house}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => handleSort(e.target.value)}
              className="sort-select"
            >
              <option value="utilizationPercentage">Fund Utilization</option>
              <option value="completionRate">Completion Rate</option>
              <option value="completedWorksCount">Works Completed</option>
              <option value="allocatedAmount">Allocated Amount</option>
              <option value="totalExpenditure">Total Expenditure</option>
              <option value="completedWorksCount">Works Completed</option>
              <option value="mpName">MP Name</option>
              <option value="constituency">Constituency</option>
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

          <div className="tooltip-wrapper">
            <button className="download-btn" disabled aria-describedby="export-disabled-tooltip">
              <FiDownload />
              Export
            </button>
            <InfoTooltip 
              content="Export functionality coming soon. This feature will allow you to download MP data in various formats."
              position="left"
              size="small"
            />
          </div>
        </div>
      </div>

      {/* MPs Grid/List */}
      <div className="mps-content">
        <div className="content-header">
          <h2>
            All MPs ({formatNumber(totalMPs)})
          </h2>
          {(filterRange !== 'all' || uiHouse !== 'all' || searchQuery) && (
            <div className="active-filters">
              {filterRange !== 'all' && (
                <span className="filter-tag">
                  {filterRange === 'high' ? 'High Performers' : filterRange === 'medium' ? 'Average Performers' : 'Needs Improvement'}
                  <button onClick={() => handleFilterChange('range', 'all')}>×</button>
                </span>
              )}
              {uiHouse !== 'all' && (
                <span className="filter-tag">
                  {uiHouse}
                  <button onClick={() => handleFilterChange('house', 'all')}>×</button>
                </span>
              )}
              {searchQuery && (
                <span className="filter-tag">
                  Search: "{searchQuery}"
                  <button onClick={() => handleSearch('')}>×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Feedback (only when loading, empty, or contextual search/filters active) */}
        {(isFetching || filteredMPs.length === 0 || hasContextFilters) && (
          <ResultsFeedback
            isLoading={isFetching}
            hasResults={filteredMPs.length > 0}
            totalResults={totalMPs}
            searchQuery={searchQuery}
            activeFilters={[
              ...(filterRange !== 'all' ? [`Utilization: ${filterRange}`] : []),
              ...(uiHouse !== 'all' ? [`House: ${uiHouse}`] : [])
            ]}
            onClearSearch={() => {
              setSearchQuery('');
              setPage(1);
              showInfoToast('Search cleared');
            }}
            onClearFilters={() => {
              setFilterRange('all');
              handleFilterChange('house', 'all');
              setPage(1);
              showInfoToast('All filters cleared');
            }}
            onRetry={refetch}
            resultType="MPs"
            showLoadingInline={false}
          />
        )}

        {filteredMPs.length > 0 && (
          <>
            <div className={`mps-${viewMode}`} ref={viewMode === 'grid' ? gridRef : null}>
              {filteredMPs.map((mp, index) => (
                <MPCard 
                  key={mp.id || mp._id || `${mp.mpName}-${mp.constituency}-${index}`} 
                  mp={mp}
                />
              ))}

              {/* Grid-aligned status and controls */}
              <div className="grid-load-more">
                <div className="page-info">
                  <span>Showing {formatNumber(filteredMPs.length)} of {formatNumber(totalMPs)} MPs</span>
                </div>
                {hasMore && (
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={isLoading}
                    className="page-btn"
                  >
                    {isLoading ? 'Loading…' : 'Load more'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MPList;
