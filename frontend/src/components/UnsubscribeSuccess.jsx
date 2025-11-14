import { useEffect, useState } from 'react'
import { useLocation, useParams, Link } from 'react-router-dom'
import { FiCheckCircle, FiHome, FiMail, FiLoader } from 'react-icons/fi'
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants/api'
import './UnsubscribeSuccess.css'

const UnsubscribeSuccess = () => {
  const location = useLocation()
  const { token } = useParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If we have a token in the URL, process the unsubscribe
    if (token) {
      handleUnsubscribe(token)
    } else {
      // Otherwise, just get email from query params (redirected from backend)
      const params = new URLSearchParams(location.search)
      const emailParam = params.get('email')
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam))
      }
    }
  }, [location, token])

  const handleUnsubscribe = async (unsubscribeToken) => {
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.MAILING_LIST_UNSUBSCRIBE}/${unsubscribeToken}`
      )

      if (response.ok) {
        const result = await response.json()
        setEmail(result.email || '')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to unsubscribe')
      }
    } catch (err) {
      console.error('Unsubscribe error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="unsubscribe-success">
        <div className="unsubscribe-container">
          <div className="loading-icon">
            <FiLoader />
          </div>
          <h1>Processing Unsubscribe...</h1>
          <p>Please wait while we process your request.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="unsubscribe-success">
        <div className="unsubscribe-container">
          <div className="error-icon">❌</div>
          <h1>Unsubscribe Failed</h1>
          <p className="error-message">{error}</p>
          <div className="action-buttons">
            <Link to="/" className="btn btn-primary">
              <FiHome />
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="unsubscribe-success">
      <div className="unsubscribe-container">
        <div className="success-icon">
          <FiCheckCircle />
        </div>

        <h1>Successfully Unsubscribed</h1>

        {email && (
          <p className="email-confirmation">
            <FiMail />
            {email} has been removed from our mailing list
          </p>
        )}

        <div className="success-content">
          <p>
            You have been successfully unsubscribed from Empowered Indian
            updates.
          </p>
          <p>
            You will no longer receive newsletters or notifications from us.
          </p>
          <p>
            We're sorry to see you go! If you change your mind, you can always
            subscribe again on our website.
          </p>
        </div>

        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            <FiHome />
            Back to Homepage
          </Link>
          <Link to="/mplads" className="btn btn-secondary">
            Explore MPLADS Data
          </Link>
        </div>

        <div className="feedback-section">
          <p className="feedback-text">
            Have feedback about why you unsubscribed?
            <a
              href="https://twitter.com/roshanasingh6"
              target="_blank"
              rel="noopener noreferrer"
            >
              Let us know on Twitter
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default UnsubscribeSuccess
