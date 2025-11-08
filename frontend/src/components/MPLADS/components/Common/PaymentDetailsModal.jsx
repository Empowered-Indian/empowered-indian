import { useState, useEffect } from 'react'
import { FiCalendar, FiCreditCard, FiCheckCircle, FiClock, FiInfo } from 'react-icons/fi'
import { worksAPI } from '../../../../services/api'
import { formatINRCompact } from '../../../../utils/formatters'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import './PaymentDetailsModal.css'

const PaymentDetailsModal = ({ workId, recommendationId, workDescription, onClose }) => {
  const [paymentData, setPaymentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true)
        let response
        if (workId) {
          response = await worksAPI.getWorkPayments(workId)
        } else if (recommendationId) {
          response = await worksAPI.getRecommendationPayments(recommendationId)
        }
        setPaymentData(response.data)
      } catch (err) {
        setError(err.message || 'Failed to load payment details')
      } finally {
        setLoading(false)
      }
    }

    if (workId || recommendationId) {
      fetchPaymentDetails()
    }
  }, [workId, recommendationId])

  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          <div className="payment-modal-body">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading payment details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !paymentData) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          <div className="payment-modal-body">
            <div className="error-state">
              <FiInfo />
              <p>{error || 'No payment data available for this work'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription className="sr-only">
            Detailed payment information for{' '}
            {workDescription || paymentData.workDetails.description}
          </DialogDescription>
        </DialogHeader>

        <div className="payment-modal-body">
          {/* Work Info */}
          <div className="work-info">
            <h4>Work Information</h4>
            <p className="work-description">
              {workDescription || paymentData.workDetails.description}
            </p>
            <div className="work-meta">
              <span>
                <strong>MP:</strong> {paymentData.workDetails.mpName}
              </span>
              <span>
                <strong>Constituency:</strong> {paymentData.workDetails.constituency}
              </span>
              <span>
                <strong>Work ID:</strong> {paymentData.workId}
              </span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="payment-summary">
            <h4>Payment Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <FiCreditCard className="summary-icon" />
                <div>
                  <span className="summary-label">Total Installments</span>
                  <span className="summary-value">{paymentData.summary.totalInstallments}</span>
                </div>
              </div>
              <div className="summary-item">
                <FiCheckCircle className="summary-icon success" />
                <div>
                  <span className="summary-label">Total Amount Paid</span>
                  <span className="summary-value">
                    {formatINRCompact(paymentData.summary.totalAmountPaid)}
                  </span>
                </div>
              </div>
              <div className="summary-item">
                <FiCheckCircle className="summary-icon success" />
                <div>
                  <span className="summary-label">Successful Payments</span>
                  <span className="summary-value">{paymentData.summary.successfulPayments}</span>
                </div>
              </div>
              {paymentData.summary.pendingPayments > 0 && (
                <div className="summary-item">
                  <FiClock className="summary-icon pending" />
                  <div>
                    <span className="summary-label">Pending Payments</span>
                    <span className="summary-value">{paymentData.summary.pendingPayments}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="payment-timeline">
            <h4>Payment Timeline</h4>
            <div className="timeline-container">
              {paymentData.paymentTimeline.map((timelineItem, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-date">
                    <FiCalendar />
                    <span>{formatDate(timelineItem.date)}</span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-summary">
                      <span className="payment-count">
                        {timelineItem.count} payment{timelineItem.count > 1 ? 's' : ''}
                      </span>
                      <span className="payment-amount">
                        {formatINRCompact(timelineItem.totalAmount)}
                      </span>
                    </div>
                    {timelineItem.count <= 5 && (
                      <div className="timeline-details">
                        {timelineItem.payments.map((payment, payIndex) => (
                          <div key={payIndex} className="payment-detail">
                            <span className="payment-amount-small">
                              {formatINRCompact(payment.amount)}
                            </span>
                            <span
                              className={`payment-status ${payment.status.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              {payment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {timelineItem.count > 5 && (
                      <div className="timeline-note">
                        Multiple payments on this date - {timelineItem.count} total
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Period */}
          <div className="payment-period">
            <div className="period-item">
              <strong>First Payment:</strong> {formatDate(paymentData.summary.firstPaymentDate)}
            </div>
            <div className="period-item">
              <strong>Latest Payment:</strong> {formatDate(paymentData.summary.lastPaymentDate)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentDetailsModal
