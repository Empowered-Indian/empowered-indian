import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

/**
 * Centralized error handling utilities for consistent user feedback
 */

// Error type constants
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  PERMISSION: 'PERMISSION_ERROR'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Extract user-friendly error message from error object
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  
  // HTTP status code messages
  if (error?.response?.status === 404) return 'The requested data was not found.';
  if (error?.response?.status === 403) return 'You don\'t have permission to access this data.';
  if (error?.response?.status === 500) return 'Server error. Please try again later.';
  if (error?.response?.status === 503) return 'Service temporarily unavailable. Please try again later.';
  if (error?.response?.status >= 400 && error?.response?.status < 500) return 'Invalid request. Please check your input.';
  
  // Network and timeout errors
  if (error?.code === 'NETWORK_ERROR') return 'Network connection error. Please check your internet connection.';
  if (error?.code === 'TIMEOUT_ERROR') return 'Request timed out. Please try again.';
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Determine error type from error object
 */
export const getErrorType = (error) => {
  if (error?.code === 'NETWORK_ERROR') return ERROR_TYPES.NETWORK;
  if (error?.response?.status === 404) return ERROR_TYPES.NOT_FOUND;
  if (error?.response?.status === 403) return ERROR_TYPES.PERMISSION;
  if (error?.response?.status >= 500) return ERROR_TYPES.SERVER;
  if (error?.response?.status >= 400) return ERROR_TYPES.VALIDATION;
  if (error?.code === 'TIMEOUT_ERROR') return ERROR_TYPES.TIMEOUT;
  
  return ERROR_TYPES.SERVER; // default
};

/**
 * Determine error severity
 */
export const getErrorSeverity = (error) => {
  const errorType = getErrorType(error);
  
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
    case ERROR_TYPES.SERVER:
      return ERROR_SEVERITY.HIGH;
    case ERROR_TYPES.NOT_FOUND:
    case ERROR_TYPES.PERMISSION:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_TYPES.VALIDATION:
    case ERROR_TYPES.TIMEOUT:
      return ERROR_SEVERITY.LOW;
    default:
      return ERROR_SEVERITY.MEDIUM;
  }
};

/**
 * Get contextual suggestions based on error type
 */
export const getErrorSuggestions = (error) => {
  const errorType = getErrorType(error);
  
  const suggestions = [];

  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      suggestions.push('Check your internet connection');
      suggestions.push('Try disabling VPN if you\'re using one');
      suggestions.push('Wait a moment and try again');
      break;
      
    case ERROR_TYPES.NOT_FOUND:
      suggestions.push('The data may have been moved or deleted');
      suggestions.push('Try searching for similar information');
      suggestions.push('Go back and try a different option');
      break;
      
    case ERROR_TYPES.SERVER:
      suggestions.push('Wait a few minutes and try again');
      suggestions.push('If the problem persists, contact support');
      break;
      
    case ERROR_TYPES.TIMEOUT:
      suggestions.push('Try again with fewer filters');
      suggestions.push('Use a smaller date range');
      suggestions.push('Check your network connection');
      break;
      
    case ERROR_TYPES.VALIDATION:
      suggestions.push('Check your input for errors');
      suggestions.push('Try different search terms');
      suggestions.push('Clear filters and try again');
      break;
      
    case ERROR_TYPES.PERMISSION:
      suggestions.push('Log in to access this data');
      suggestions.push('Contact administrator for access');
      break;
      
    default:
      suggestions.push('Refresh the page and try again');
      suggestions.push('Clear your browser cache');
  }

  return suggestions;
};

/**
 * Show error toast notification with appropriate styling
 */
export const showErrorToast = (error, options = {}) => {
  const message = getErrorMessage(error);
  const severity = getErrorSeverity(error);
  
  const toastOptions = {
    duration: severity === ERROR_SEVERITY.HIGH ? 6000 : 4000,
    position: 'top-right',
    style: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      borderRadius: '8px',
      fontSize: '14px',
      maxWidth: '400px',
      ...options.style
    },
    iconTheme: {
      primary: '#dc2626',
      secondary: '#fef2f2'
    },
    ...options
  };

  return toast.error(message, toastOptions);
};

/**
 * Show success toast notification
 */
export const showSuccessToast = (message, options = {}) => {
  const toastOptions = {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      color: '#166534',
      borderRadius: '8px',
      fontSize: '14px',
      ...options.style
    },
    iconTheme: {
      primary: '#16a34a',
      secondary: '#f0fdf4'
    },
    ...options
  };

  return toast.success(message, toastOptions);
};

/**
 * Show info toast notification
 */
export const showInfoToast = (message, options = {}) => {
  const toastOptions = {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      color: '#1e40af',
      borderRadius: '8px',
      fontSize: '14px',
      ...options.style
    },
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#eff6ff'
    },
    ...options
  };

  return toast(message, toastOptions);
};

/**
 * Show loading toast notification
 */
export const showLoadingToast = (message = 'Loading...', options = {}) => {
  const toastOptions = {
    duration: Infinity, // Keep until dismissed
    position: 'top-right',
    style: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      color: '#475569',
      borderRadius: '8px',
      fontSize: '14px',
      ...options.style
    },
    ...options
  };

  return toast.loading(message, toastOptions);
};

/**
 * Dismiss toast by ID
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * React Query error handler
 */
export const handleQueryError = (error, context = '') => {
  console.error(`Query Error ${context}:`, error);
  
  // Don't show toast for 404s on optional data
  if (error?.response?.status === 404 && context.includes('optional')) {
    return;
  }
  
  showErrorToast(error, {
    id: `query-error-${context}`, // Prevent duplicate toasts
  });
};

/**
 * Mutation error handler with retry option
 */
export const handleMutationError = (error, retry = null, context = '') => {
  console.error(`Mutation Error ${context}:`, error);
  
  const message = getErrorMessage(error);
  const severity = getErrorSeverity(error);
  
  if (retry && severity !== ERROR_SEVERITY.CRITICAL) {
    toast.error(
      (t) => (
        <div>
          <div style={{ marginBottom: '8px' }}>{message}</div>
          <Button
            variant="destructive"
            onClick={() => {
              toast.dismiss(t.id);
              retry();
            }}
            style={{
              padding: '4px 8px',
              fontSize: '12px'
            }}
          >
            Try Again
          </Button>
        </div>
      ),
      {
        duration: 8000,
        id: `mutation-error-${context}`,
      }
    );
  } else {
    showErrorToast(error, {
      id: `mutation-error-${context}`,
    });
  }
};