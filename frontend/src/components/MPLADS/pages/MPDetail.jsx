import { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiTrendingUp, FiDollarSign, FiCheckCircle, FiMapPin, FiUsers, FiTarget, FiAlertTriangle, FiCopy, FiBarChart2 } from 'react-icons/fi';
import { useMPDetails, useMPWorks } from '../../../hooks/useApi';
import { formatINRCompact } from '../../../utils/formatters';
import FundUtilizationGauge from '../components/Charts/FundUtilizationGauge';
import InfoTooltip from '../components/Common/InfoTooltip';
import ProjectListing from '../components/Projects/ProjectListing';
import SkeletonLoader from '../components/Common/SkeletonLoader';
import { showSuccessToast, showErrorToast } from '../../../utils/errorHandling.jsx';
import { getIdFromSlug, isBareObjectId, buildMPSlugHuman, buildMPSlugCandidates, normalizeMPSlug } from '../../../utils/slug';
import { summaryAPI } from '../../../services/api';
import { useFilters } from '../../../contexts/FilterContext';
import './MPDetail.css';

const MPDetail = () => {
  const navigate = useNavigate();
  const { filters } = useFilters();
  const { mpId } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [resolvedIdFromSlug, setResolvedIdFromSlug] = useState(null);
  const [resolvingSlug, setResolvingSlug] = useState(false);
  const [ambiguousMatches, setAmbiguousMatches] = useState(null);

  // Determine if route param contains an ID
  const idInParam = getIdFromSlug(mpId);
  const bareId = isBareObjectId(mpId) ? mpId : null;
  const effectiveId = idInParam || bareId || resolvedIdFromSlug;

  // Fetch MP details
  const { data: mpData, isLoading: mpLoading, error: mpError } = useMPDetails(effectiveId);
  
  // Fetch MP works
  const { data: worksData, isLoading: worksLoading } = useMPWorks(effectiveId, {
    limit: 100
  });

  const mp = mpData?.data?.mp || mpData?.data || {};
  const works = worksData?.data?.works || worksData?.data || [];

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
    if (percentage >= 70) return 'high';
    if (percentage >= 40) return 'medium';
    return 'low';
  };

  // Calculate project statistics from MP summary data
  const projectStats = {
    completed: mp.completedWorksCount || 0,
    ongoing: Math.max(0, (mp.recommendedWorksCount || 0) - (mp.completedWorksCount || 0)),
    recommended: mp.recommendedWorksCount || 0,
    total: mp.recommendedWorksCount || 0
  };

  // Use backend-calculated completion rate, or calculate it correctly as fallback
  const completionRate = mp.completionRate || (
    (mp.recommendedWorksCount || 0) > 0 ? 
    Math.min(((mp.completedWorksCount || 0) / (mp.recommendedWorksCount || 0)) * 100, 100) : 0
  );

  // Payment gap analysis (same logic as MPCard)
  const hasPaymentGap = (mp) => {
    const completedValue = mp.completedWorksValue || mp.totalCompletedAmount || 0;
    const gap = (mp.totalExpenditure || 0) - completedValue;
    const gapPercentage = mp.totalExpenditure > 0 ? (gap / mp.totalExpenditure * 100) : 0;
    return gapPercentage > 50; // Flag if more than 50% of spending is unaccounted
  };

  const inProgressPayments = mp.inProgressPayments !== undefined ? mp.inProgressPayments : 
    ((mp.totalExpenditure || 0) - (mp.completedWorksValue || mp.totalCompletedAmount || 0));
  const showWarning = hasPaymentGap(mp);

  // Canonicalize URL to slug when user lands on bare id (ensure hooks are before any early returns)
  useEffect(() => {
    if (!mp || mpLoading) return;
    // If URL has an ID (either as bare or trailing), canonicalize to human slug without ID
    if (idInParam || bareId) {
      const human = normalizeMPSlug(buildMPSlugHuman(mp, { lsTerm: filters?.lsTerm }));
      if (human) {
        // preserve the resolved id so data remains while URL updates
        if (!resolvedIdFromSlug) setResolvedIdFromSlug(idInParam || bareId);
        try {
          const LS_KEY = 'mplads_slug_index';
          const map = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
          map[human] = idInParam || bareId;
          localStorage.setItem(LS_KEY, JSON.stringify(map));
        } catch { /* ignore */ }
        navigate(`/mplads/mps/${human}`.replace(/\-+/g, '-'), { replace: true });
      }
    }
  }, [mpId, mp, mpLoading, navigate, idInParam, bareId, resolvedIdFromSlug, filters?.lsTerm]);

  // Resolve slug -> id when URL has no id
  useEffect(() => {
    if (effectiveId) return; // already have id
    if (!mpId || idInParam || bareId) return; // param has an id or is empty
    const slug = normalizeMPSlug(String(mpId));

    const LS_KEY = 'mplads_slug_index';
    const readIndex = () => {
      try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
    };
    const writeIndex = (map) => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(map)); } catch { /* ignore */ }
    };

    const fromCache = readIndex();
    if (fromCache[slug]) {
      setResolvedIdFromSlug(fromCache[slug]);
      return;
    }

    let cancelled = false;
    const resolve = async () => {
      setResolvingSlug(true);
      const attempts = [];
      const house = filters?.house || 'Both Houses';
      const lsTerm = Number(filters?.lsTerm || 18);
      // Try with current filters
      attempts.push({ house: house !== 'Both Houses' ? house : undefined, ls_term: house === 'Lok Sabha' ? lsTerm : undefined });
      // Then without house (both)
      attempts.push({});
      // Then fallback ls terms if needed
      attempts.push({ house: 'Lok Sabha', ls_term: 18 });
      attempts.push({ house: 'Lok Sabha', ls_term: 17 });
      attempts.push({ house: 'Rajya Sabha' });

      let found = [];
      for (const params of attempts) {
        try {
          const resp = await summaryAPI.getMPSummary({ page: 1, limit: 800, ...params });
          const list = resp?.data?.data || resp?.data || [];
          if (!Array.isArray(list) || list.length === 0) continue;
          // find matching by any candidate slug
          const matches = list.filter((m) => buildMPSlugCandidates(m).includes(slug));
          if (matches.length > 0) {
            found = matches;
            break;
          }
        } catch (e) {
          // continue to next attempt
        }
      }
      if (cancelled) return;
      if (found.length === 1 && (found[0]._id || found[0].id)) {
        const id = found[0]._id || found[0].id;
        setResolvedIdFromSlug(id);
        const idx = readIndex();
        idx[slug] = id;
        writeIndex(idx);
      } else if (found.length > 1) {
        setAmbiguousMatches(found);
      }
      setResolvingSlug(false);
    };
    resolve();
    return () => { cancelled = true; };
  }, [effectiveId, mpId, idInParam, bareId, filters?.house, filters?.lsTerm]);

  if (ambiguousMatches && ambiguousMatches.length > 1 && !effectiveId) {
    return (
      <div className="mp-detail-page">
        <div className="mp-detail-header">
          <Link to="/mplads/mps" className="back-link"><FiArrowLeft />Back to All MPs</Link>
          <div className="mp-title-section">
            <div className="mp-title-info">
              <h1>Multiple matches found</h1>
              <div className="mp-basic-info">
                <div className="info-item">
                  <span>Please choose the correct member:</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="performance-summary" style={{ marginTop: 16 }}>
          <div className="performance-cards">
            {ambiguousMatches.map((m) => {
              const slug = normalizeMPSlug(buildMPSlugHuman(m, { lsTerm: filters?.lsTerm }));
              const id = m._id || m.id;
              return (
                <Link key={id} to={`/mplads/mps/${encodeURIComponent(slug)}`} className="performance-card" style={{ textDecoration: 'none' }}>
                  <h4 style={{ marginBottom: 8 }}>{m.mpName || m.name}</h4>
                  <div className="performance-details">
                    <div className="detail-row"><span>House</span><span>{m.house || '—'}</span></div>
                    <div className="detail-row"><span>Constituency</span><span>{m.constituency || '—'}</span></div>
                    <div className="detail-row"><span>State</span><span>{m.state || '—'}</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (mpLoading || (!effectiveId && resolvingSlug)) {
    return (
      <div className="mp-detail-page">
        {/* Header skeleton */}
        <div className="mp-detail-header">
          <SkeletonLoader type="text" width="120px" height="40px" className="inline" />

          <div className="mp-title-section">
            <SkeletonLoader type="text" width="80px" height="80px" className="inline" />
            <div className="mp-title-info">
              <SkeletonLoader type="text" width="250px" height="2rem" />
              <SkeletonLoader type="text" width="180px" height="1rem" />
              <SkeletonLoader type="text" width="100px" height="1rem" />
            </div>
          </div>
        </div>

        {/* Stats skeleton - match desktop grid */}
        <div className="mp-summary-stats">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} type="stat" />
          ))}
        </div>

        {/* Tab buttons skeleton */}
        <div className="mp-tabs">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} type="text" width="100px" height="40px" className="inline" />
          ))}
        </div>

        {/* Content skeleton - reuse desktop containers */}
        <div className="mp-content">
          <div className="overview-section">
            <div className="overview-grid">
              <div className="chart-container">
                <SkeletonLoader type="text" width="200px" height="1.5rem" />
                <SkeletonLoader type="chart" />
              </div>

              <div className="projects-overview">
                <SkeletonLoader type="text" width="180px" height="1.5rem" />
                <div className="project-stats-grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonLoader key={i} type="stat" />
                  ))}
                </div>
              </div>
            </div>

            <div className="performance-summary">
              <div className="performance-cards">
                <SkeletonLoader type="card" />
                <SkeletonLoader type="card" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mpError || !mp || (typeof mp !== 'object') || (!mp.mpName && !mp.name)) {
    return (
      <div className="mp-detail-error">
        <div className="error-content">
          <h2>MP Not Found</h2>
          <p>The MP you're looking for could not be found or may have been removed.</p>
          <Link to="/mplads/mps" className="back-link">
            <FiArrowLeft />
            Back to All MPs
          </Link>
        </div>
      </div>
    );
  }

  

  return (
    <div className="mp-detail-page">
      <div className="mp-detail-header">
        <Link to="/mplads/mps" className="back-link">
          <FiArrowLeft />
          Back to All MPs
        </Link>
        
        <div className="mp-title-section">
          <div className="mp-avatar-large">
            <FiUser />
          </div>
          <div className="mp-title-info">
            <h1>{mp.name || mp.mpName}</h1>
            <div className="mp-basic-info">
              <div className="info-item">
                <FiMapPin />
                <span>{mp.constituency}, {mp.state}</span>
              </div>
              <div className="info-item">
                <span className="house-badge-large">{mp.house}</span>
              </div>
            </div>
          </div>
          <div className="mp-header-actions">
            <button
              className="action-btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.origin + location.pathname);
                  showSuccessToast('Link copied');
                } catch (e) {
                  showErrorToast('Unable to copy link');
                }
              }}
              title="Copy link"
            >
              <FiCopy />
              <span>Copy Link</span>
            </button>
            <Link
              to="/mplads/compare"
              className="action-btn secondary"
              title="Compare MPs"
            >
              <FiBarChart2 />
              <span>Compare</span>
            </Link>
          </div>
        </div>

        <div className="mp-summary-stats">
          <div className="summary-stat-card allocated">
            <div className="stat-icon-wrapper">
              <FiDollarSign className="summary-stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatINRCompact(mp.allocatedAmount || mp.totalAllocated || 0, { includeRupeeSymbol: true })}</div>
              <div className="stat-label">Total Allocated</div>
              <div className="stat-subtitle">Budget assigned to MP</div>
            </div>
          </div>
          
          <div className="summary-stat-card utilization">
            <div className="stat-icon-wrapper">
              <FiTrendingUp className="summary-stat-icon" />
            </div>
            <div className="stat-content">
              <div className={`stat-value utilization-${getUtilizationClass(mp.utilizationPercentage || 0)}`}>
                {(mp.utilizationPercentage || 0).toFixed(1)}%
              </div>
              <div className="stat-label">
                Fund Utilization
                {' '}
                <InfoTooltip 
                  content="Percentage of allocated MPLADS funds that have been disbursed for approved development projects."
                  position="top"
                  size="small"
                />
              </div>
              <div className="stat-subtitle">
                {formatCurrency(mp.totalExpenditure || 0)} utilized
              </div>
            </div>
          </div>
          
          <div className="summary-stat-card works">
            <div className="stat-icon-wrapper">
              <FiCheckCircle className="summary-stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatNumber(mp.completedWorksCount || projectStats.completed)}</div>
              <div className="stat-label">Works Completed</div>
              <div className="stat-subtitle">
                out of {formatNumber(mp.recommendedWorksCount || 0)} recommended
              </div>
            </div>
          </div>
          
          <div className="summary-stat-card success">
            <div className="stat-icon-wrapper">
              <FiTarget className="summary-stat-icon" />
            </div>
            <div className="stat-content">
              <div className={`stat-value ${completionRate >= 70 ? 'high' : completionRate >= 50 ? 'medium' : 'low'}`}>
                {completionRate.toFixed(1)}%
              </div>
              <div className="stat-label">Completion Rate</div>
              <div className="stat-subtitle">Project completion ratio</div>
            </div>
          </div>
        </div>

        {showWarning && (
          <div className="mp-payment-warning">
            <div className="warning-content">
              <FiAlertTriangle className="warning-icon" />
              <div className="warning-text">
                <span className="warning-amount">{formatINRCompact(inProgressPayments, { includeRupeeSymbol: true })}</span>
                <span className="warning-message">paid but work is incomplete</span>
              </div>
              <InfoTooltip 
                content="This indicates funds have been disbursed but corresponding completed works haven't been fully recorded. This may represent works in progress or reporting gaps."
                position="left"
                size="medium"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mp-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button 
          className={`tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          Financial Details
        </button>
      </div>

      <div className="mp-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="overview-grid">
              <div className="chart-container">
                <h3>
                  Fund Utilization
                  {' '}
                  <InfoTooltip 
                    content="Percentage of allocated MPLADS funds that have been disbursed for approved development projects."
                    position="top"
                    size="small"
                  />
                </h3>
                <FundUtilizationGauge 
                  utilization={mp.utilizationPercentage || 0}
                  title={`${mp.name || mp.mpName} Utilization`}
                />
              </div>
              
              <div className="projects-overview">
                <h3>Projects Overview</h3>
                <div className="project-stats-grid">
                  <div className="project-stat-card completed">
                    <div className="stat-icon-container">
                      <FiCheckCircle />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{projectStats.completed}</span>
                      <span className="stat-description">Completed Projects</span>
                    </div>
                  </div>
                  
                  <div className="project-stat-card ongoing">
                    <div className="stat-icon-container">
                      <FiTrendingUp />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{projectStats.ongoing}</span>
                      <span className="stat-description">Ongoing Projects</span>
                    </div>
                  </div>
                  
                  <div className="project-stat-card recommended">
                    <div className="stat-icon-container">
                      <FiTarget />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{projectStats.recommended}</span>
                      <span className="stat-description">Recommended Projects</span>
                    </div>
                  </div>
                  
                  <div className="project-stat-card total">
                    <div className="stat-icon-container">
                      <FiUsers />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{projectStats.total}</span>
                      <span className="stat-description">Total Projects</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="performance-summary">
              <h3>Performance Summary</h3>
              <div className="performance-cards">
                <div className="performance-card">
                  <h4>Financial Performance</h4>
                  <div className="performance-details">
                    <div className="detail-row">
                      <span>Allocated Amount:</span>
                      <span className="amount">{formatCurrency(mp.allocatedAmount || mp.totalAllocated)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Utilized Amount:</span>
                      <span className="amount">{formatCurrency(mp.totalExpenditure)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Remaining Balance:</span>
                      <span className="amount">
                        {formatCurrency((mp.allocatedAmount || mp.totalAllocated || 0) - (mp.totalExpenditure || 0))}
                      </span>
                    </div>
                    <div className="detail-row highlight">
                      <span>
                        Fund Utilization
                        {' '}
                        <InfoTooltip 
                          content="Percentage of allocated MPLADS funds that have been disbursed for approved development projects."
                          position="top"
                          size="small"
                        />
                      </span>
                      <span className={`percentage utilization-${getUtilizationClass(mp.utilizationPercentage || 0)}`}>
                        {(mp.utilizationPercentage || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Works Completed:</span>
                      <span className="percentage">
                        {mp.completedWorksCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="performance-card">
                  <h4>Project Delivery</h4>
                  <div className="performance-details">
                    <div className="detail-row">
                      <span>Total Projects:</span>
                      <span className="count">{projectStats.total}</span>
                    </div>
                    <div className="detail-row">
                      <span>Completed:</span>
                      <span className="count completed">{projectStats.completed}</span>
                    </div>
                    <div className="detail-row">
                      <span>In Progress:</span>
                      <span className="count ongoing">{projectStats.ongoing}</span>
                    </div>
                    <div className="detail-row highlight">
                      <span>Completion Rate:</span>
                      <span className={`percentage ${completionRate >= 70 ? 'high' : completionRate >= 50 ? 'medium' : 'low'}`}>
                        {completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>
                        Fund Utilization
                        {' '}
                        <InfoTooltip 
                          content="Percentage of allocated MPLADS funds that have been disbursed for approved development projects."
                          position="top"
                          size="small"
                        />
                      </span>
                      <span className={`percentage ${(mp.utilizationPercentage || 0) >= 70 ? 'high' : (mp.utilizationPercentage || 0) >= 40 ? 'medium' : 'low'}`}>
                        {(mp.utilizationPercentage || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="projects-section">
            <h3>Projects by {mp.name || mp.mpName}</h3>
            {worksLoading ? (
              <div className="loading">Loading projects data...</div>
            ) : works.length > 0 ? (
              <ProjectListing 
                mpId={effectiveId}
                mpName={mp.name || mp.mpName}
                showFiltersDefault={true}
                mpSummary={{
                  completedWorksCount: mp.completedWorksCount,
                  recommendedWorksCount: mp.recommendedWorksCount,
                  completedWorksValue: mp.completedWorksValue || mp.totalCompletedAmount,
                  totalRecommendedAmount: mp.totalRecommendedAmount,
                  totalExpenditure: mp.totalExpenditure
                }}
              />
            ) : (
              <div className="no-data">No project data available for this MP.</div>
            )}
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="financial-section">
            <h3>Financial Breakdown</h3>
            <div className="financial-details-grid">
              <div className="financial-card">
                <h4>Fund Allocation</h4>
                <div className="financial-items">
                  <div className="financial-item">
                    <span className="item-label">Initial Allocation</span>
                    <span className="item-value">{formatCurrency(mp.allocatedAmount || mp.totalAllocated)}</span>
                  </div>
                  <div className="financial-item">
                    <span className="item-label">Total Expenditure</span>
                    <span className="item-value">{formatCurrency(mp.totalExpenditure)}</span>
                  </div>
                  <div className="financial-item total">
                    <span className="item-label">Remaining Balance</span>
                    <span className="item-value">
                      {formatCurrency((mp.allocatedAmount || mp.totalAllocated || 0) - (mp.totalExpenditure || 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="financial-card">
                <h4>Utilization Metrics</h4>
                <div className="financial-items">
                  <div className="financial-item">
                    <span className="item-label">
                      Fund Utilization
                      {' '}
                      <InfoTooltip 
                        content="Percentage of allocated MPLADS funds that have been disbursed for approved development projects."
                        position="top"
                        size="small"
                      />
                    </span>
                    <span className={`item-value utilization-${getUtilizationClass(mp.utilizationPercentage || 0)}`}>
                      {(mp.utilizationPercentage || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="financial-item">
                    <span className="item-label">Works Completed</span>
                    <span className="item-value">
                      {mp.completedWorksCount || 0}
                    </span>
                  </div>
                  <div className="financial-item">
                    <span className="item-label">Average per Project</span>
                    <span className="item-value">
                      {formatCurrency(projectStats.total > 0 ? (mp.totalExpenditure || 0) / projectStats.total : 0)}
                    </span>
                  </div>
                  <div className="financial-item">
                    <span className="item-label">Completion Rate</span>
                    <span className={`item-value ${completionRate >= 70 ? 'high' : completionRate >= 50 ? 'medium' : 'low'}`}>
                      {completionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="financial-card full-width">
                <h4>Performance Indicators</h4>
                <div className="indicators-grid">
                  <div className="indicator">
                    <div className="indicator-header">
                      <span>
                        Fund Utilization
                        {' '}
                        <InfoTooltip 
                          content="Percentage of allocated MPLADS funds that have been disbursed for approved development projects."
                          position="top"
                          size="small"
                        />
                      </span>
                      <span className={`indicator-status utilization-${getUtilizationClass(mp.utilizationPercentage || 0)}`}>
                        {(mp.utilizationPercentage || 0) >= 70 ? 'Excellent' : (mp.utilizationPercentage || 0) >= 40 ? 'Good' : (mp.utilizationPercentage || 0) >= 20 ? 'Average' : 'Poor'}
                      </span>
                    </div>
                    <div className="indicator-bar">
                      <div 
                        className={`indicator-fill utilization-${getUtilizationClass(mp.utilizationPercentage || 0)}`}
                        style={{ width: `${Math.min(mp.utilizationPercentage || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="indicator">
                    <div className="indicator-header">
                      <span>Project Completion</span>
                      <span className={`indicator-status ${completionRate >= 70 ? 'high' : completionRate >= 50 ? 'medium' : 'low'}`}>
                        {completionRate >= 70 ? 'Excellent' : completionRate >= 50 ? 'Good' : completionRate >= 30 ? 'Average' : 'Poor'}
                      </span>
                    </div>
                    <div className="indicator-bar">
                      <div 
                        className={`indicator-fill ${completionRate >= 70 ? 'utilization-high' : completionRate >= 50 ? 'utilization-medium' : 'utilization-low'}`}
                        style={{ width: `${Math.min(completionRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MPDetail;
