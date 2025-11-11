const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { cacheMiddleware } = require('../middleware/cache')
const {
  submitFeedback,
  reportDataIssue,
  getFeedbackStats,
  getAllFeedback,
  getAllDataIssues,
  updateFeedbackStatus,
  updateDataIssueStatus,
  deleteFeedback,
  deleteDataIssue,
} = require('../controllers/feedbackController')
const { contentSecurityStack } = require('../middleware/sanitization')
const { userInputLimiter } = require('../middleware/rateLimiting')
const { secureValidation } = require('../middleware/validation')
const { adminAuth } = require('../middleware/auth')

// Enhanced validation middleware for feedback submission
const validateFeedback = [
  body('type')
    .isIn(['bug', 'data_issue', 'feature_request', 'general'])
    .withMessage('Invalid feedback type')
    .escape(),
  body('title')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5-100 characters')
    .matches(/^[a-zA-Z0-9\s._,!?-]+$/)
    .withMessage('Title contains invalid characters')
    .escape(),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10-1000 characters')
    .escape(),
  body('category')
    .isIn(['mp', 'work', 'expenditure', 'general'])
    .withMessage('Invalid category')
    .escape(),
  body('contactEmail')
    .optional({ values: 'falsy' })
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority level')
    .escape(),
]

// Enhanced validation middleware for data issue reporting
const validateDataIssue = [
  body('issueType')
    .isIn(['incorrect_data', 'missing_data', 'outdated_data'])
    .withMessage('Invalid issue type')
    .escape(),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10-1000 characters')
    .escape(),
  body('contactEmail')
    .optional({ values: 'falsy' })
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('relatedData.mp_id').optional().isMongoId().withMessage('Invalid MP ID format'),
  body('relatedData.work_id').optional().isMongoId().withMessage('Invalid work ID format'),
  body('relatedData.expenditure_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid expenditure ID format'),
]

// Apply rate limiting to all feedback routes
router.use(userInputLimiter)

// POST /api/feedback/submit - Submit general feedback
router.post(
  '/submit',
  contentSecurityStack(['description']), // Allow minimal HTML in description
  ...secureValidation('feedback', validateFeedback),
  submitFeedback
)

// POST /api/feedback/report-data-issue - Report data issues
router.post(
  '/report-data-issue',
  contentSecurityStack(['description']),
  ...secureValidation('dataIssue', validateDataIssue),
  reportDataIssue
)

// GET /api/feedback/stats - Get feedback statistics (cached for 1 hour)
router.get('/stats', cacheMiddleware(60 * 60), getFeedbackStats)

// Admin endpoints for managing feedback and data issues
// GET /api/feedback/all - Get all feedback submissions (with pagination) - Admin only
router.get('/all', ...adminAuth, cacheMiddleware(5 * 60), getAllFeedback)

// GET /api/feedback/data-issues - Get all data issues (with pagination) - Admin only
router.get('/data-issues', ...adminAuth, cacheMiddleware(5 * 60), getAllDataIssues)

// PATCH /api/feedback/:id/status - Update feedback status - Admin only
router.patch(
  '/:id/status',
  ...adminAuth,
  contentSecurityStack([]),
  body('status')
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Invalid status value')
    .escape(),
  updateFeedbackStatus
)

// PATCH /api/feedback/data-issue/:id/status - Update data issue status - Admin only
router.patch(
  '/data-issue/:id/status',
  ...adminAuth,
  contentSecurityStack([]),
  body('status')
    .isIn(['reported', 'investigating', 'fixed', 'invalid'])
    .withMessage('Invalid status value')
    .escape(),
  updateDataIssueStatus
)

// DELETE /api/feedback/:id - Delete feedback - Admin only
router.delete('/:id', ...adminAuth, deleteFeedback)

// DELETE /api/feedback/data-issue/:id - Delete data issue - Admin only
router.delete('/data-issue/:id', ...adminAuth, deleteDataIssue)

module.exports = router
