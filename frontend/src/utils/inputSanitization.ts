import { useState } from 'react'

/**
 * Input sanitization utilities for secure and consistent user input handling
 * Based on the successful fix applied to SearchBar component
 */

/**
 * Sanitizes user input by removing dangerous characters while preserving normal text and spaces
 * @param {string} value - The input value to sanitize
 * @param {Object} options - Optional configuration
 * @param {number} options.maxLength - Maximum allowed length (default: 100)
 * @param {boolean} options.preserveSpaces - Whether to preserve spaces during typing (default: true)
 * @returns {string} - Sanitized input value
 */
export const sanitizeInput = (value, options = {}) => {
  if (typeof value !== 'string') return ''

  const { maxLength = 100, preserveSpaces = true } = options

  let sanitized = value
    // Remove dangerous HTML characters
    .replace(/[<>]/g, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers like onclick, onload, etc.
    .replace(/on\w+\s*=/gi, '')
    // Remove script tags/content
    .replace(/script/gi, '')
    // Limit length
    .slice(0, maxLength)

  if (preserveSpaces) {
    // Don't trim spaces during typing - only collapse multiple consecutive spaces
    sanitized = sanitized.replace(/\s{2,}/g, ' ')
  } else {
    // Trim spaces (use for final submission)
    sanitized = sanitized.trim()
  }

  return sanitized
}

/**
 * Sanitizes input for submission (trims spaces and applies all sanitization)
 * @param {string} value - The input value to sanitize
 * @param {Object} options - Optional configuration
 * @returns {string} - Sanitized and trimmed input value ready for submission
 */
export const sanitizeForSubmission = (value, options = {}) => {
  return sanitizeInput(value, { ...options, preserveSpaces: false })
}

/**
 * Sanitizes email input with email-specific rules
 * @param {string} value - The email input value to sanitize
 * @returns {string} - Sanitized email value
 */
export const sanitizeEmail = value => {
  if (typeof value !== 'string') return ''

  return (
    value
      // Remove dangerous characters
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/script/gi, '')
      // Remove spaces (emails shouldn't have spaces)
      .replace(/\s/g, '')
      // Limit length for emails
      .slice(0, 254)
  ) // RFC 5321 limit
}

/**
 * Custom hook for managing sanitized input state
 * @param {string} initialValue - Initial input value
 * @param {Object} options - Sanitization options
 * @returns {Array} - [value, setValue, sanitizedValue, handleChange]
 */
export const useSanitizedInput = (initialValue = '', options = {}) => {
  const [value, setValue] = useState(initialValue)

  const handleChange = e => {
    const newValue = sanitizeInput(e.target.value, options)
    setValue(newValue)
  }

  const sanitizedValue = sanitizeForSubmission(value, options)

  return [value, setValue, sanitizedValue, handleChange]
}

// Legacy function names for backward compatibility
export const sanitize = sanitizeInput
export const sanitizeForSearch = sanitizeForSubmission
