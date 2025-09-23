const express = require('express');
const Registration = require('../models/Registration');
const Newsletter = require('../models/Newsletter');
const emailService = require('../services/emailService');
const { registrationValidation, sanitizeInput } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// Apply input sanitization to all registration routes
router.use(sanitizeInput);

// @route   POST /api/register
// @desc    Submit conference registration
// @access  Public
router.post('/', registrationValidation, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      jobTitle,
      experience,
      interests,
      expectations,
      newsletter,
      terms
    } = req.body;

    // Check for duplicate registration
    const existingRegistration = await Registration.findOne({ email });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered for this event',
        errors: {
          email: ['This email address is already registered']
        }
      });
    }

    // Create registration record with metadata
    const registrationData = {
      firstName,
      lastName,
      email,
      phone,
      company: company || '',
      jobTitle: jobTitle || '',
      experience,
      interests: interests || [],
      expectations: expectations || '',
      newsletter: newsletter || false,
      terms,
      metadata: {
        timestamp: new Date(),
        userAgent: req.get('User-Agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        source: 'conference_registration',
        eventId: process.env.EVENT_ID || 'tech_grid_ai_finance_2025',
        status: 'registered'
      }
    };

    const registration = new Registration(registrationData);
    await registration.save();

    logger.info(`New conference registration from ${email}`, {
      registrationId: registration.registrationId,
      registrationNumber: registration.registrationNumber,
      name: `${firstName} ${lastName}`,
      experience
    });

    // Handle newsletter subscription if requested
    if (newsletter) {
      try {
        await Newsletter.subscribeEmail(email, {
          userAgent: req.get('User-Agent') || '',
          ipAddress: req.ip || req.connection.remoteAddress || '',
          source: 'registration_form',
          sourcePage: 'registration'
        });
        logger.info(`Newsletter subscription added for ${email} via registration`);
      } catch (newsletterError) {
        logger.warn(`Newsletter subscription failed for ${email}:`, newsletterError);
        // Don't fail the registration if newsletter subscription fails
      }
    }

    // Send emails asynchronously
    const emailPromises = [];

    // Send confirmation email to user
    emailPromises.push(
      emailService.sendRegistrationConfirmation({
        ...registrationData,
        registrationNumber: registration.registrationNumber
      })
        .then(() => {
          registration.confirmationEmailSent = true;
          registration.confirmationEmailSentAt = new Date();
          return registration.save();
        })
        .catch(error => {
          logger.error('Failed to send registration confirmation:', error);
        })
    );

    // Send notification to admin
    emailPromises.push(
      emailService.sendRegistrationAdminNotification({
        ...registrationData,
        registrationNumber: registration.registrationNumber,
        ipAddress: registration.metadata.ipAddress
      })
        .then(() => {
          registration.adminNotified = true;
          registration.adminNotifiedAt = new Date();
          return registration.save();
        })
        .catch(error => {
          logger.error('Failed to send registration admin notification:', error);
        })
    );

    // Execute email sending in background
    Promise.allSettled(emailPromises).then(results => {
      const failedEmails = results.filter(result => result.status === 'rejected');
      if (failedEmails.length > 0) {
        logger.warn(`${failedEmails.length} email(s) failed to send for registration ${registration.registrationId}`);
      } else {
        logger.info(`All emails sent successfully for registration ${registration.registrationId}`);
      }
    });

    // Return success response immediately
    res.status(201).json({
      success: true,
      message: 'Registration completed successfully! Check your email for confirmation details.',
      data: {
        registrationId: registration.registrationId,
        registrationNumber: registration.registrationNumber,
        timestamp: registration.metadata.timestamp,
        eventDetails: {
          name: process.env.EVENT_NAME,
          date: process.env.EVENT_DATE,
          location: process.env.EVENT_LOCATION
        }
      }
    });

  } catch (error) {
    logger.error('Registration submission error:', error);

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

    // Handle duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already registered for this event',
          errors: {
            email: ['This email address is already registered']
          }
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your registration. Please try again later.'
    });
  }
});

// @route   GET /api/register/verify/:registrationId
// @desc    Verify registration status
// @access  Public
router.get('/verify/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findOne({ 
      $or: [
        { registrationId },
        { registrationNumber: registrationId.toUpperCase() }
      ]
    }).select('registrationId registrationNumber firstName lastName email metadata.status metadata.timestamp');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Registration found',
      data: {
        registrationId: registration.registrationId,
        registrationNumber: registration.registrationNumber,
        name: `${registration.firstName} ${registration.lastName}`,
        email: registration.email,
        status: registration.metadata.status,
        registeredAt: registration.metadata.timestamp
      }
    });

  } catch (error) {
    logger.error('Registration verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify registration'
    });
  }
});

// @route   GET /api/register/health
// @desc    Health check for registration service
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Registration service is running',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/register/stats (Admin only - basic implementation)
// @desc    Get registration statistics
// @access  Private (would need authentication middleware in production)
router.get('/stats', async (req, res) => {
  try {
    const stats = await Registration.aggregate([
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          confirmedRegistrations: { 
            $sum: { $cond: ['$confirmationEmailSent', 1, 0] } 
          },
          adminNotified: { $sum: { $cond: ['$adminNotified', 1, 0] } },
          newsletterSubscribers: { 
            $sum: { $cond: ['$newsletter', 1, 0] } 
          }
        }
      }
    ]);

    const experienceStats = await Registration.aggregate([
      {
        $group: {
          _id: '$experience',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentRegistrations = await Registration.find()
      .sort({ 'metadata.timestamp': -1 })
      .limit(10)
      .select('firstName lastName email experience metadata.timestamp registrationNumber');

    res.status(200).json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalRegistrations: 0,
          confirmedRegistrations: 0,
          adminNotified: 0,
          newsletterSubscribers: 0
        },
        experienceBreakdown: experienceStats,
        recentRegistrations
      }
    });

  } catch (error) {
    logger.error('Error fetching registration stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration statistics'
    });
  }
});

module.exports = router;
