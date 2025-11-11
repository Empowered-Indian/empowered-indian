const express = require('express')
const { body, validationResult } = require('express-validator')
const rateLimit = require('express-rate-limit')
const router = express.Router()
const { secureLogger } = require('../utils/logger')

const Subscriber = require('../models/Subscriber')
const {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
} = require('../utils/emailService')

const subscribeLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many subscription attempts from this IP, please try again in 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post(
  '/subscribe',
  subscribeLimit,
  [body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Invalid email address',
          details: errors.array(),
        })
      }

      const { email } = req.body

      const existingSubscriber = await Subscriber.findOne({ email })
      if (existingSubscriber) {
        if (existingSubscriber.isVerified && existingSubscriber.isActive) {
          return res.status(409).json({
            message: 'Email is already subscribed and verified',
          })
        } else if (!existingSubscriber.isVerified) {
          // Resend verification email
          const verificationToken = generateVerificationToken()
          existingSubscriber.verificationToken = verificationToken
          existingSubscriber.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
          existingSubscriber.subscribedAt = new Date()
          // Generate unsubscribe token if not present
          if (!existingSubscriber.unsubscribeToken) {
            existingSubscriber.unsubscribeToken = generateVerificationToken()
          }
          await existingSubscriber.save()

          await sendVerificationEmail(email, verificationToken, existingSubscriber.unsubscribeToken)

          return res.status(200).json({
            message: 'Verification email sent! Please check your email to complete subscription',
            subscriber: {
              email: existingSubscriber.email,
              subscribedAt: existingSubscriber.subscribedAt,
              isVerified: false,
            },
          })
        } else {
          // Reactivate subscription - user was previously verified but unsubscribed
          existingSubscriber.isActive = true
          existingSubscriber.subscribedAt = new Date()
          existingSubscriber.unsubscribedAt = null
          await existingSubscriber.save()

          return res.status(200).json({
            message: 'Welcome back! Your subscription has been reactivated successfully',
            subscriber: {
              email: existingSubscriber.email,
              subscribedAt: existingSubscriber.subscribedAt,
              isVerified: true,
            },
          })
        }
      }

      const verificationToken = generateVerificationToken()
      const unsubscribeToken = generateVerificationToken() // Generate separate unsubscribe token

      const subscriber = new Subscriber({
        email,
        subscribedAt: new Date(),
        isActive: false,
        isVerified: false,
        verificationToken,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        unsubscribeToken,
        ipAddress: req.ip || req.connection.remoteAddress,
      })

      await subscriber.save()
      await sendVerificationEmail(email, verificationToken, unsubscribeToken)

      res.status(201).json({
        message: 'Please check your email to verify your subscription',
        subscriber: {
          email: subscriber.email,
          subscribedAt: subscriber.subscribedAt,
          isVerified: false,
        },
      })
    } catch (error) {
      secureLogger.error(
        'Mailing list subscription error',
        {
          category: 'mailing_list',
          type: 'subscribe_error',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        req.correlationId
      )

      if (error.code === 11000) {
        return res.status(409).json({
          message: 'Email is already subscribed to our mailing list',
        })
      }

      res.status(500).json({
        error: 'Failed to subscribe to mailing list',
        message: 'Please try again later',
      })
    }
  }
)

router.post(
  '/unsubscribe',
  [body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Invalid email address',
          details: errors.array(),
        })
      }

      const { email } = req.body

      const subscriber = await Subscriber.findOne({ email })
      if (!subscriber) {
        return res.status(404).json({
          message: 'Email not found in our mailing list',
        })
      }

      subscriber.isActive = false
      subscriber.unsubscribedAt = new Date()
      await subscriber.save()

      res.status(200).json({
        message: 'Successfully unsubscribed from updates',
      })
    } catch (error) {
      secureLogger.error(
        'Mailing list unsubscription error',
        {
          category: 'mailing_list',
          type: 'unsubscribe_error',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        req.correlationId
      )
      res.status(500).json({
        error: 'Failed to unsubscribe from mailing list',
        message: 'Please try again later',
      })
    }
  }
)

router.get('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params

    if (!token) {
      return res.status(400).json({
        error: 'Unsubscribe token is required',
      })
    }

    // Find subscriber by unsubscribe token
    const subscriber = await Subscriber.findOne({ unsubscribeToken: token })

    if (!subscriber) {
      return res.status(404).json({
        error: 'Invalid unsubscribe link. Email may already be unsubscribed.',
      })
    }

    subscriber.isActive = false
    subscriber.unsubscribedAt = new Date()
    await subscriber.save()

    // Return JSON response for frontend handling
    res.status(200).json({
      message: 'Successfully unsubscribed from updates',
      email: subscriber.email,
    })
  } catch (error) {
    secureLogger.error(
      'One-click unsubscribe error',
      {
        category: 'mailing_list',
        type: 'one_click_unsubscribe_error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).send(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2>Error</h2>
        <p>Failed to process unsubscribe request. Please try again later.</p>
      </body></html>
    `)
  }
})

router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required',
      })
    }

    // First check if token exists at all
    const tokenExists = await Subscriber.findOne({ verificationToken: token })

    if (!tokenExists) {
      // Check if there's a verified subscriber who might have used this token
      secureLogger.warn(
        'Verification failed: token not found',
        {
          category: 'mailing_list',
          type: 'verify_token_missing',
          // Do not log token contents
          timestamp: new Date().toISOString(),
        },
        req.correlationId
      )
      return res.status(400).json({
        error: 'Invalid or already used verification token',
      })
    }

    // Check if token is expired
    const currentTime = new Date()
    if (
      tokenExists.verificationTokenExpires &&
      tokenExists.verificationTokenExpires <= currentTime
    ) {
      secureLogger.warn(
        'Verification failed: token expired',
        {
          category: 'mailing_list',
          type: 'verify_token_expired',
          expiresAt: tokenExists.verificationTokenExpires,
          now: currentTime,
          timestamp: new Date().toISOString(),
        },
        req.correlationId
      )
      return res.status(400).json({
        error: 'Verification token has expired. Please request a new verification email.',
      })
    }

    // Check if already verified
    if (tokenExists.isVerified) {
      const maskedEmail = tokenExists.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      secureLogger.info(
        'Verification: email already verified',
        {
          category: 'mailing_list',
          type: 'verify_already',
          email: maskedEmail,
          timestamp: new Date().toISOString(),
        },
        req.correlationId
      )
      return res.status(200).json({
        message: 'Email is already verified!',
        subscriber: {
          email: tokenExists.email,
          verifiedAt: tokenExists.verifiedAt,
          isVerified: true,
        },
      })
    }

    await tokenExists.verify()
    await sendWelcomeEmail(tokenExists.email)

    const maskedEmail = tokenExists.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    secureLogger.info(
      'Verification successful',
      {
        category: 'mailing_list',
        type: 'verify_success',
        email: maskedEmail,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(200).json({
      message: 'Email successfully verified! Welcome to Empowered Indian',
      subscriber: {
        email: tokenExists.email,
        verifiedAt: tokenExists.verifiedAt,
        isVerified: true,
      },
    })
  } catch (error) {
    secureLogger.error(
      'Email verification error',
      {
        category: 'mailing_list',
        type: 'verify_error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      error: 'Failed to verify email',
      message: 'Please try again later',
    })
  }
})

router.get('/admin/subscribers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.verified === 'true') filter.isVerified = true
    if (req.query.verified === 'false') filter.isVerified = false
    if (req.query.active === 'true') filter.isActive = true
    if (req.query.active === 'false') filter.isActive = false

    const [subscribers, stats] = await Promise.all([
      Subscriber.find(filter)
        .select(
          'email subscribedAt verifiedAt isVerified isActive source ipAddress createdAt updatedAt'
        )
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit),
      Subscriber.getSubscriberStats(),
    ])

    const total = await Subscriber.countDocuments(filter)

    res.status(200).json({
      subscribers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || {
        total: 0,
        active: 0,
        pending_verification: 0,
        unsubscribed: 0,
        verified: 0,
        unverified: 0,
      },
    })
  } catch (error) {
    secureLogger.error(
      'Admin subscribers fetch error',
      {
        category: 'mailing_list',
        type: 'admin_subscribers_fetch_error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      error: 'Failed to fetch subscribers',
      message: 'Please try again later',
    })
  }
})

router.get('/admin/stats', async (req, res) => {
  try {
    const stats = await Subscriber.getSubscriberStats()
    const recentSubscribers = await Subscriber.find()
      .select('email subscribedAt isVerified isActive')
      .sort({ subscribedAt: -1 })
      .limit(10)

    res.status(200).json({
      stats: stats[0] || {
        total: 0,
        active: 0,
        pending_verification: 0,
        unsubscribed: 0,
        verified: 0,
        unverified: 0,
      },
      recentSubscribers,
    })
  } catch (error) {
    secureLogger.error(
      'Admin stats fetch error',
      {
        category: 'mailing_list',
        type: 'admin_stats_fetch_error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: 'Please try again later',
    })
  }
})

module.exports = router
