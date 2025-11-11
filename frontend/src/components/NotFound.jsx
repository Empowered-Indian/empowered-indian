import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <h1 className="not-found-code">404</h1>
          <h2 className="not-found-title">Page Not Found</h2>
          <p className="not-found-message">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/" className="not-found-button">
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
