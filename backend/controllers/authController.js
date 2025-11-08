const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { secureLogger } = require('../utils/logger');

// User login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Validate password
    const isValidPassword = await User.validatePassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await User.updateLastLogin(user._id);

    // Generate JWT token
    const token = generateToken(user._id, user.email, user.role);

    // Return user info and token (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: '7d'
      }
    });

  } catch (error) {
    secureLogger.error('Login error occurred', {
      category: 'auth',
      type: 'login_error',
      error: error.message,
      ip: req.ip,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// User registration (optional - for creating new admin users)
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, name, role = 'user' } = req.body;

    // Only allow admin registration if requester is admin
    if (role === 'admin' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only existing admins can create admin accounts'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      role
    });

    // Generate JWT token
    const token = generateToken(user._id, user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user,
        token,
        expiresIn: '7d'
      }
    });

  } catch (error) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    secureLogger.error('Registration error occurred', {
      category: 'auth',
      type: 'registration_error',
      error: error.message,
      ip: req.ip,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });

  } catch (error) {
    secureLogger.error('Get profile error occurred', {
      category: 'auth',
      type: 'profile_fetch_error',
      error: error.message,
      userId: req.user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    }, req.correlationId);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

// Logout (client-side will remove token)
const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

// Verify token (check if user is still authenticated)
const verifyToken = (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
};

module.exports = {
  login,
  register,
  getProfile,
  logout,
  verifyToken
};