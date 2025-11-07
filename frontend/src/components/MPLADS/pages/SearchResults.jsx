import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiFilter, FiX, FiUser, FiMapPin, FiTrendingUp } from 'react-icons/fi';
  const [pageNo, setPageNo] = useState(1);
  const apiParams = useMemo(() => getApiParams(), [getApiParams]);
  const filterKey = useMemo(() => JSON.stringify(apiParams), [apiParams]);

  useEffect(() => {
    setPageNo(1);
  }, [urlQuery, filterKey]);

  // Use the MP summary API with filters
  const { data, isLoading, error } = useMPSummary({
    ...apiParams,
    search: urlQuery || filters.searchQuery,
    page: pageNo,
    limit: 20
  });

  const results = Array.isArray(data?.data?.mps) ? data.data.mps : (data?.data || []);
  const pagination = data?.data?.pagination || data?.pagination || {};
  const totalPages = pagination.totalPages || pagination.pages || 1;
  const currentPage = pagination.currentPage || pagination.page || pageNo;
  const canGoPrev = (pagination.hasPrev ?? currentPage > 1) && currentPage > 1;
  const canGoNext = (pagination.hasNext ?? currentPage < totalPages) && currentPage < totalPages;
  const { filters, getApiParams, getActiveFilterCount } = useFilters();
  const [pageNo, setPageNo] = useState(1);
  
  // Get search query from URL
  const urlQuery = searchParams.get('q') || '';
  
  // Use the MP summary API with filters
  const { data, isLoading, error } = useMPSummary({
    ...getApiParams(),
    search: urlQuery || filters.searchQuery,
    page: pageNo,
    limit: 20
  });

  const results = Array.isArray(data?.data?.mps) ? data.data.mps : (data?.data || []);
  const pagination = data?.data?.pagination || data?.pagination || {};
  const activeFilterCount = getActiveFilterCount();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const changePage = (pageChangeDirection = 'next') => {

    if (pageChangeDirection === 'next') {
      setPageNo(pageNo => pageNo + 1);
    } else {
      setPageNo(pageNo => pageNo - 1);
    }

  }

  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return 'high';
    if (percentage >= 70) return 'medium';
    return 'low';
  };

  const formatConstituencyName = (constituency, house, state) => {
    // Handle special cases for Rajya Sabha members
    if (constituency === "Sitting Rajya Sabha" || constituency === "Nominated Rajya Sabha") {
      const type = constituency.includes("Nominated") ? "Nominated" : "Sitting";
      return `${type} ${house}, ${state}`;
    }
    return constituency;
  };

  return (
    <div className="search-results-page">
      <div className="search-header">
        <div className="search-header-content">
          <h1>Search Results</h1>
          <div className="search-controls">
            <SearchBar />
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="search-content">
        <div className={`search-layout ${showFilters ? 'with-filters' : ''}`}>
          {showFilters && (
            <aside className="filter-sidebar">
              <FilterPanel onClose={() => setShowFilters(false)} />
            </aside>
          )}

          <main className="search-results">
            <div className="results-header">
              <h2>
                {isLoading ? 'Searching...' : 
                 results.length > 0 ? `Found ${pagination.totalCount || pagination.total || results.length} results` :
                 'No results found'}
              </h2>
              {(urlQuery || filters.searchQuery) && (
                <p className="search-query">
                  for "{urlQuery || filters.searchQuery}"
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="results-loading">
                <div className="loading-spinner"></div>
                <p>Loading results...</p>
              </div>
            ) : error ? (
              <div className="results-error">
                <p>Error loading results. Please try again.</p>
              </div>
            ) : results.length > 0 ? (
              <div className="results-list">
                {results.map((mp) => (
                  <Link 
                    key={mp._id || mp.id} 
                    to={`/mplads/mps/${encodeURIComponent(normalizeMPSlug(buildMPSlugHuman(mp, { lsTerm: filters?.lsTerm }) || String(mp._id || mp.id)))}`}
                    className="result-card"
                  >
                    <div className="result-header">
                      <div className="result-icon">
                        <FiUser />
                      </div>
                      <div className="result-info">
                        <h3 className="result-name">{mp.mpName || mp.name}</h3>
                        <div className="result-meta">
                          <span className="meta-item">
                            <FiMapPin />
            {(totalPages > 1) && (
              <div className="pagination">
                <button
                  disabled={!canGoPrev}
                  className="pagination-btn"
                  onClick={() => setPageNo(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={!canGoNext}
                  className="pagination-btn"
                  onClick={() => setPageNo(prev => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            )}
                        <span className="stat-label">Utilization</span>
                        <span className={`stat-value utilization-${getUtilizationColor(mp.utilizationPercentage)}`}>
                          <FiTrendingUp />
                          {mp.utilizationPercentage?.toFixed(1) || 0}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <p>No MPs found matching your search criteria.</p>
                <p>Try adjusting your filters or search query.</p>
              </div>
            )}

            {(pagination.totalPages || pagination.pages) > 1 && (
              <div className="pagination">
                <button 
                  disabled={!pagination.hasPrev && (pagination.currentPage || pagination.page) <= 1}
                  className="pagination-btn"
                  onClick={() => changePage('previous')}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.currentPage || pagination.page} of {pagination.totalPages || pagination.pages}
                </span>
                <button 
                  disabled={!pagination.hasNext && (pagination.currentPage || pagination.page) >= (pagination.totalPages || pagination.pages)}
                  className="pagination-btn"
                  onClick={() => changePage('next')}
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
