import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi'
import { verifyEmail } from '../services/api/mailingList'
import './EmailVerification.css'

const EmailVerification = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const token = searchParams.get('token')
  const hasVerified = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. Token is missing.')
      return
    }

    // Prevent multiple API calls
    if (hasVerified.current) {
      return
    }

    const handleVerification = async () => {
      try {
        hasVerified.current = true
        console.log('Starting email verification with token:', token)
        const response = await verifyEmail(token)
        console.log('Verification response:', response)
        setStatus('success')
        setMessage(response.message || 'Email verified successfully!')
      } catch (error) {
        console.error('Verification error:', error)
        console.error('Error response:', error.response)
        setStatus('error')
        setMessage(
          error.response?.data?.message ||
            error.response?.data?.error ||
            'Verification failed. The link may be invalid or expired.'
        )
      }
    }

    handleVerification()
  }, [token])

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="verification-content loading">
            <FiLoader className="icon spinning" />
            <h2>Verifying your email...</h2>
            <p>Please wait while we verify your email address.</p>
          </div>
        )

      case 'success':
        return (
          <div className="verification-content success">
            <FiCheckCircle className="icon" />
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <p>
              You're now subscribed to our mailing list and will receive updates about MPLADS data
              and features.
            </p>
          </div>
        )

      case 'error':
        return (
          <div className="verification-content error">
            <FiXCircle className="icon" />
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <p>
              If you continue to have issues, please contact our support team at{' '}
              <a href="mailto:roshan@empoweredindian.in">roshan@empoweredindian.in</a>.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="verification-page">
      <div className="verification-container">
        {renderContent()}
        <div className="verification-actions">
          <Link to="/" className="btn-primary">
            Return to Home
          </Link>
          <Link to="/mplads" className="btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default EmailVerification
