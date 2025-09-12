import { Link } from 'react-router-dom';
import { FiUser, FiMapPin, FiTrendingUp, FiTrendingDown, FiMinus, FiCheckCircle, FiTarget, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';
import InfoTooltip from '../Common/InfoTooltip';
import './MPCard.css';
import { formatINRCompact } from '../../../../utils/formatters';
import { buildMPSlugHuman, normalizeMPSlug } from '../../../../utils/slug';
import { useFilters } from '../../../../contexts/FilterContext';

const MPCard = ({ mp, rank }) => {
  const formatCurrency = (amount) => formatINRCompact(amount);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const getUtilizationClass = (percentage) => {
    if (percentage >= 70) return 'high';
    if (percentage >= 40) return 'medium';
    return 'low';
  };

  const getUtilizationIcon = (percentage) => {
    if (percentage >= 70) return <FiTrendingUp />;
    if (percentage >= 40) return <FiMinus />;
    return <FiTrendingDown />;
  };

  const hasPaymentGap = (mp) => {
    const completedValue = mp.completedWorksValue || mp.totalCompletedAmount || 0;
    const gap = (mp.totalExpenditure || 0) - completedValue;
    const gapPercentage = mp.totalExpenditure > 0 ? (gap / mp.totalExpenditure * 100) : 0;
    return gapPercentage > 50; // Flag if more than 50% of spending is unaccounted
  };


  const { filters } = useFilters();
  const mpId = mp.id || mp._id;
  const slug = normalizeMPSlug(buildMPSlugHuman(mp, { lsTerm: filters?.lsTerm }));
  // Use utilization percentage as primary metric
  const utilizationPercentage = mp.utilizationPercentage || 0;
  const completionRate = mp.completionRate || 
    ((mp.recommendedWorksCount || 0) > 0 
      ? Math.min(((mp.completedWorksCount || 0) / (mp.recommendedWorksCount || 0)) * 100, 100) 
      : 0);
  const inProgressPayments = mp.inProgressPayments !== undefined ? mp.inProgressPayments : 
    ((mp.totalExpenditure || 0) - (mp.completedWorksValue || mp.totalCompletedAmount || 0));
  const showWarning = hasPaymentGap(mp);

  return (
    <Link to={`/mplads/mps/${encodeURIComponent(slug || String(mpId))}`} className="mp-card">
      <div className="mp-card-header">
        <div className="mp-info">
          <div className="mp-avatar">
            <FiUser />
          </div>
          <div className="mp-details">
            <h3 className="mp-name" title={mp.mpName || mp.name}>{mp.mpName || mp.name}</h3>
            <div className="mp-constituency">
              <FiMapPin />
              <span title={`${mp.constituency}, ${mp.state}`}>{mp.constituency}, {mp.state}</span>
            </div>
            <div className="mp-party-info">
              <span className="house-badge">{mp.house}</span>
            </div>
          </div>
        </div>
        {rank && (
          <div className="mp-rank">
            <span className="rank-number">#{rank}</span>
          </div>
        )}
      </div>

      <div className="mp-stats">
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">Allocated</span>
            <span className="stat-value">{formatCurrency(mp.allocatedAmount || mp.totalAllocated)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Spent</span>
            <span className="stat-value">{formatCurrency(mp.totalExpenditure)}</span>
          </div>
        </div>
        
        {showWarning && (
          <div className="payment-warning">
            <FiAlertTriangle />
            <span>{formatCurrency(inProgressPayments)} paid but work incomplete</span>
          </div>
        )}
        
        <div className="utilization-section">
          <div className="utilization-header">
            <span className="utilization-label">
              Fund Utilization
              {' '}
              <InfoTooltip 
                content="Fund Utilization: Percentage of allocated MPLADS funds that have been disbursed (Expenditure / Allocation × 100). This matches official MPLADS reporting standards."
                position="top"
                size="small"
              />
            </span>
            <div className={`utilization-badge utilization-${getUtilizationClass(utilizationPercentage)}`}>
              {getUtilizationIcon(utilizationPercentage)}
              <span>{utilizationPercentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="utilization-breakdown">
            <div className="breakdown-item">
              <FiDollarSign />
              <span>₹{formatCurrency(mp.totalExpenditure)} of ₹{formatCurrency(mp.allocatedAmount || mp.totalAllocated)} used</span>
            </div>
          </div>
          <div className="utilization-bar">
            <div 
              className={`utilization-fill utilization-${getUtilizationClass(utilizationPercentage)}`}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="works-section">
          <div className="works-stat">
            <FiCheckCircle className="works-icon completed" />
            <span className="works-label">Completed</span>
            <span className="works-count">{formatNumber(mp.completedWorksCount || 0)}</span>
          </div>
          <div className="works-stat">
            <FiTarget className="works-icon recommended" />
            <span className="works-label">Recommended</span>
            <span className="works-count">{formatNumber(mp.recommendedWorksCount || 0)}</span>
          </div>
          <div className="completion-rate">
            <span className="completion-label">Completion Rate</span>
            <span className={`completion-value ${completionRate >= 70 ? 'high' : completionRate >= 50 ? 'medium' : 'low'}`}>
              {completionRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mp-card-footer">
        <span className="view-details">View Details →</span>
      </div>
    </Link>
  );
};

export default MPCard;




















