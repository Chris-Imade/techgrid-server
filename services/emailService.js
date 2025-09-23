const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true', // false for 587, true for 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          // Do not fail on invalid certs
          rejectUnauthorized: false
        }
      });

      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  loadTemplate(templateName) {
    try {
      const templateDir = process.env.TEMPLATE_DIR || './templates';
      const templatePath = path.join(__dirname, '..', templateDir, `${templateName}.html`);
      
      if (!fs.existsSync(templatePath)) {
        logger.warn(`Template not found: ${templatePath}, using default template`);
        return this.getDefaultTemplate(templateName);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf8');
      return handlebars.compile(templateSource);
    } catch (error) {
      logger.error(`Error loading template ${templateName}:`, error);
      return this.getDefaultTemplate(templateName);
    }
  }

  getDefaultTemplate(templateName) {
    const templates = {
      contact_auto_reply: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50;">Thank you for contacting us!</h2>
              <p>Dear {{name}},</p>
              <p>We have received your message and will get back to you within 24-48 hours.</p>
              <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                <h4>Your Message:</h4>
                <p><strong>Subject:</strong> {{subject}}</p>
                <p><strong>Message:</strong> {{message}}</p>
              </div>
              <p>Best regards,<br>The Tech Grid Series Team</p>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                This is an automated response. Please do not reply to this email.
              </p>
            </div>
          </body>
        </html>
      `,
      contact_admin_notification: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc3545;">New Contact Form Submission</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
                <p><strong>Name:</strong> {{name}}</p>
                <p><strong>Email:</strong> {{email}}</p>
                <p><strong>Phone:</strong> {{phone}}</p>
                <p><strong>Subject:</strong> {{subject}}</p>
                <p><strong>Message:</strong></p>
                <div style="background: white; padding: 15px; border-radius: 3px; margin: 10px 0;">
                  {{message}}
                </div>
                <p><strong>Submitted:</strong> {{timestamp}}</p>
                <p><strong>IP Address:</strong> {{ipAddress}}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      registration_confirmation: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #28a745;">Registration Confirmed!</h2>
              <p>Dear {{firstName}} {{lastName}},</p>
              <p>Thank you for registering for <strong>{{eventName}}</strong>!</p>
              <div style="background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3>Registration Details:</h3>
                <p><strong>Registration Number:</strong> {{registrationNumber}}</p>
                <p><strong>Event:</strong> {{eventName}}</p>
                <p><strong>Date:</strong> {{eventDate}}</p>
                <p><strong>Location:</strong> {{eventLocation}}</p>
                <p><strong>Experience Level:</strong> {{experience}}</p>
              </div>
              <p>We'll send you more details about the event as the date approaches.</p>
              <p>Best regards,<br>The Tech Grid Series Team</p>
            </div>
          </body>
        </html>
      `,
      registration_admin_notification: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #007bff;">New Conference Registration</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
                <p><strong>Name:</strong> {{firstName}} {{lastName}}</p>
                <p><strong>Email:</strong> {{email}}</p>
                <p><strong>Phone:</strong> {{phone}}</p>
                <p><strong>Company:</strong> {{company}}</p>
                <p><strong>Job Title:</strong> {{jobTitle}}</p>
                <p><strong>Experience:</strong> {{experience}}</p>
                <p><strong>Interests:</strong> {{interests}}</p>
                <p><strong>Registration Number:</strong> {{registrationNumber}}</p>
                <p><strong>Registered:</strong> {{timestamp}}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      newsletter_welcome: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #6f42c1;">Welcome to The Tech Grid Series Newsletter!</h2>
              <p>Thank you for subscribing to our newsletter!</p>
              <p>You'll receive updates about:</p>
              <ul>
                <li>Upcoming events and conferences</li>
                <li>Industry insights and trends</li>
                <li>AI and FinTech developments</li>
                <li>Exclusive content and resources</li>
              </ul>
              <p>Stay tuned for exciting content!</p>
              <p>Best regards,<br>The Tech Grid Series Team</p>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                You can unsubscribe at any time by clicking 
                <a href="{{unsubscribeUrl}}">here</a>.
              </p>
            </div>
          </body>
        </html>
      `,
      newsletter_admin_notification: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #6f42c1;">New Newsletter Subscription</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
                <p><strong>Email:</strong> {{email}}</p>
                <p><strong>Subscribed:</strong> {{timestamp}}</p>
                <p><strong>Source Page:</strong> {{sourcePage}}</p>
                <p><strong>IP Address:</strong> {{ipAddress}}</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    const templateSource = templates[templateName] || templates.contact_auto_reply;
    return handlebars.compile(templateSource);
  }

  async sendContactAutoReply(contactData) {
    try {
      const template = this.loadTemplate('contact_auto_reply');
      const html = template({
        name: contactData.name,
        subject: contactData.subject,
        message: contactData.message,
        timestamp: new Date().toLocaleString()
      });

      const mailOptions = {
        from: `"The Tech Grid Series" <${process.env.FROM_EMAIL}>`,
        to: contactData.email,
        subject: 'Thank you for contacting us - The Tech Grid Series',
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Contact auto-reply sent to ${contactData.email}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Failed to send contact auto-reply:', error);
      throw error;
    }
  }

  async sendContactAdminNotification(contactData) {
    try {
      const template = this.loadTemplate('contact_admin_notification');
      const html = template({
        ...contactData,
        timestamp: new Date().toLocaleString()
      });

      const mailOptions = {
        from: `"Tech Grid Contact Form" <${process.env.FROM_EMAIL}>`,
        to: [process.env.ADMIN_EMAIL_1, process.env.ADMIN_EMAIL_2],
        replyTo: contactData.email,
        subject: `New Contact Form Submission: ${contactData.subject}`,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Contact admin notification sent', { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Failed to send contact admin notification:', error);
      throw error;
    }
  }

  async sendRegistrationConfirmation(registrationData) {
    try {
      const template = this.loadTemplate('registration_confirmation');
      const html = template({
        ...registrationData,
        eventName: process.env.EVENT_NAME,
        eventDate: process.env.EVENT_DATE,
        eventLocation: process.env.EVENT_LOCATION,
        timestamp: new Date().toLocaleString()
      });

      const mailOptions = {
        from: `"The Tech Grid Series" <${process.env.FROM_EMAIL}>`,
        to: registrationData.email,
        subject: 'Registration Confirmed: The Tech Grid Series - AI in Finance',
        html: html
      };

      // Add attachment if available
      const attachmentPath = path.join(__dirname, '..', process.env.ATTACHMENT_DIR || './assets/documents', 'event_details.pdf');
      if (fs.existsSync(attachmentPath)) {
        mailOptions.attachments = [{
          filename: 'event_details.pdf',
          path: attachmentPath
        }];
      }

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Registration confirmation sent to ${registrationData.email}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Failed to send registration confirmation:', error);
      throw error;
    }
  }

  async sendRegistrationAdminNotification(registrationData) {
    try {
      const template = this.loadTemplate('registration_admin_notification');
      const html = template({
        ...registrationData,
        interests: Array.isArray(registrationData.interests) ? registrationData.interests.join(', ') : registrationData.interests,
        timestamp: new Date().toLocaleString()
      });

      const mailOptions = {
        from: `"Tech Grid Registration" <${process.env.FROM_EMAIL}>`,
        to: [process.env.ADMIN_EMAIL_1, process.env.ADMIN_EMAIL_2],
        subject: `New Conference Registration: ${registrationData.firstName} ${registrationData.lastName}`,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Registration admin notification sent', { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Failed to send registration admin notification:', error);
      throw error;
    }
  }

  async sendNewsletterWelcome(subscriberData) {
    try {
      const template = this.loadTemplate('newsletter_welcome');
      const html = template({
        email: subscriberData.email,
        unsubscribeUrl: `${process.env.APP_URL}/api/newsletter/unsubscribe?token=${subscriberData.subscriptionId}`,
        timestamp: new Date().toLocaleString()
      });

      const mailOptions = {
        from: `"The Tech Grid Series" <${process.env.FROM_EMAIL}>`,
        to: subscriberData.email,
        subject: 'Welcome to The Tech Grid Series Newsletter!',
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Newsletter welcome email sent to ${subscriberData.email}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Failed to send newsletter welcome email:', error);
      throw error;
    }
  }

  async sendNewsletterAdminNotification(subscriberData) {
    try {
      const template = this.loadTemplate('newsletter_admin_notification');
      const html = template({
        ...subscriberData,
        timestamp: new Date().toLocaleString()
      });

      const mailOptions = {
        from: `"Tech Grid Newsletter" <${process.env.FROM_EMAIL}>`,
        to: process.env.ADMIN_EMAIL_1,
        subject: 'New Newsletter Subscription',
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Newsletter admin notification sent', { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Failed to send newsletter admin notification:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
