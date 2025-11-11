/**
 * Escape special regex characters to prevent ReDoS attacks
 * @param {string} string - The string to escape
 * @returns {string} - Escaped string safe for regex
 */
const escapeRegex = string => {
  if (!string || typeof string !== 'string') return ''
  // Escape all special regex characters
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Validate and sanitize pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} - Sanitized pagination params
 */
const validatePagination = (page, limit) => {
  const MIN_PAGE = 1
  const MAX_PAGE = 1000
  const MIN_LIMIT = 1
  const MAX_LIMIT = 100
  const DEFAULT_LIMIT = 20

  const sanitizedPage = Math.max(MIN_PAGE, Math.min(MAX_PAGE, parseInt(page) || MIN_PAGE))
  const sanitizedLimit = Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, parseInt(limit) || DEFAULT_LIMIT))

  return {
    page: sanitizedPage,
    limit: sanitizedLimit,
    skip: (sanitizedPage - 1) * sanitizedLimit,
  }
}

/**
 * Validate MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - Whether the ID is valid
 */
const isValidObjectId = id => {
  if (!id || typeof id !== 'string') return false
  // MongoDB ObjectID is 24 hex characters
  return /^[0-9a-fA-F]{24}$/.test(id)
}

module.exports = {
  escapeRegex,
  validatePagination,
  isValidObjectId,
}
