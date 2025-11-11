const nodemailer = require('nodemailer')
const crypto = require('crypto')
const { secureLogger } = require('./logger')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true', // false for port 587 (TLS), true for port 465 (SSL)
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD,
  },
})

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

const sendVerificationEmail = async (email, verificationToken, unsubscribeToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`
  const unsubscribeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe/${unsubscribeToken}`

  const mailOptions = {
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Empowered Indian',
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: 'Please verify your email subscription - Empowered Indian',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
              .footer { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
              .button { 
                display: inline-block; 
                background: #2563eb; 
                color: white !important; 
                padding: 14px 28px; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 24px 0; 
                font-weight: 600; 
                font-size: 16px;
                border: none;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
                transition: all 0.2s ease;
              }
              .button:hover { 
                background: #1d4ed8 !important; 
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
              }
              .button-container {
                text-align: center;
                padding: 20px 0;
                margin: 20px 0;
              }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>🇮🇳 Empowered Indian</h1>
              <p>Making government data accessible and accountable</p>
          </div>
          
          <div class="content">
              <h2>Welcome to our community! 🎉</h2>
              
              <p>Thank you for subscribing to Empowered Indian updates. We're excited to keep you informed about:</p>
              
              <ul>
                  <li>🏛️ New features in the MPLADS Dashboard</li>
                  <li>📊 Data insights and transparency reports</li>
                  <li>🔧 Platform improvements and enhancements</li>
                  <li>📈 Government accountability updates</li>
              </ul>
              
              <p>To complete your subscription and start receiving updates, please verify your email address:</p>
              
              <div class="button-container">
                  <a href="${verificationUrl}" class="button" style="color: white; text-decoration: none;">Verify My Email ✉️</a>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace;">${verificationUrl}</p>
              
              <div class="warning">
                  <strong>⚠️ Security Note:</strong> This verification link will expire in 24 hours. If you didn't sign up for our mailing list, you can safely ignore this email.
              </div>
              
              <p>Questions or concerns? Feel free to reach out to us on <a href="https://twitter.com/roshanasingh6" target="_blank">Twitter</a>.</p>
          </div>
          
          <div class="footer">
              <p>© 2025 Empowered Indian • Making government data accessible</p>
              <p>This email was sent because you requested to subscribe to our updates at <span style="color: inherit;">empoweredindian.in</span></p>
              <p><a href="${unsubscribeUrl}" style="color: #93c5fd; text-decoration: underline;">Unsubscribe</a></p>
          </div>
      </body>
      </html>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)

    secureLogger.info('Verification email sent successfully', {
      category: 'email',
      type: 'verification_sent',
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    secureLogger.error('Failed to send verification email', {
      category: 'email',
      type: 'verification_failed',
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      error: error.message,
      timestamp: new Date().toISOString(),
    })

    throw error
  }
}

const sendWelcomeEmail = async email => {
  // Get subscriber to use their unsubscribe token
  const subscriber = await require('../models/Subscriber').findOne({ email })
  const unsubscribeUrl = subscriber
    ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe/${subscriber.unsubscribeToken}`
    : '#'
  const mailOptions = {
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Empowered Indian',
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: 'Welcome to Empowered Indian Community! 🇮🇳',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Empowered Indian</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
              .footer { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
              .feature { background: white; margin: 15px 0; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; }
              .button { 
                display: inline-block; 
                background: #2563eb; 
                color: white !important; 
                padding: 14px 28px; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 24px 0; 
                font-weight: 600; 
                font-size: 16px;
                border: none;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
                transition: all 0.2s ease;
              }
              .button:hover { 
                background: #1d4ed8 !important; 
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
              }
              .button-container {
                text-align: center;
                padding: 20px 0;
                margin: 20px 0;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>🇮🇳 Welcome to Empowered Indian!</h1>
              <p>Your subscription is now verified and active</p>
          </div>
          
          <div class="content">
              <h2>Thank you for joining our mission! ✨</h2>
              
              <p>Your email has been successfully verified, and you're now part of our community working towards government transparency and accountability.</p>
              
              <div class="feature">
                  <h3>🏛️ MPLADS Dashboard</h3>
                  <p>View fund allocations, expenditures, and completed works by MPs across India.</p>
              </div>
              
              <div class="feature">
                  <h3>📊 Basic Analytics</h3>
                  <p>Browse data on fund utilization and project completion by state and MP.</p>
              </div>
              
              <div class="button-container">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mplads" class="button" style="color: white; text-decoration: none;">Start Exploring → 🚀</a>
              </div>
              
              <p>We'll keep you updated with data updates and platform improvements. You can unsubscribe at any time.</p>
          </div>
          
          <div class="footer">
              <p>© 2025 Empowered Indian • Making government data accessible</p>
              <p>You received this because you verified your subscription at <span style="color: inherit;">empoweredindian.in</span></p>
              <p><a href="${unsubscribeUrl}" style="color: #93c5fd; text-decoration: underline;">Unsubscribe</a></p>
          </div>
      </body>
      </html>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)

    secureLogger.info('Welcome email sent successfully', {
      category: 'email',
      type: 'welcome_sent',
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    secureLogger.error('Failed to send welcome email', {
      category: 'email',
      type: 'welcome_failed',
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      error: error.message,
      timestamp: new Date().toISOString(),
    })

    throw error
  }
}

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
}
