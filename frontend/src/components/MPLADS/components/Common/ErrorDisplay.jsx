import { FiAlertCircle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './ErrorDisplay.css';

const ErrorDisplay = ({
  error,
  onRetry,
  title = 'Something went wrong',
  showHomeButton = true,
  customActions = null
}) => {
  const navigate = useNavigate();

  // Extract error message
  const getErrorMessage = () => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.response?.status === 404) return 'The requested data was not found.';
    if (error?.response?.status === 500) return 'Server error. Please try again later.';
    if (error?.response?.status === 503) return 'Service temporarily unavailable. Please try again later.';
    if (error?.code === 'NETWORK_ERROR') return 'Network connection error. Please check your internet connection.';
    return 'An unexpected error occurred. Please try again.';
  };

  // Get error suggestions based on error type
  const getErrorSuggestions = () => {
    const message = getErrorMessage().toLowerCase();
    const suggestions = [];
    if (message.includes('network') || message.includes('connection')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try disabling VPN if you\'re using one');
    } else if (message.includes('not found') || error?.response?.status === 404) {
      suggestions.push('The data may have been moved or deleted');
      suggestions.push('Try searching for similar data');
    } else if (message.includes('server') || error?.response?.status >= 500) {
      suggestions.push('Wait a few minutes and try again');
      suggestions.push('If the problem persists, contact support');
    } else if (message.includes('timeout')) {
      suggestions.push('The server is taking too long to respond');
      suggestions.push('Try again with fewer filters or a smaller date range');
    }

    if (suggestions.length === 0) {
      suggestions.push('Refresh the page and try again');
      suggestions.push('Clear your browser cache');
    }
    return suggestions;
  };

  return (
    <div className="error-display">
      <div className="error-icon">
        <FiAlertCircle />
      </div>
      <h2 className="error-title">{title}</h2>
      <p className="error-message">{getErrorMessage()}</p>
      <div className="error-suggestions">
        <h3>What you can try:</h3>
        <ul>
          {getErrorSuggestions().map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      </div>

      <div className="error-action">
        {onRetry && (
          <button
            onClick={onRetry}
            aria-label="Retry loading data"
          >
            <FiRefreshCw />
            Try Again
          </button>
        )}

        {showHomeButton && (
          <button
            className='dashboard-button'
            onClick={() => navigate('/mplads')}
            aria-label="Go to homepage"
          >
            <FiHome />
            Go to Dashboard
          </button>
        )}
        {customActions}
      </div>

      {import.meta.env.DEV && error?.stack && (
        <details className="error-details">
          <summary>Technical Details</summary>
          <pre>{error.stack}</pre>
        </details>
      )}
    </div>
  );
};

export default ErrorDisplay;