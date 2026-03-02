import { FiFileText, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi'
import './ProjectStatusCards.css'

const ProjectStatusCards = ({ data = {} }) => {
  const { totalRecommended = 0, totalInProgress = 0, totalCompleted = 0 } = data

  const cards = [
    {
      title: 'Recommended',
      value: totalRecommended,
      icon: <FiFileText />,
      color: 'blue',
      percentage: null,
      description: 'Projects recommended by MPs',
    },
    {
      title: 'In Progress',
      value: totalInProgress,
      icon: <FiClock />,
      color: 'orange',
      percentage:
        totalRecommended > 0 ? ((totalInProgress / totalRecommended) * 100).toFixed(1) : 0,
      description: 'Projects awaiting completion',
    },
    {
      title: 'Completed',
      value: totalCompleted,
      icon: <FiCheckCircle />,
      color: 'green',
      percentage: totalRecommended > 0 ? ((totalCompleted / totalRecommended) * 100).toFixed(1) : 0,
      description: 'Projects successfully completed',
    },
  ]

  const formatNumber = num => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  return (
    <div className="project-status-cards">
      <h3 className="status-cards-title">Project Status Overview</h3>
      <div className="status-cards-grid">
        {cards.map((card, index) => (
          <div key={index} className={`status-card status-card-${card.color}`}>
            <div className="status-card-header">
              <div className="status-card-icon">{card.icon}</div>
              {card.percentage !== null && (
                <div className="status-card-percentage">{card.percentage}%</div>
              )}
            </div>
            <div className="status-card-body">
              <h4 className="status-card-title">{card.title}</h4>
              <p className="status-card-value">{formatNumber(card.value)}</p>
              <p className="status-card-description">{card.description}</p>
            </div>
            {card.percentage !== null && (
              <div className="status-card-progress">
                <div
                  className="status-card-progress-bar"
                  style={{ width: `${card.percentage}%` }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectStatusCards
