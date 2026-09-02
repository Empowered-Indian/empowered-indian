import { Link } from 'react-router-dom'
import {
  FiUser,
  FiMapPin,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiCheckCircle,
  FiTarget,
  FiAlertTriangle,
  FiDollarSign,
} from 'react-icons/fi'
import InfoTooltip from '../Common/InfoTooltip'
import './MPCard.css'
import { formatINRCompact } from '../../../../utils/formatters'
import { buildMPSlugHuman, normalizeMPSlug } from '../../../../utils/slug'
import { useFilters } from '../../../../contexts/FilterContext'

const MPCard = ({ mp, rank = null }) => {
  const formatCurrency = amount => formatINRCompact(amount)

  const formatNumber = num => {
    return new Intl.NumberFormat('en-IN').format(num || 0)
  }

  const getUtilizationClass = percentage => {
    if (percentage >= 70) return 'high'
    if (percentage >= 40) return 'medium'
    return 'low'
  }

  const getUtilizationIcon = percentage => {
    if (percentage >= 70) return <FiTrendingUp />
    if (percentage >= 40) return <FiMinus />
    return <FiTrendingDown />
  }

  const { filters } = useFilters()
  const mpId = mp.id || mp._id
  const slug = normalizeMPSlug(buildMPSlugHuman(mp, { lsTerm: filters?.lsTerm }))
  // Use utilization percentage as primary metric
  const utilizationPercentage = mp.utilizationPercentage || 0
  const completionRate =
    mp.completionRate ||
    ((mp.recommendedWorksCount || 0) > 0
      ? Math.min(((mp.completedWorksCount || 0) / (mp.recommendedWorksCount || 0)) * 100, 100)
      : 0)
  const inProgressPayments =
    mp.inProgressPayments !== undefined
      ? mp.inProgressPayments
      : (mp.totalExpenditure || 0) - (mp.completedWorksValue || mp.totalCompletedAmount || 0)
  const showWarning =
    (mp.totalExpenditure || 0) > 0 &&
    Math.max(inProgressPayments, 0) / (mp.totalExpenditure || 0) > 0.5

  return (
    <Link to={`/mplads/mps/${encodeURIComponent(slug || String(mpId))}`} className="mp-card">
      <div className="mp-card-header">
        <div className="mp-info">
          <div className="mp-avatar">
            <FiUser />
          </div>
          <div className="mp-details">
            <h3 className="mp-name" title={mp.mpName || mp.name}>
              {mp.mpName || mp.name}
            </h3>
            <div className="mp-constituency">
              <FiMapPin />
              <span title={`${mp.constituency}, ${mp.state}`}>
                {mp.constituency}, {mp.state}
              </span>
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
            <span className="stat-value">
              {formatCurrency(mp.allocatedAmount || mp.totalAllocated)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Recorded expenditure</span>
            <span className="stat-value">{formatCurrency(mp.totalExpenditure)}</span>
          </div>
        </div>

        {showWarning && (
          <div className="payment-warning">
            <FiAlertTriangle />
            <span>{formatCurrency(inProgressPayments)} recorded on ongoing works</span>
          </div>
        )}

        <div className="utilization-section">
          <div className="utilization-header">
            <span className="utilization-label">
              {mp.utilizationDefinition === 'vendor_expenditure_legacy'
                ? 'Expenditure Rate'
                : 'Fund Utilization'}{' '}
              <InfoTooltip
                content={
                  mp.utilizationDefinition === 'vendor_expenditure_legacy'
                    ? 'Legacy snapshot: recorded vendor expenditure divided by allocation. Recommendation-based utilization is being refreshed.'
                    : 'MoSPI MP fund utilization: recommended amount divided by allocated amount. Vendor-payment expenditure is shown separately.'
                }
                position="top"
                size="small"
              />
            </span>
            <div
              className={`utilization-badge utilization-${getUtilizationClass(utilizationPercentage)}`}
            >
              {getUtilizationIcon(utilizationPercentage)}
              <span>{utilizationPercentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="utilization-breakdown">
            <div className="breakdown-item">
              <FiDollarSign />
              {mp.utilizationDefinition === 'vendor_expenditure_legacy' ? (
                <span>
                  ₹{formatCurrency(mp.totalExpenditure)} of ₹
                  {formatCurrency(mp.allocatedAmount || mp.totalAllocated)} paid to vendors
                </span>
              ) : (
                <span>
                  ₹{formatCurrency(mp.totalRecommendedAmount)} of ₹
                  {formatCurrency(mp.allocatedAmount || mp.totalAllocated)} recommended
                </span>
              )}
            </div>
            <div className="breakdown-item">
              <FiDollarSign />
              <span>
                {mp.utilizationDefinition === 'vendor_expenditure_legacy'
                  ? 'Recommendation metrics refreshing'
                  : `${mp.expenditurePercentage?.toFixed(1) || 0}% recorded expenditure rate`}
              </span>
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
            <span
              className={`completion-value ${completionRate >= 70 ? 'high' : completionRate >= 50 ? 'medium' : 'low'}`}
            >
              {completionRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mp-card-footer">
        <span className="view-details">View Details →</span>
      </div>
    </Link>
  )
}

export default MPCard
