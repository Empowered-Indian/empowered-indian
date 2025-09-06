import { useState, useMemo, useEffect } from 'react';
import { 
  FiFilter, 
  FiSearch, 
  FiMapPin, 
  FiCalendar, 
  FiCreditCard
} from 'react-icons/fi';
import { useCompletedWorks, useRecommendedWorks, useWorkCategories, useMPWorks } from '../../../../hooks/useApi';
import { sanitizeInput } from '../../../../utils/inputSanitization';
import RangeSlider from '../Common/Slider/RangeSlider';
import PaymentDetailsModal from '../Common/PaymentDetailsModal';
import { formatINRCompact } from '../../../../utils/formatters';
import './ProjectListing.css';
// Removed unused useFilters import (no longer needed in this component)

const ProjectListing = ({ stateName, constituency, mpId, mpName, showFiltersDefault = false, className = '' }) => {
  // Note: Using only local filters in this component; global filters are not required here
  const [projectType, setProjectType] = useState('completed');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [localFilters, setLocalFilters] = useState({
    search: '',
    year: '',
    cost_range: [0, 50000000], // 0 to 5 Crores in rupees
    has_payments: ''
  });
  const [showFilters, setShowFilters] = useState(showFiltersDefault);
  const [selectedPaymentWork, setSelectedPaymentWork] = useState(null);

  // Reset filters when constituency changes to prevent persistent filter state
  useEffect(() => {
    setLocalFilters({
      search: '',
      year: '',
      cost_range: [0, 50000000],
      has_payments: ''
    });
    setCurrentPage(1);
  }, [constituency, stateName, mpId]);

  // Fetch data with proper server-side pagination
  const worksParams = {
    page: currentPage,
    limit: limit, // Use proper pagination instead of fetching all data
    state: stateName,
    constituency: constituency,
    // If constituency present, restrict to Lok Sabha projects explicitly
    ...(constituency ? { house: 'Lok Sabha' } : {}),
    // Remove sort parameter to use default backend sorting
    search: localFilters.search,
    year: localFilters.year,
    min_cost: localFilters.cost_range[0] > 0 ? localFilters.cost_range[0] : undefined,
    max_cost: localFilters.cost_range[1] < 50000000 ? localFilters.cost_range[1] : undefined,
    has_payments: localFilters.has_payments !== '' ? localFilters.has_payments : undefined,
    // LS term is managed by hooks via FilterContext
  };

  // Add status parameter for MP-specific works API
  const mpWorksParams = {
    ...worksParams,
    status: projectType // 'completed' or 'recommended'
  };

  // Use MP-specific API if mpId is provided, otherwise use general works API
  const { 
    data: mpWorksData, 
    isLoading: mpWorksLoading, 
    error: mpWorksError 
  } = useMPWorks(
    mpId ? mpId : undefined,
    mpId ? mpWorksParams : undefined
  );

  const { 
    data: completedData, 
    isLoading: completedLoading, 
    error: completedError 
  } = useCompletedWorks(
    !mpId && projectType === 'completed' ? worksParams : undefined
  );

  const { 
    data: recommendedData, 
    isLoading: recommendedLoading, 
    error: recommendedError 
  } = useRecommendedWorks(
    !mpId && projectType === 'recommended' ? worksParams : undefined
  );

  // Removed unused categoriesData
  useWorkCategories();

  // Remove this - backend now handles deduplication
  // const { 
  //   data: completedWorksForFiltering 
  // } = useMPWorks(
  //   mpId && projectType === 'recommended' ? mpId : undefined,
  //   mpId && projectType === 'recommended' ? { ...mpWorksParams, status: 'completed', limit: 100 } : undefined
  // );

  // Current data based on selected type
  const currentData = mpId ? mpWorksData : (projectType === 'completed' ? completedData : recommendedData);
  const isLoading = mpId ? mpWorksLoading : (projectType === 'completed' ? completedLoading : recommendedLoading);
  const error = mpId ? mpWorksError : (projectType === 'completed' ? completedError : recommendedError);

  const rawProjects = currentData?.data?.works || currentData?.data?.completedWorks || currentData?.data?.recommendedWorks || [];
  
  // Backend now handles deduplication - no frontend filtering needed
  const projects = rawProjects;
  
  const pagination = currentData?.data?.pagination || {};
  // Normalize pagination object - API returns 'pages' but we use 'totalPages'
  if (pagination.pages && !pagination.totalPages) {
    pagination.totalPages = pagination.pages;
  }

  // Use server-side pagination and filtering
  const paginatedProjects = projects;
  
  // Use server-provided pagination info
  const serverPagination = pagination;

  // Use backend-provided statistics (total for all results, not just current page)
  const calculatedStats = useMemo(() => {
    // For MP-specific API, use summary data if available
    const backendSummary = currentData?.data?.summary;
    
    if (mpId && backendSummary) {
      return {
        totalWorks: backendSummary.totalWorks,
        totalCost: backendSummary.totalCost
      };
    }
    
    // For general works API (state page), use existing summary structure
    if (!mpId && currentData?.data?.summary) {
      return {
        totalWorks: currentData.data.summary.totalWorks,
        totalCost: currentData.data.summary.totalCost || currentData.data.summary.totalEstimatedCost
      };
    }
    
    // Fallback to pagination count and current page cost (shouldn't happen now)
    const pageCost = paginatedProjects.reduce((sum, project) => {
      const cost = project.finalAmount ?? project.recommendedAmount ?? project.cost ?? project.estimated_cost ?? 0;
      return sum + (typeof cost === 'number' ? cost : parseFloat(cost) || 0);
    }, 0);
    
    return {
      totalWorks: serverPagination.totalCount || paginatedProjects.length,
      totalCost: pageCost
    };
  }, [mpId, currentData, paginatedProjects, serverPagination]);

  // Categories removed from filters for cleaner UI
  // const categories = useMemo(() => {
  //   if (!categoriesData?.data) return [];
  //   const categoryType = projectType === 'completed' ? 'completed' : 'recommended';
  //   return categoriesData.data[categoryType]?.categories || [];
  // }, [categoriesData, projectType]);

  // Build available years dynamically from fetched projects (only years that exist in data)
  const availableYears = useMemo(() => {
    if (!projects || projects.length === 0) return [];

    const yearsSet = new Set();

    projects.forEach((project) => {
      const dateVal = project.completedDate || project.recommendationDate || project.date || project.completion_date || project.recommended_date;
      if (!dateVal) return;
      const year = new Date(dateVal).getFullYear();
      if (!isNaN(year)) yearsSet.add(year);
    });

    // Return years sorted descending
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [projects]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setLocalFilters({
      search: '',
      year: '',
      cost_range: [0, 50000000],
      has_payments: ''
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    // Ensure page is within valid range for server-side pagination
    const maxPage = serverPagination.totalPages || serverPagination.pages || 1;
    const validPage = Math.max(1, Math.min(page, maxPage));
    setCurrentPage(validPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="project-listing-loading">
        <div className="loading-spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-listing-error">
        <p>Error loading projects: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={`project-listing ${className}`}>
      {/* Header with tabs and summary */}
      <div className="project-listing-header">
        <div className="project-tabs">
          <button
            type="button"
            className={`tab-btn ${projectType === 'completed' ? 'active' : ''}`}
            onClick={() => {
              setProjectType('completed');
              setCurrentPage(1);
              // Clear payment filter when switching to completed works since all completed works have payments
              setLocalFilters(prev => ({ ...prev, has_payments: '' }));
            }}
          >
            Completed Works
          </button>
          <button
            type="button"
            className={`tab-btn ${projectType === 'recommended' ? 'active' : ''}`}
            onClick={() => {
              setProjectType('recommended');
              setCurrentPage(1);
            }}
          >
            Recommended Works
          </button>
        </div>

        <div className="project-summary">
          <div className="summary-stat">
            <span className="stat-value">{calculatedStats.totalWorks}</span>
            <span className="stat-label">Total Projects</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">
              {formatINRCompact(calculatedStats.totalCost, { includeRupeeSymbol: true })}
            </span>
            <span className="stat-label">
              {projectType === 'completed' ? 'Total Cost' : 'Estimated Cost'}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="project-filters">
        <div className="filters-header">
          <button
            type="button"
            className="filters-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            Filters
          </button>
          
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search projects..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', sanitizeInput(e.target.value))}
            />
          </div>
        </div>

        {(showFilters || !mpId) && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Year</label>
              <select
                value={localFilters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                disabled={availableYears.length === 0}
                title={availableYears.length === 0 ? 'No years available' : undefined}
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group cost-range-group">
              <RangeSlider
                min={0}
                max={50000000}
                step={10000}
                value={localFilters.cost_range}
                onChange={(newRange) => handleFilterChange('cost_range', newRange)}
                formatValue={(value) => {
                  if (value === 0) return '₹0';
                  if (value >= 100000) {
                    return `₹${(value / 100000).toFixed(0)}L`;
                  }
                  return `₹${(value / 1000).toFixed(0)}K`;
                }}
                label="Project Cost Range"
                debounceMs={500}
                className="project-cost-slider"
              />
            </div>

            {projectType === 'recommended' && (
              <div className="filter-group">
                <label>Payment Status</label>
                <select
                  value={localFilters.has_payments}
                  onChange={(e) => handleFilterChange('has_payments', e.target.value)}
                >
                  <option value="">All Projects</option>
                  <option value="true">With Payments</option>
                  <option value="false">Without Payments</option>
                </select>
              </div>
            )}

            <button type="button" className="clear-filters-btn" onClick={clearFilters}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Projects List */}
      <div className="projects-container">
        {(paginatedProjects.length === 0) ? (
          <div className="no-projects">
            <p>No {projectType} projects found for the selected filters.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {paginatedProjects.map((project, index) => (
              <div key={project._id || project.workId || String(index)} className="project-card">
                <div className="project-header">
                  <h4 className="project-title">
                    {project.workDescription || project.work_description || project.description}
                  </h4>
                  <span className="project-category">
                    {project.workCategory || project.category || 'Normal/Others'}
                  </span>
                </div>

                <div className="project-details">
                  <div className="detail-item">
                    <span className="rupee-icon">₹</span>
                    <span>
                      {formatCurrency(project.finalAmount || project.recommendedAmount || project.cost || project.estimated_cost || 0)}
                    </span>
                  </div>

                  <div className="detail-item">
                    <FiMapPin />
                    <span>{project.ida || project.location || project.district || project.executingAgency}</span>
                  </div>

                  <div className="detail-item">
                    <FiCalendar />
                    <span>
                      {formatDate(project.completedDate || project.recommendationDate || project.date || project.completion_date || project.recommended_date)}
                    </span>
                  </div>

                </div>

                <div className="project-footer">
                  <div className="mp-info">
                    <strong>{mpName || project.mp_details?.name || project.mpName}</strong>
                    <span>{project.mp_details?.constituency || project.constituency}</span>
                  </div>
                  
                  <div className="project-actions">
                    {projectType === 'completed' && (project.workId || project.work_id) && (
                      <button 
                        className="payment-details-btn"
                        onClick={() => setSelectedPaymentWork({
                          workId: project.workId || project.work_id,
                          description: project.workDescription || project.work_description || project.description
                        })}
                        title="View payment installments"
                      >
                        <FiCreditCard />
                        Payments
                      </button>
                    )}
                    
                    {projectType === 'recommended' && (
                      <div className="recommended-actions">
                        {project.hasPayments && (
                          <button 
                            className="payment-details-btn with-payments"
                            onClick={() => setSelectedPaymentWork({
                              workId: project.workId,
                              description: project.work_description || project.workDescription,
                              totalPaid: project.totalPaid,
                              paymentCount: project.paymentCount
                            })}
                            title={`₹${formatINRCompact(project.totalPaid)} paid (${project.paymentCount} payments)`}
                          >
                            <FiCreditCard />
                            ₹{formatINRCompact(project.totalPaid)} Paid
                          </button>
                        )}
                        
                        {project.status && (
                          <span className={`status-badge status-${project.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {project.status}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {(serverPagination.totalPages || serverPagination.pages || 1) > 1 && (
        <div className="project-pagination">
          <div className="pagination-info">
            Showing {((currentPage - 1) * limit) + 1} to{' '}
            {Math.min(currentPage * limit, serverPagination.totalCount || serverPagination.total || 0)} of{' '}
            {serverPagination.totalCount || serverPagination.total || 0} projects
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(1)}
              title="First page"
            >
              ««
            </button>

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              title="Previous page"
            >
              ‹
            </button>

            <span className="page-info">
              Page {currentPage} of {serverPagination.totalPages || serverPagination.pages || 1}
            </span>

            <button
              type="button"
              disabled={currentPage >= (serverPagination.totalPages || serverPagination.pages || 1)}
              onClick={() => handlePageChange(currentPage + 1)}
              title="Next page"
            >
              ›
            </button>

            <button
              type="button"
              disabled={currentPage >= (serverPagination.totalPages || serverPagination.pages || 1)}
              onClick={() => handlePageChange(serverPagination.totalPages || serverPagination.pages || 1)}
              title="Last page"
            >
              »»
            </button>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {selectedPaymentWork && (
        <PaymentDetailsModal
          workId={selectedPaymentWork.workId}
          workDescription={selectedPaymentWork.description}
          onClose={() => setSelectedPaymentWork(null)}
        />
      )}
    </div>
  );
};

export default ProjectListing;
