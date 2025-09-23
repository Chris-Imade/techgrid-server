const express = require('express');
const path = require('path');
const Contact = require('../models/Contact');
const Registration = require('../models/Registration');
const Newsletter = require('../models/Newsletter');
const logger = require('../utils/logger');

const router = express.Router();

// Serve static dashboard files
router.use('/static', express.static(path.join(__dirname, '../public/dashboard')));

// Dashboard home page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/index.html'));
});

// API Routes for dashboard data management

// ============= CONTACTS =============

// Get all contacts with pagination
router.get('/api/contacts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ 'metadata.timestamp': -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Dashboard contacts fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
});

// Get single contact
router.get('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findOne({ 
      $or: [{ _id: req.params.id }, { contactId: req.params.id }] 
    });
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    logger.error('Dashboard contact fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contact' });
  }
});

// Update contact
router.put('/api/contacts/:id', async (req, res) => {
  try {
    const { name, email, phone, subject, message, status } = req.body;
    
    const contact = await Contact.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { contactId: req.params.id }] },
      { name, email, phone, subject, message, status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    logger.info(`Contact updated via dashboard: ${contact.contactId}`);
    res.json({ success: true, data: contact });
  } catch (error) {
    logger.error('Dashboard contact update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({ 
      $or: [{ _id: req.params.id }, { contactId: req.params.id }] 
    });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    logger.info(`Contact deleted via dashboard: ${contact.contactId}`);
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    logger.error('Dashboard contact delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
});

// ============= REGISTRATIONS =============

// Get all registrations with pagination
router.get('/api/registrations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const experience = req.query.experience || '';

    let query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query['metadata.status'] = status;
    }
    if (experience) {
      query.experience = experience;
    }

    const registrations = await Registration.find(query)
      .sort({ 'metadata.timestamp': -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Registration.countDocuments(query);

    res.json({
      success: true,
      data: registrations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Dashboard registrations fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
});

// Get single registration
router.get('/api/registrations/:id', async (req, res) => {
  try {
    const registration = await Registration.findOne({ 
      $or: [
        { _id: req.params.id }, 
        { registrationId: req.params.id },
        { registrationNumber: req.params.id.toUpperCase() }
      ] 
    });
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    res.json({ success: true, data: registration });
  } catch (error) {
    logger.error('Dashboard registration fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registration' });
  }
});

// Update registration
router.put('/api/registrations/:id', async (req, res) => {
  try {
    const { 
      firstName, lastName, email, phone, company, jobTitle, 
      experience, interests, expectations, newsletter, terms 
    } = req.body;
    
    const registration = await Registration.findOneAndUpdate(
      { 
        $or: [
          { _id: req.params.id }, 
          { registrationId: req.params.id },
          { registrationNumber: req.params.id.toUpperCase() }
        ] 
      },
      { 
        firstName, lastName, email, phone, company, jobTitle, 
        experience, interests, expectations, newsletter, terms 
      },
      { new: true, runValidators: true }
    );

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    logger.info(`Registration updated via dashboard: ${registration.registrationId}`);
    res.json({ success: true, data: registration });
  } catch (error) {
    logger.error('Dashboard registration update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update registration' });
  }
});

// Update registration status
router.patch('/api/registrations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const registration = await Registration.findOneAndUpdate(
      { 
        $or: [
          { _id: req.params.id }, 
          { registrationId: req.params.id },
          { registrationNumber: req.params.id.toUpperCase() }
        ] 
      },
      { 'metadata.status': status },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    logger.info(`Registration status updated via dashboard: ${registration.registrationId} -> ${status}`);
    res.json({ success: true, data: registration });
  } catch (error) {
    logger.error('Dashboard registration status update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update registration status' });
  }
});

// Delete registration
router.delete('/api/registrations/:id', async (req, res) => {
  try {
    const registration = await Registration.findOneAndDelete({ 
      $or: [
        { _id: req.params.id }, 
        { registrationId: req.params.id },
        { registrationNumber: req.params.id.toUpperCase() }
      ] 
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    logger.info(`Registration deleted via dashboard: ${registration.registrationId}`);
    res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    logger.error('Dashboard registration delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete registration' });
  }
});

// ============= NEWSLETTER =============

// Get all newsletter subscriptions with pagination
router.get('/api/newsletter', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const active = req.query.active;

    let query = {};
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }
    if (status) {
      query['metadata.status'] = status;
    }
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const subscriptions = await Newsletter.find(query)
      .sort({ 'metadata.timestamp': -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Newsletter.countDocuments(query);

    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Dashboard newsletter fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch newsletter subscriptions' });
  }
});

// Get single newsletter subscription
router.get('/api/newsletter/:id', async (req, res) => {
  try {
    const subscription = await Newsletter.findOne({ 
      $or: [
        { _id: req.params.id }, 
        { subscriptionId: req.params.id },
        { email: req.params.id.toLowerCase() }
      ] 
    });
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Newsletter subscription not found' });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    logger.error('Dashboard newsletter fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch newsletter subscription' });
  }
});

// Update newsletter subscription
router.put('/api/newsletter/:id', async (req, res) => {
  try {
    const { email, isActive, preferences } = req.body;
    
    const subscription = await Newsletter.findOneAndUpdate(
      { 
        $or: [
          { _id: req.params.id }, 
          { subscriptionId: req.params.id },
          { email: req.params.id.toLowerCase() }
        ] 
      },
      { email: email.toLowerCase(), isActive, preferences },
      { new: true, runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Newsletter subscription not found' });
    }

    logger.info(`Newsletter subscription updated via dashboard: ${subscription.subscriptionId}`);
    res.json({ success: true, data: subscription });
  } catch (error) {
    logger.error('Dashboard newsletter update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update newsletter subscription' });
  }
});

// Delete newsletter subscription
router.delete('/api/newsletter/:id', async (req, res) => {
  try {
    const subscription = await Newsletter.findOneAndDelete({ 
      $or: [
        { _id: req.params.id }, 
        { subscriptionId: req.params.id },
        { email: req.params.id.toLowerCase() }
      ] 
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Newsletter subscription not found' });
    }

    logger.info(`Newsletter subscription deleted via dashboard: ${subscription.subscriptionId}`);
    res.json({ success: true, message: 'Newsletter subscription deleted successfully' });
  } catch (error) {
    logger.error('Dashboard newsletter delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete newsletter subscription' });
  }
});

// ============= DASHBOARD STATISTICS =============

// Get dashboard overview statistics
router.get('/api/overview', async (req, res) => {
  try {
    const [contactStats, registrationStats, newsletterStats] = await Promise.all([
      Contact.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            processed: { $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] } },
            responded: { $sum: { $cond: [{ $eq: ['$status', 'responded'] }, 1, 0] } },
            emailsSent: { $sum: { $cond: ['$emailSent', 1, 0] } }
          }
        }
      ]),
      Registration.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            registered: { $sum: { $cond: [{ $eq: ['$metadata.status', 'registered'] }, 1, 0] } },
            confirmed: { $sum: { $cond: [{ $eq: ['$metadata.status', 'confirmed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$metadata.status', 'cancelled'] }, 1, 0] } },
            attended: { $sum: { $cond: [{ $eq: ['$metadata.status', 'attended'] }, 1, 0] } },
            confirmationsSent: { $sum: { $cond: ['$confirmationEmailSent', 1, 0] } }
          }
        }
      ]),
      Newsletter.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            subscribed: { $sum: { $cond: [{ $eq: ['$metadata.status', 'subscribed'] }, 1, 0] } },
            unsubscribed: { $sum: { $cond: [{ $eq: ['$metadata.status', 'unsubscribed'] }, 1, 0] } },
            welcomesSent: { $sum: { $cond: ['$welcomeEmailSent', 1, 0] } }
          }
        }
      ])
    ]);

    // Get recent activity
    const recentContacts = await Contact.find()
      .sort({ 'metadata.timestamp': -1 })
      .limit(5)
      .select('name email subject metadata.timestamp status');

    const recentRegistrations = await Registration.find()
      .sort({ 'metadata.timestamp': -1 })
      .limit(5)
      .select('firstName lastName email registrationNumber metadata.timestamp metadata.status');

    const recentNewsletterSubs = await Newsletter.find()
      .sort({ 'metadata.timestamp': -1 })
      .limit(5)
      .select('email metadata.timestamp metadata.status isActive');

    res.json({
      success: true,
      data: {
        statistics: {
          contacts: contactStats[0] || { total: 0, pending: 0, processed: 0, responded: 0, emailsSent: 0 },
          registrations: registrationStats[0] || { total: 0, registered: 0, confirmed: 0, cancelled: 0, attended: 0, confirmationsSent: 0 },
          newsletter: newsletterStats[0] || { total: 0, active: 0, subscribed: 0, unsubscribed: 0, welcomesSent: 0 }
        },
        recentActivity: {
          contacts: recentContacts,
          registrations: recentRegistrations,
          newsletter: recentNewsletterSubs
        }
      }
    });
  } catch (error) {
    logger.error('Dashboard overview fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard overview' });
  }
});

module.exports = router;
