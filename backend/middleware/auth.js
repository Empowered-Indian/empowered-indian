const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { secureLogger } = require('../utils/logger');

// Safe logger wrapper to avoid crashes if logger misconfigured
const safeLog = (level, message, meta = {}, correlationId = null) => {
  try {
    if (level === 'error') return secureLogger.error(message, meta, correlationId);
    if (level === 'warn') return secureLogger.warn(message, meta, correlationId);
    if (level === 'info') return secureLogger.info(message, meta, correlationId);
    if (level === 'security_auth_failed') return secureLogger.security.authenticationFailed(meta.ip, meta.username, meta.reason, correlationId);
    return secureLogger.debug(message, meta, correlationId);
  } catch {
    try { console.error('[auth-logger-fallback]', message, meta && meta.error ? meta.error : ''); } catch { /* no-op */ }
  }
};

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validate JWT secret exists (do not exit process; handle gracefully)
if (!JWT_SECRET) {
  safeLog('warn', 'JWT_SECRET environment variable is not set; authentication features will be disabled', {
    category: 'security',
    type: 'config_warning',
    message: 'JWT_SECRET missing from environment variables',
    timestamp: new Date().toISOString()
  });
}

// Generate JWT token
const generateToken = (userId, email, role) => {
  if (!JWT_SECRET) {
    throw new Error('JWT secret is not configured');
  }
  return jwt.sign(
    { 
      userId, 
      email, 
      role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    if (!JWT_SECRET) {
      return res.status(503).json({
        success: false,
        message: 'Authentication temporarily unavailable'
      });
    }
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      safeLog('security_auth_failed', 'Authentication failed', { ip: req.ip, username: decoded.email || 'unknown', reason: 'user_not_found' }, req.correlationId);
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Add user info to request object
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      safeLog('security_auth_failed', 'Authentication failed', { ip: req.ip, username: 'unknown', reason: 'invalid_token' }, req.correlationId);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      safeLog('security_auth_failed', 'Authentication failed', { ip: req.ip, username: 'unknown', reason: 'token_expired' }, req.correlationId);
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    safeLog('error', 'Authentication middleware error', {
      category: 'auth',
      type: 'auth_middleware_error',
      error: error.message,
      ip: req.ip,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Combined middleware for admin routes
const adminAuth = [authenticateToken, requireAdmin];

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  adminAuth,
  JWT_SECRET
};
