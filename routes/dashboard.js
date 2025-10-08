const express = require('express');
const path = require('path');
const multer = require('multer');
const Contact = require('../models/Contact');
const Registration = require('../models/Registration');
const Newsletter = require('../models/Newsletter');
const EmailTemplate = require('../models/EmailTemplate');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  }
});

// Simple session middleware
const checkAuth = (req, res, next) => {
  const isLoggedIn = req.session && req.session.loggedIn;
  if (!isLoggedIn) {
    // If it's an API request, return JSON error
    if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    // Otherwise redirect to auth page
    return res.redirect('/auth');
  }
  next();
};


// Dashboard home page (protected)
router.get('/', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/index.html'));
});

// Serve static dashboard files
router.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/style.css'));
});

router.get('/script.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/script.js'));
});

// Legacy routes for backward compatibility
router.get('/static/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/style.css'));
});

router.get('/static/script.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/script.js'));
});

// API Routes for dashboard data management

// ============= CONTACTS =============

// Create new contact
router.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, subject, message, status } = req.body;

    const contactData = {
      name,
      email,
      phone,
      subject,
      message,
      status: status || 'pending',
      metadata: {
        timestamp: new Date(),
        userAgent: req.get('User-Agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        source: 'dashboard_manual'
      }
    };

    const contact = new Contact(contactData);
    await contact.save();

    logger.info(`New contact created via dashboard: ${contact.contactId}`);
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    logger.error('Dashboard contact creation error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ success: false, message: 'Failed to create contact' });
  }
});

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
    let contact;
    
    // Try contactId first (UUID)
    contact = await Contact.findOne({ contactId: req.params.id });
    
    if (!contact) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        contact = await Contact.findById(req.params.id);
      }
    }
    
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
    
    let contact;
    
    // Try contactId first (UUID)
    contact = await Contact.findOneAndUpdate(
      { contactId: req.params.id },
      { name, email, phone, subject, message, status },
      { new: true, runValidators: true }
    );
    
    if (!contact) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        contact = await Contact.findByIdAndUpdate(
          req.params.id,
          { name, email, phone, subject, message, status },
          { new: true, runValidators: true }
        );
      }
    }

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    logger.info(`Contact updated via dashboard: ${contact.contactId}`);
    res.json({ success: true, data: contact });
  } catch (error) {
    logger.error('Dashboard contact update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ success: false, message: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/api/contacts/:id', async (req, res) => {
  try {
    let contact;
    
    // Try contactId first (UUID)
    contact = await Contact.findOneAndDelete({ contactId: req.params.id });
    
    if (!contact) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        contact = await Contact.findByIdAndDelete(req.params.id);
      }
    }

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

// Create new registration
router.post('/api/registrations', async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, company, jobTitle,
      experience, interests, expectations, newsletter, terms
    } = req.body;

    // Check for duplicate registration
    const existingRegistration = await Registration.findOne({ email });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered for this event'
      });
    }

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
      terms: terms !== undefined ? terms : true,
      metadata: {
        timestamp: new Date(),
        userAgent: req.get('User-Agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        source: 'dashboard_manual',
        eventId: process.env.EVENT_ID || 'tech_grid_ai_finance_2025',
        status: 'registered'
      }
    };

    const registration = new Registration(registrationData);
    await registration.save();

    logger.info(`New registration created via dashboard: ${registration.registrationId}`);
    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    logger.error('Dashboard registration creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ success: false, message: 'Failed to create registration' });
  }
});

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

    // Check newsletter status for each registration
    for (let registration of registrations) {
      const newsletterSub = await Newsletter.findOne({ 
        email: registration.email.toLowerCase(),
        isActive: true,
        'metadata.status': 'subscribed'
      });
      registration.metadata.inNewsletter = !!newsletterSub;
    }

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
    let registration;
    
    // Try registrationId first (UUID)
    registration = await Registration.findOne({ registrationId: req.params.id });
    
    if (!registration) {
      // Try registrationNumber
      registration = await Registration.findOne({ registrationNumber: req.params.id.toUpperCase() });
    }
    
    if (!registration) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        registration = await Registration.findById(req.params.id);
      }
    }
    
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
    
    let registration;
    
    // Try registrationId first (UUID)
    registration = await Registration.findOneAndUpdate(
      { registrationId: req.params.id },
      { 
        firstName, lastName, email, phone, company, jobTitle, 
        experience, interests, expectations, newsletter, terms 
      },
      { new: true, runValidators: true }
    );
    
    if (!registration) {
      // Try registrationNumber
      registration = await Registration.findOneAndUpdate(
        { registrationNumber: req.params.id.toUpperCase() },
        { 
          firstName, lastName, email, phone, company, jobTitle, 
          experience, interests, expectations, newsletter, terms 
        },
        { new: true, runValidators: true }
      );
    }
    
    if (!registration) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        registration = await Registration.findByIdAndUpdate(
          req.params.id,
          { 
            firstName, lastName, email, phone, company, jobTitle, 
            experience, interests, expectations, newsletter, terms 
          },
          { new: true, runValidators: true }
        );
      }
    }

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    logger.info(`Registration updated via dashboard: ${registration.registrationId}`);
    res.json({ success: true, data: registration });
  } catch (error) {
    logger.error('Dashboard registration update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ success: false, message: 'Failed to update registration' });
  }
});

// Update registration status
router.patch('/api/registrations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    let registration;
    
    // Try registrationId first (UUID)
    registration = await Registration.findOneAndUpdate(
      { registrationId: req.params.id },
      { 'metadata.status': status },
      { new: true }
    );
    
    if (!registration) {
      // Try registrationNumber
      registration = await Registration.findOneAndUpdate(
        { registrationNumber: req.params.id.toUpperCase() },
        { 'metadata.status': status },
        { new: true }
      );
    }
    
    if (!registration) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        registration = await Registration.findByIdAndUpdate(
          req.params.id,
          { 'metadata.status': status },
          { new: true }
        );
      }
    }

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
    let registration;
    
    // Try registrationId first (UUID)
    registration = await Registration.findOneAndDelete({ registrationId: req.params.id });
    
    if (!registration) {
      // Try registrationNumber
      registration = await Registration.findOneAndDelete({ registrationNumber: req.params.id.toUpperCase() });
    }
    
    if (!registration) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        registration = await Registration.findByIdAndDelete(req.params.id);
      }
    }

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

// Create new newsletter subscription
router.post('/api/newsletter', async (req, res) => {
  try {
    const { email, isActive, preferences } = req.body;

    // Check for duplicate subscription
    const existingSubscription = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already subscribed to newsletter'
      });
    }

    const subscriptionData = {
      email: email.toLowerCase(),
      isActive: isActive !== undefined ? isActive : true,
      preferences: preferences || { frequency: 'weekly' },
      metadata: {
        timestamp: new Date(),
        userAgent: req.get('User-Agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        source: 'dashboard_manual',
        sourcePage: 'dashboard',
        status: 'subscribed'
      }
    };

    const subscription = new Newsletter(subscriptionData);
    await subscription.save();

    logger.info(`New newsletter subscription created via dashboard: ${subscription.subscriptionId}`);
    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    logger.error('Dashboard newsletter creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create newsletter subscription' });
  }
});

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
    let subscription;
    
    // Try subscriptionId first (UUID)
    subscription = await Newsletter.findOne({ subscriptionId: req.params.id });
    
    if (!subscription) {
      // Try email
      subscription = await Newsletter.findOne({ email: req.params.id.toLowerCase() });
    }
    
    if (!subscription) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        subscription = await Newsletter.findById(req.params.id);
      }
    }
    
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
    
    let subscription;
    
    // Try subscriptionId first (UUID)
    subscription = await Newsletter.findOneAndUpdate(
      { subscriptionId: req.params.id },
      { email: email.toLowerCase(), isActive, preferences },
      { new: true, runValidators: true }
    );
    
    if (!subscription) {
      // Try email
      subscription = await Newsletter.findOneAndUpdate(
        { email: req.params.id.toLowerCase() },
        { email: email.toLowerCase(), isActive, preferences },
        { new: true, runValidators: true }
      );
    }
    
    if (!subscription) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        subscription = await Newsletter.findByIdAndUpdate(
          req.params.id,
          { email: email.toLowerCase(), isActive, preferences },
          { new: true, runValidators: true }
        );
      }
    }

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
    let subscription;
    
    // Try subscriptionId first (UUID)
    subscription = await Newsletter.findOneAndDelete({ subscriptionId: req.params.id });
    
    if (!subscription) {
      // Try email
      subscription = await Newsletter.findOneAndDelete({ email: req.params.id.toLowerCase() });
    }
    
    if (!subscription) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        subscription = await Newsletter.findByIdAndDelete(req.params.id);
      }
    }

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

// ============= CONTACT REPLY =============

// Send reply to contact
router.post('/api/contacts/:id/reply', async (req, res) => {
  try {
    const { replyMessage } = req.body;
    
    // Get the contact
    const contact = await Contact.findOne({ 
      $or: [{ _id: req.params.id }, { contactId: req.params.id }] 
    });
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    // Send reply email
    const mailOptions = {
      from: `"The Tech Grid Series" <${process.env.FROM_EMAIL}>`,
      to: contact.email,
      subject: `Re: ${contact.subject}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2b3eb3;">Response to Your Message</h2>
              <p>Dear ${contact.name},</p>
              <p>Thank you for reaching out to us. Here's our response:</p>
              <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #13cb13; margin: 20px 0;">
                ${replyMessage}
              </div>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0;">Your Original Message:</h4>
                <p><strong>Subject:</strong> ${contact.subject}</p>
                <p>${contact.message}</p>
              </div>
              <p>If you have any further questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>The Tech Grid Series Team</p>
            </div>
          </body>
        </html>
      `
    };

    await emailService.transporter.sendMail(mailOptions);

    // Update contact status
    contact.status = 'responded';
    contact.emailSent = true;
    contact.emailSentAt = new Date();
    await contact.save();

    logger.info(`Reply sent to contact: ${contact.contactId}`);
    res.json({ success: true, message: 'Reply sent successfully', data: contact });
  } catch (error) {
    logger.error('Failed to send reply:', error);
    res.status(500).json({ success: false, message: 'Failed to send reply' });
  }
});

// ============= REGISTRATION TO NEWSLETTER =============

// Add registration to newsletter
router.post('/api/registrations/:id/add-to-newsletter', async (req, res) => {
  try {
    // Get the registration
    let registration;
    
    // Try registrationId first (UUID)
    registration = await Registration.findOne({ registrationId: req.params.id });
    
    if (!registration) {
      // Try registrationNumber
      registration = await Registration.findOne({ registrationNumber: req.params.id.toUpperCase() });
    }
    
    if (!registration) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        registration = await Registration.findById(req.params.id);
      }
    }
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // Check if already subscribed
    const existingSubscription = await Newsletter.findOne({ email: registration.email.toLowerCase() });
    
    if (existingSubscription) {
      // Reactivate if inactive
      if (!existingSubscription.isActive) {
        existingSubscription.isActive = true;
        existingSubscription.metadata.status = 'subscribed';
        await existingSubscription.save();
        return res.json({ 
          success: true, 
          message: 'Newsletter subscription reactivated',
          data: existingSubscription 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: 'This email is already subscribed to the newsletter' 
      });
    }

    // Create newsletter subscription
    const subscriptionData = {
      email: registration.email.toLowerCase(),
      isActive: true,
      preferences: { 
        frequency: 'weekly',
        topics: ['event-updates', 'industry-insights']
      },
      metadata: {
        timestamp: new Date(),
        userAgent: '',
        ipAddress: '',
        source: 'dashboard_registration',
        sourcePage: 'registration',
        status: 'subscribed'
      },
      tags: ['from-registration']
    };

    const subscription = new Newsletter(subscriptionData);
    await subscription.save();

    // Update registration
    registration.newsletter = true;
    registration.metadata.inNewsletter = true;
    await registration.save();

    logger.info(`Registration ${registration.registrationId} added to newsletter`);
    
    // Send welcome email
    try {
      await emailService.sendNewsletterWelcome(subscription);
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      success: true, 
      message: 'Successfully added to newsletter',
      data: subscription 
    });
  } catch (error) {
    logger.error('Failed to add to newsletter:', error);
    res.status(500).json({ success: false, message: 'Failed to add to newsletter' });
  }
});

// ============= EMAIL TEMPLATES =============

// Get all email templates
router.get('/api/email-templates', async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('Failed to fetch templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
});

// Save email template
router.post('/api/email-templates', async (req, res) => {
  try {
    const { subject, body } = req.body;
    
    const template = new EmailTemplate({ subject, body });
    await template.save();
    
    logger.info('Email template saved');
    res.json({ success: true, data: template });
  } catch (error) {
    logger.error('Failed to save template:', error);
    res.status(500).json({ success: false, message: 'Failed to save template' });
  }
});

// ============= BULK EMAIL =============

// Simple bulk email endpoint for dashboard
router.post('/api/newsletter/bulk-email', async (req, res) => {
  try {
    const { subject, body } = req.body;
    
    // Get all active subscribers
    const subscribers = await Newsletter.find({ 
      isActive: true,
      'metadata.status': 'subscribed'
    }).select('email');
    
    if (subscribers.length === 0) {
      return res.status(400).json({ success: false, message: 'No active subscribers' });
    }
    
    let sent = 0;
    let failed = 0;
    
    // Send emails
    for (const subscriber of subscribers) {
      try {
        const mailOptions = {
          from: `"The Tech Grid Series" <${process.env.FROM_EMAIL}>`,
          to: subscriber.email,
          subject: subject,
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #2b3eb3 0%, #063306 100%); padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">The Tech Grid Series</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                  ${body}
                </div>
                <div style="padding: 20px; text-align: center; background: #e9ecef; font-size: 0.9rem; color: #6c757d;">
                  <p>You're receiving this because you subscribed to The Tech Grid Series newsletter.</p>
                  <p><a href="https://techgrid-server-9zjv.onrender.com/unsubscribe?email=${subscriber.email}" style="color: #2b3eb3;">Unsubscribe</a></p>
                </div>
              </body>
            </html>
          `
        };
        
        await emailService.transporter.sendMail(mailOptions);
        sent++;
      } catch (error) {
        failed++;
        logger.error(`Failed to send to ${subscriber.email}:`, error);
      }
    }
    
    logger.info(`Bulk email completed: ${sent}/${subscribers.length} sent`);
    res.json({ 
      success: true, 
      message: `Bulk email sent successfully`,
      count: sent,
      failed: failed,
      total: subscribers.length 
    });
  } catch (error) {
    logger.error('Bulk email failed:', error);
    res.status(500).json({ success: false, message: 'Bulk email failed' });
  }
});

// Send bulk email to all active subscribers (with SSE for progress)
router.post('/api/newsletter/bulk-email-stream', upload.array('attachments', 5), async (req, res) => {
  try {
    const { subject, body } = req.body;
    const attachments = req.files || [];
    
    // Get all active subscribers
    const subscribers = await Newsletter.find({ 
      isActive: true,
      'metadata.status': 'subscribed'
    }).select('email');
    
    if (subscribers.length === 0) {
      return res.status(400).json({ success: false, message: 'No active subscribers' });
    }
    
    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let sent = 0;
    let failed = 0;
    const failedEmails = [];
    
    // Send emails one by one with progress updates
    for (const subscriber of subscribers) {
      try {
        const mailOptions = {
          from: `"The Tech Grid Series" <${process.env.FROM_EMAIL}>`,
          to: subscriber.email,
          subject: subject,
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #2b3eb3 0%, #063306 100%); padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">The Tech Grid Series</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                  ${body}
                </div>
                <div style="padding: 20px; text-align: center; background: #e9ecef; font-size: 0.9rem; color: #6c757d;">
                  <p>You're receiving this because you subscribed to The Tech Grid Series newsletter.</p>
                  <p><a href="https://techgrid-server-9zjv.onrender.com/unsubscribe?email=${subscriber.email}" style="color: #2b3eb3;">Unsubscribe</a></p>
                </div>
              </body>
            </html>
          `,
          attachments: attachments.map(file => ({
            filename: file.originalname,
            content: file.buffer
          }))
        };
        
        await emailService.transporter.sendMail(mailOptions);
        sent++;
        
        // Send progress update
        res.write(`data: ${JSON.stringify({ type: 'progress', sent, failed, total: subscribers.length })}\n\n`);
      } catch (error) {
        failed++;
        failedEmails.push(subscriber.email);
        logger.error(`Failed to send to ${subscriber.email}:`, error);
        
        res.write(`data: ${JSON.stringify({ type: 'failed', email: subscriber.email })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'progress', sent, failed, total: subscribers.length })}\n\n`);
      }
    }
    
    // Send completion
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      successful: sent, 
      failed: failed, 
      total: subscribers.length 
    })}\n\n`);
    
    res.end();
    
    logger.info(`Bulk email completed: ${sent}/${subscribers.length} sent`);
  } catch (error) {
    logger.error('Bulk email failed:', error);
    res.status(500).json({ success: false, message: 'Bulk email failed' });
  }
});

// Retry failed sends
router.post('/api/newsletter/bulk-email-retry', async (req, res) => {
  try {
    const { subject, body, recipients } = req.body;
    
    let sent = 0;
    const stillFailed = [];
    
    for (const email of recipients) {
      try {
        const mailOptions = {
          from: `"The Tech Grid Series" <${process.env.FROM_EMAIL}>`,
          to: email,
          subject: subject,
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #2b3eb3 0%, #063306 100%); padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">The Tech Grid Series</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                  ${body}
                </div>
                <div style="padding: 20px; text-align: center; background: #e9ecef; font-size: 0.9rem; color: #6c757d;">
                  <p>You're receiving this because you subscribed to The Tech Grid Series newsletter.</p>
                  <p><a href="https://techgrid-server-9zjv.onrender.com/unsubscribe?email=${email}" style="color: #2b3eb3;">Unsubscribe</a></p>
                </div>
              </body>
            </html>
          `
        };
        
        await emailService.transporter.sendMail(mailOptions);
        sent++;
      } catch (error) {
        stillFailed.push(email);
        logger.error(`Retry failed for ${email}:`, error);
      }
    }
    
    res.json({ 
      success: true, 
      successful: sent, 
      failed: stillFailed.length,
      stillFailed 
    });
  } catch (error) {
    logger.error('Retry failed:', error);
    res.status(500).json({ success: false, message: 'Retry failed' });
  }
});

// ============= NEWSLETTER SUBSCRIPTION MANAGEMENT =============

// Unsubscribe from newsletter
router.post('/api/newsletter/:id/unsubscribe', async (req, res) => {
  try {
    let subscription;
    
    // Try subscriptionId first (UUID)
    subscription = await Newsletter.findOne({ subscriptionId: req.params.id });
    
    if (!subscription) {
      // Try email
      subscription = await Newsletter.findOne({ email: req.params.id.toLowerCase() });
    }
    
    if (!subscription) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        subscription = await Newsletter.findById(req.params.id);
      }
    }
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Newsletter subscription not found' });
    }

    // Update subscription status
    subscription.isActive = false;
    subscription.metadata.status = 'unsubscribed';
    subscription.metadata.unsubscribedAt = new Date();
    await subscription.save();

    logger.info(`Newsletter subscription unsubscribed via dashboard: ${subscription.subscriptionId}`);
    res.json({ 
      success: true, 
      message: 'Successfully unsubscribed from newsletter',
      data: subscription 
    });
  } catch (error) {
    logger.error('Dashboard newsletter unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe from newsletter' });
  }
});

// Resubscribe to newsletter
router.post('/api/newsletter/:id/resubscribe', async (req, res) => {
  try {
    let subscription;
    
    // Try subscriptionId first (UUID)
    subscription = await Newsletter.findOne({ subscriptionId: req.params.id });
    
    if (!subscription) {
      // Try email
      subscription = await Newsletter.findOne({ email: req.params.id.toLowerCase() });
    }
    
    if (!subscription) {
      // Only try _id if it looks like a valid ObjectId
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        subscription = await Newsletter.findById(req.params.id);
      }
    }
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Newsletter subscription not found' });
    }

    // Update subscription status
    subscription.isActive = true;
    subscription.metadata.status = 'subscribed';
    subscription.metadata.resubscribedAt = new Date();
    await subscription.save();

    logger.info(`Newsletter subscription resubscribed via dashboard: ${subscription.subscriptionId}`);
    res.json({ 
      success: true, 
      message: 'Successfully resubscribed to newsletter',
      data: subscription 
    });
  } catch (error) {
    logger.error('Dashboard newsletter resubscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to resubscribe to newsletter' });
  }
});

module.exports = router;
