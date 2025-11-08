import { Link } from 'react-router-dom'
import { FiUsers, FiTrendingUp, FiCheckCircle, FiMapPin, FiInfo } from 'react-icons/fi'
import InfoTooltip from '../Common/InfoTooltip'
import './StateCard.css'
import { formatINRCompact } from '../../../../utils/formatters'

const StateCard = ({ state }) => {
  // Extract data from state object with proper fallbacks
  const name = state.name || state.state || 'Unknown State'
  const totalMPs = state.totalMPs || state.mpCount || 0
  const totalAllocated = state.totalAllocated || 0
  const totalExpenditure = state.totalExpenditure || 0
  const utilizationPercentage = state.utilizationPercentage || 0
  const totalWorksCompleted = state.totalWorksCompleted || state.completedWorksCount || 0
  const totalWorksRecommended = state.totalWorksRecommended || state.recommendedWorksCount || 0
  const rank = state.rank || 0
  const totalStates = state.totalStates || 0

  const formatCurrency = amount => formatINRCompact(amount)

  const formatNumber = num => {
    return new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(num || 0)
  }

  const getUtilizationClass = percentage => {
    if (percentage >= 90) return 'high'
    if (percentage >= 70) return 'medium'
    return 'low'
  }

  const completionRate =
    totalWorksRecommended > 0 ? ((totalWorksCompleted / totalWorksRecommended) * 100).toFixed(1) : 0

  const stateName = name || 'Unknown State'
  const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-')

  return (
    <Link to={`/mplads/states/${stateSlug}`} className="state-card">
      <div className="state-card-header">
        <div className="state-info">
          <h3 className="state-name" title={stateName}>
            {stateName}
          </h3>
          <div className="state-meta">
            <span className="state-mps">
              <FiUsers />
              {totalMPs} MPs
              <InfoTooltip
                content="Includes current and recent MPs with active MPLADS projects. Count may exceed current parliamentary seats due to ongoing multi-year projects from previous terms."
                position="top"
                size="small"
                usePortal={true}
              />
            </span>
            {rank > 0 && (
              <span className="state-rank">
                Rank #{rank} of {totalStates}
              </span>
            )}
          </div>
        </div>
        <div className="state-icon">
          <FiMapPin />
        </div>
      </div>

      <div className="state-metrics">
        <div className="metric-row">
          <div className="metric">
            <span className="metric-label">Allocated</span>
            <span className="metric-value">{formatCurrency(totalAllocated)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Utilized</span>
            <span className="metric-value">{formatCurrency(totalExpenditure)}</span>
          </div>
        </div>

        <div className="utilization-section">
          <div className="utilization-header">
            <span className="utilization-label">Fund Utilization</span>
            <span
              className={`utilization-value utilization-${getUtilizationClass(utilizationPercentage)}`}
            >
              <FiTrendingUp />
              {utilizationPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="utilization-bar">
            <div
              className={`utilization-fill utilization-${getUtilizationClass(utilizationPercentage)}`}
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
        </div>

        <div className="works-section">
          <div className="works-stat">
            <FiCheckCircle className="works-icon" />
            <div className="works-info">
              <span className="works-value">{formatNumber(totalWorksCompleted)}</span>
              <span className="works-label">Works Completed</span>
            </div>
          </div>
          <div className="completion-rate">
            <span className="rate-label">Completion</span>
            <span className="rate-value">{completionRate}%</span>
          </div>
        </div>
      </div>

      <div className="state-card-footer">
        <span className="view-details">View Details →</span>
      </div>
    </Link>
  )
}

export default StateCard
