const express = require('express');
const Newsletter = require('../models/Newsletter');
const emailService = require('../services/emailService');
const { newsletterValidation, sanitizeInput, newsletterRateLimit } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// Apply rate limiting and input sanitization to all newsletter routes
router.use(newsletterRateLimit);
router.use(sanitizeInput);

// @route   POST /api/newsletter
// @desc    Subscribe to newsletter
// @access  Public
router.post('/', newsletterValidation, async (req, res) => {
  try {
    const { email } = req.body;
    const sourcePage = req.get('Referer') || req.body.sourcePage || 'unknown';

    // Prepare subscription metadata
    const subscriptionMetadata = {
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || req.connection.remoteAddress || '',
      source: 'newsletter_subscription',
      sourcePage: sourcePage
    };

    // Use the static method to handle subscription
    const subscription = await Newsletter.subscribeEmail(email, subscriptionMetadata);

    logger.info(`Newsletter subscription for ${email}`, {
      subscriptionId: subscription.subscriptionId,
      sourcePage,
      isNewSubscription: subscription.isNew !== false
    });

    // Send emails asynchronously
    const emailPromises = [];

    // Send welcome email to subscriber
    emailPromises.push(
      emailService.sendNewsletterWelcome({
        email,
        subscriptionId: subscription.subscriptionId
      })
        .then(() => {
          subscription.welcomeEmailSent = true;
          subscription.welcomeEmailSentAt = new Date();
          return subscription.save();
        })
        .catch(error => {
          logger.error('Failed to send newsletter welcome email:', error);
        })
    );

    // Send notification to admin
    emailPromises.push(
      emailService.sendNewsletterAdminNotification({
        email,
        sourcePage,
        ipAddress: subscription.metadata.ipAddress
      })
        .then(() => {
          subscription.adminNotified = true;
          subscription.adminNotifiedAt = new Date();
          return subscription.save();
        })
        .catch(error => {
          logger.error('Failed to send newsletter admin notification:', error);
        })
    );

    // Execute email sending in background
    Promise.allSettled(emailPromises).then(results => {
      const failedEmails = results.filter(result => result.status === 'rejected');
      if (failedEmails.length > 0) {
        logger.warn(`${failedEmails.length} email(s) failed to send for newsletter subscription ${subscription.subscriptionId}`);
      } else {
        logger.info(`All emails sent successfully for newsletter subscription ${subscription.subscriptionId}`);
      }
    });

    // Return success response immediately
    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter! Check your email for confirmation.',
      data: {
        subscriptionId: subscription.subscriptionId,
        timestamp: subscription.metadata.timestamp
      }
    });

  } catch (error) {
    logger.error('Newsletter subscription error:', error);

    // Handle duplicate subscription
    if (error.message.includes('already subscribed')) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already subscribed to our newsletter',
        errors: {
          email: ['This email address is already subscribed']
        }
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = [error.errors[key].message];
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your subscription. Please try again later.'
    });
  }
});

// @route   GET /api/newsletter/unsubscribe
// @desc    Unsubscribe from newsletter
// @access  Public
router.get('/unsubscribe', async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token && !email) {
      return res.status(400).json({
        success: false,
        message: 'Unsubscribe token or email is required'
      });
    }

    let subscription;
    
    if (token) {
      subscription = await Newsletter.findOne({ subscriptionId: token });
    } else if (email) {
      subscription = await Newsletter.findOne({ email: email.toLowerCase() });
    }

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (!subscription.isActive || subscription.metadata.status === 'unsubscribed') {
      return res.status(400).json({
        success: false,
        message: 'Email is already unsubscribed'
      });
    }

    // Update subscription status
    subscription.metadata.status = 'unsubscribed';
    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();
    subscription.unsubscribeReason = req.query.reason || 'User requested';

    await subscription.save();

    logger.info(`Newsletter unsubscription for ${subscription.email}`, {
      subscriptionId: subscription.subscriptionId,
      reason: subscription.unsubscribeReason
    });

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data: {
        email: subscription.email,
        unsubscribedAt: subscription.unsubscribedAt
      }
    });

  } catch (error) {
    logger.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process unsubscribe request'
    });
  }
});

// @route   POST /api/newsletter/resubscribe
// @desc    Resubscribe to newsletter
// @access  Public
router.post('/resubscribe', newsletterValidation, async (req, res) => {
  try {
    const { email } = req.body;

    const subscription = await Newsletter.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No previous subscription found for this email'
      });
    }

    if (subscription.isActive && subscription.metadata.status === 'subscribed') {
      return res.status(400).json({
        success: false,
        message: 'Email is already subscribed to newsletter'
      });
    }

    // Reactivate subscription
    subscription.isActive = true;
    subscription.metadata.status = 'subscribed';
    subscription.metadata.timestamp = new Date();
    subscription.unsubscribedAt = undefined;
    subscription.unsubscribeReason = undefined;

    await subscription.save();

    logger.info(`Newsletter resubscription for ${email}`, {
      subscriptionId: subscription.subscriptionId
    });

    // Send welcome email
    emailService.sendNewsletterWelcome({
      email,
      subscriptionId: subscription.subscriptionId
    }).catch(error => {
      logger.error('Failed to send resubscribe welcome email:', error);
    });

    res.status(200).json({
      success: true,
      message: 'Successfully resubscribed to newsletter!',
      data: {
        subscriptionId: subscription.subscriptionId,
        timestamp: subscription.metadata.timestamp
      }
    });

  } catch (error) {
    logger.error('Newsletter resubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process resubscribe request'
    });
  }
});

// @route   GET /api/newsletter/health
// @desc    Health check for newsletter service
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Newsletter service is running',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/newsletter/stats (Admin only - basic implementation)
// @desc    Get newsletter statistics
// @access  Private (would need authentication middleware in production)
router.get('/stats', async (req, res) => {
  try {
    const stats = await Newsletter.aggregate([
      {
        $group: {
          _id: null,
          totalSubscriptions: { $sum: 1 },
          activeSubscriptions: { 
            $sum: { $cond: ['$isActive', 1, 0] } 
          },
          welcomeEmailsSent: { 
            $sum: { $cond: ['$welcomeEmailSent', 1, 0] } 
          },
          unsubscribed: { 
            $sum: { 
              $cond: [
                { $eq: ['$metadata.status', 'unsubscribed'] }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    const sourceStats = await Newsletter.aggregate([
      {
        $group: {
          _id: '$metadata.sourcePage',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const recentSubscriptions = await Newsletter.find({ isActive: true })
      .sort({ 'metadata.timestamp': -1 })
      .limit(10)
      .select('email metadata.timestamp metadata.sourcePage');

    res.status(200).json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          welcomeEmailsSent: 0,
          unsubscribed: 0
        },
        sourceBreakdown: sourceStats,
        recentSubscriptions
      }
    });

  } catch (error) {
    logger.error('Error fetching newsletter stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch newsletter statistics'
    });
  }
});

module.exports = router;
