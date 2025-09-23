const express = require('express');
const Contact = require('../models/Contact');
const emailService = require('../services/emailService');
const { contactValidation, sanitizeInput, contactRateLimit } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// Apply rate limiting and input sanitization to all contact routes
router.use(contactRateLimit);
router.use(sanitizeInput);

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', contactValidation, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Create contact record with metadata
    const contactData = {
      name,
      email,
      phone,
      subject,
      message,
      metadata: {
        timestamp: new Date(),
        userAgent: req.get('User-Agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        source: 'contact_form'
      }
    };

    const contact = new Contact(contactData);
    await contact.save();

    logger.info(`New contact form submission from ${email}`, {
      contactId: contact.contactId,
      name,
      subject
    });

    // Send emails asynchronously
    const emailPromises = [];

    // Send auto-reply to user
    emailPromises.push(
      emailService.sendContactAutoReply(contactData)
        .then(() => {
          contact.emailSent = true;
          contact.emailSentAt = new Date();
          return contact.save();
        })
        .catch(error => {
          logger.error('Failed to send contact auto-reply:', error);
        })
    );

    // Send notification to admin
    emailPromises.push(
      emailService.sendContactAdminNotification({
        ...contactData,
        ipAddress: contact.metadata.ipAddress
      })
        .then(() => {
          contact.adminNotified = true;
          contact.adminNotifiedAt = new Date();
          return contact.save();
        })
        .catch(error => {
          logger.error('Failed to send contact admin notification:', error);
        })
    );

    // Execute email sending in background
    Promise.allSettled(emailPromises).then(results => {
      const failedEmails = results.filter(result => result.status === 'rejected');
      if (failedEmails.length > 0) {
        logger.warn(`${failedEmails.length} email(s) failed to send for contact ${contact.contactId}`);
      } else {
        logger.info(`All emails sent successfully for contact ${contact.contactId}`);
      }
    });

    // Return success response immediately
    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you soon!',
      data: {
        id: contact.contactId,
        timestamp: contact.metadata.timestamp
      }
    });

  } catch (error) {
    logger.error('Contact form submission error:', error);

    // Handle duplicate submission or validation errors
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
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
});

// @route   GET /api/contact/health
// @desc    Health check for contact service
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Contact service is running',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/contact/stats (Admin only - basic implementation)
// @desc    Get contact form statistics
// @access  Private (would need authentication middleware in production)
router.get('/stats', async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          emailsSent: { $sum: { $cond: ['$emailSent', 1, 0] } },
          adminNotified: { $sum: { $cond: ['$adminNotified', 1, 0] } },
          pendingContacts: { 
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
          }
        }
      }
    ]);

    const recentContacts = await Contact.find()
      .sort({ 'metadata.timestamp': -1 })
      .limit(5)
      .select('name email subject metadata.timestamp status');

    res.status(200).json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalContacts: 0,
          emailsSent: 0,
          adminNotified: 0,
          pendingContacts: 0
        },
        recentContacts
      }
    });

  } catch (error) {
    logger.error('Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact statistics'
    });
  }
});

module.exports = router;
