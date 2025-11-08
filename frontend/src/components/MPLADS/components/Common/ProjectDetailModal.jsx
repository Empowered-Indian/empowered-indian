import { useState, useEffect, useCallback } from 'react'
import {
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiFileText,
  FiStar,
  FiClock,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi'
import { API_BASE_URL } from '../../../../utils/constants/api'
import { useResponsive } from '../../../../hooks/useMediaQuery'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import './ProjectDetailModal.css'

const ProjectDetailModal = ({ isOpen, onClose, workId, workType = 'completed' }) => {
  const [workData, setWorkData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [_isClosing, setIsClosing] = useState(false)
  const responsive = useResponsive()

  const fetchWorkDetails = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint =
        workType === 'completed'
          ? `${API_BASE_URL}/works/completed/${workId}`
          : `${API_BASE_URL}/works/recommended/${workId}`

      const response = await fetch(endpoint)
      const result = await response.json()

      if (result.success) {
        setWorkData(result.data)
      } else {
        throw new Error(result.message || 'Failed to fetch work details')
      }
    } catch (error) {
      console.error('Error fetching work details:', error)
      setError('Failed to load project details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [workId, workType])

  useEffect(() => {
    if (isOpen && workId) {
      fetchWorkDetails()
    }
  }, [isOpen, workId, fetchWorkDetails])

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <FiCheck className="status-icon completed" />
      case 'in-progress':
      case 'in progress':
        return <FiClock className="status-icon in-progress" />
      case 'recommended':
        return <FiFileText className="status-icon recommended" />
      default:
        return <FiAlertCircle className="status-icon pending" />
    }
  }

  const getStatusClass = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'completed'
      case 'in-progress':
      case 'in progress':
        return 'in-progress'
      case 'recommended':
        return 'recommended'
      default:
        return 'pending'
    }
  }

  const handleClose = useCallback(() => {
    if (responsive.isMobile) {
      setIsClosing(true)
      setTimeout(() => {
        onClose?.()
        setIsClosing(false)
      }, 250) // Match CSS animation duration
    } else {
      onClose?.()
    }
  }, [responsive.isMobile, onClose])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Project Details</DialogTitle>
          <DialogDescription className="sr-only">
            Detailed information about the {workType} project
          </DialogDescription>
        </DialogHeader>

        <div className="modal-content overflow-y-auto max-h-[calc(90vh-100px)] px-6 pb-6">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading project details...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <FiAlertCircle size={48} />
              <p>{error}</p>
              <Button
                variant="default"
                className="retry-button bg-blue-600 text-white hover:bg-blue-700"
                onClick={fetchWorkDetails}
              >
                Try Again
              </Button>
            </div>
          ) : workData ? (
            <div className="project-details">
              {/* Project Header */}
              <div className="project-header">
                <div className="project-title-section">
                  <h3>{workData.work_description}</h3>
                  <div className="project-meta">
                    <span className="work-id">ID: {workData.work_id}</span>
                    <span className={`status-badge ${getStatusClass(workData.status)}`}>
                      {getStatusIcon(workData.status)}
                      {workType === 'completed' ? 'Completed' : workData.status || 'Recommended'}
                    </span>
                  </div>
                </div>
                <div className="project-amount">
                  <span className="amount-label">
                    {workType === 'completed' ? 'Final Amount' : 'Estimated Cost'}
                  </span>
                  <span className="amount-value">
                    {formatCurrency(workData.cost || workData.estimated_cost)}
                  </span>
                </div>
              </div>

              {/* Project Info Grid */}
              <div className="project-info-grid">
                <div className="info-section">
                  <h4>
                    <FiMapPin /> Location Details
                  </h4>
                  <div className="info-content">
                    <div className="info-item">
                      <span className="info-label">Location:</span>
                      <span className="info-value">{workData.location}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">District:</span>
                      <span className="info-value">{workData.district}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">State:</span>
                      <span className="info-value">{workData.state}</span>
                    </div>
                    {workData.gps_coordinates?.latitude && (
                      <div className="info-item">
                        <span className="info-label">GPS:</span>
                        <span className="info-value">
                          {workData.gps_coordinates.latitude.toFixed(6)},{' '}
                          {workData.gps_coordinates.longitude.toFixed(6)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="info-section">
                  <h4>
                    <FiUser /> MP Information
                  </h4>
                  <div className="info-content">
                    <div className="info-item">
                      <span className="info-label">MP Name:</span>
                      <span className="info-value">{workData.mp_details?.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Constituency:</span>
                      <span className="info-value">{workData.mp_details?.constituency}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">House:</span>
                      <span className="info-value">{workData.mp_details?.house}</span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h4>
                    <FiFileText /> Project Information
                  </h4>
                  <div className="info-content">
                    <div className="info-item">
                      <span className="info-label">Category:</span>
                      <span className="info-value">{workData.category}</span>
                    </div>
                    {workData.implementing_agency && (
                      <div className="info-item">
                        <span className="info-label">Implementing Agency:</span>
                        <span className="info-value">{workData.implementing_agency}</span>
                      </div>
                    )}
                    {workData.priority && (
                      <div className="info-item">
                        <span className="info-label">Priority:</span>
                        <span className="info-value">{workData.priority}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="info-section">
                  <h4>
                    <FiCalendar /> Timeline
                  </h4>
                  <div className="info-content">
                    {workType === 'completed' ? (
                      <>
                        <div className="info-item">
                          <span className="info-label">Completion Date:</span>
                          <span className="info-value">{formatDate(workData.completion_date)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Completion Year:</span>
                          <span className="info-value">{workData.completion_year}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="info-item">
                          <span className="info-label">Recommendation Date:</span>
                          <span className="info-value">
                            {formatDate(workData.recommended_date)}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Recommended Year:</span>
                          <span className="info-value">{workData.recommended_year}</span>
                        </div>
                        {workData.expected_completion_date && (
                          <div className="info-item">
                            <span className="info-label">Expected Completion:</span>
                            <span className="info-value">
                              {formatDate(workData.expected_completion_date)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Beneficiaries and Impact */}
              {(workData.beneficiaries ||
                workData.expected_beneficiaries ||
                workData.impact_metrics) && (
                <div className="impact-section">
                  <h4>Impact & Beneficiaries</h4>
                  <div className="impact-grid">
                    {(workData.beneficiaries || workData.expected_beneficiaries) && (
                      <div className="impact-item">
                        <span className="impact-label">Beneficiaries:</span>
                        <span className="impact-value">
                          {(
                            workData.beneficiaries || workData.expected_beneficiaries
                          ).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    {workData.impact_metrics?.schools_connected && (
                      <div className="impact-item">
                        <span className="impact-label">Schools Connected:</span>
                        <span className="impact-value">
                          {workData.impact_metrics.schools_connected}
                        </span>
                      </div>
                    )}

                    {workData.impact_metrics?.roads_length_km && (
                      <div className="impact-item">
                        <span className="impact-label">Roads Length:</span>
                        <span className="impact-value">
                          {workData.impact_metrics.roads_length_km} km
                        </span>
                      </div>
                    )}

                    {workData.impact_metrics?.water_connections && (
                      <div className="impact-item">
                        <span className="impact-label">Water Connections:</span>
                        <span className="impact-value">
                          {workData.impact_metrics.water_connections}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quality Rating for completed works */}
              {workType === 'completed' && workData.quality_rating && (
                <div className="quality-section">
                  <h4>
                    <FiStar /> Quality Rating
                  </h4>
                  <div className="rating-display">
                    <span className="rating-value">{workData.quality_rating.toFixed(1)}</span>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <FiStar
                          key={star}
                          className={star <= workData.quality_rating ? 'star-filled' : 'star-empty'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Expenditure Summary for completed works */}
              {workType === 'completed' && workData.expenditure_summary && (
                <div className="expenditure-section">
                  <h4>
                    <FiDollarSign /> Expenditure Summary
                  </h4>
                  <div className="expenditure-grid">
                    <div className="expenditure-item">
                      <span className="expenditure-label">Total Expenditure:</span>
                      <span className="expenditure-value">
                        {formatCurrency(workData.expenditure_summary.total_expenditure)}
                      </span>
                    </div>
                    <div className="expenditure-item">
                      <span className="expenditure-label">Payment Count:</span>
                      <span className="expenditure-value">
                        {workData.expenditure_summary.payment_count}
                      </span>
                    </div>
                    {workData.expenditure_summary.last_payment_date && (
                      <div className="expenditure-item">
                        <span className="expenditure-label">Last Payment:</span>
                        <span className="expenditure-value">
                          {formatDate(workData.expenditure_summary.last_payment_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectDetailModal
