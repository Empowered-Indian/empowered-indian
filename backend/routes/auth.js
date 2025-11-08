const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  login, 
  register, 
  getProfile, 
  logout, 
  verifyToken 
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { contentSecurityStack } = require('../middleware/sanitization');
const { strictLimiter } = require('../middleware/rateLimiting');

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

// Registration validation
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
];

// Apply rate limiting to auth routes
router.use(strictLimiter);

// POST /api/auth/login - User login
router.post('/login', 
  contentSecurityStack([]),
  ...validateLogin,
  login
);

// POST /api/auth/register - User registration
router.post('/register',
  contentSecurityStack([]),
  ...validateRegister,
  register
);

// GET /api/auth/profile - Get current user profile
router.get('/profile', authenticateToken, getProfile);

// POST /api/auth/logout - User logout
router.post('/logout', logout);

// GET /api/auth/verify - Verify token
router.get('/verify', authenticateToken, verifyToken);

module.exports = router;