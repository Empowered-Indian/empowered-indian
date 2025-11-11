const mongoose = require('mongoose')

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        },
        message: 'Invalid email format',
      },
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
    unsubscribeToken: {
      type: String,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    preferences: {
      features: { type: Boolean, default: true },
      updates: { type: Boolean, default: true },
      security: { type: Boolean, default: true },
    },
    source: {
      type: String,
      default: 'landing_page',
      enum: ['landing_page', 'dashboard', 'api', 'admin'],
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'mailing_list_subscribers',
  }
)

subscriberSchema.index({ subscribedAt: 1 })
subscriberSchema.index({ isActive: 1 })
subscriberSchema.index({ verificationToken: 1 })
subscriberSchema.index({ unsubscribeToken: 1 })
subscriberSchema.index({ verificationTokenExpires: 1 })
subscriberSchema.index({ isVerified: 1 })

subscriberSchema.methods.unsubscribe = function () {
  this.isActive = false
  this.unsubscribedAt = new Date()
  return this.save()
}

subscriberSchema.methods.resubscribe = function () {
  this.isActive = true
  this.subscribedAt = new Date()
  this.unsubscribedAt = null
  return this.save()
}

subscriberSchema.methods.verify = function () {
  this.isVerified = true
  this.isActive = true
  this.verifiedAt = new Date()
  this.verificationToken = null
  this.verificationTokenExpires = null
  return this.save()
}

subscriberSchema.methods.generateVerificationToken = function () {
  const crypto = require('crypto')
  this.verificationToken = crypto.randomBytes(32).toString('hex')
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  // Also generate unsubscribe token that persists
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex')
  }
  return this.save()
}

subscriberSchema.statics.getActiveSubscribers = function () {
  return this.find({ isActive: true, isVerified: true }).sort({ subscribedAt: -1 })
}

subscriberSchema.statics.getSubscriberStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $and: ['$isActive', '$isVerified'] }, 1, 0] } },
        pending_verification: {
          $sum: { $cond: [{ $and: [{ $not: '$isVerified' }, '$isActive'] }, 1, 0] },
        },
        unsubscribed: { $sum: { $cond: ['$isActive', 0, 1] } },
        verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
        unverified: { $sum: { $cond: ['$isVerified', 0, 1] } },
      },
    },
  ])
}

const Subscriber = mongoose.model('Subscriber', subscriberSchema)

module.exports = Subscriber
