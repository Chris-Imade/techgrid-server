const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const registrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
    match: [/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    match: [/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    maxlength: [255, 'Email cannot exceed 255 characters'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    minlength: [10, 'Phone number must be at least 10 characters'],
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
    default: ''
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters'],
    default: ''
  },
  experience: {
    type: String,
    required: [true, 'Experience level is required'],
    enum: {
      values: ['beginner', 'intermediate', 'advanced', 'expert'],
      message: 'Experience must be one of: beginner, intermediate, advanced, expert'
    }
  },
  interests: [{
    type: String,
    enum: {
      values: [
        'ai-trading',
        'risk-management',
        'fraud-detection',
        'robo-advisors',
        'regulatory-compliance'
      ],
      message: 'Invalid interest selected'
    }
  }],
  expectations: {
    type: String,
    trim: true,
    maxlength: [1000, 'Expectations cannot exceed 1000 characters'],
    default: ''
  },
  newsletter: {
    type: Boolean,
    default: false
  },
  terms: {
    type: Boolean,
    required: [true, 'You must accept the terms and conditions'],
    validate: {
      validator: function(v) {
        return v === true;
      },
      message: 'Terms and conditions must be accepted'
    }
  },
  metadata: {
    registrationId: {
      type: String,
      default: function() { return this.registrationId; }
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userAgent: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      default: 'conference_registration'
    },
    eventId: {
      type: String,
      default: process.env.EVENT_ID || 'tech_grid_ai_finance_2025'
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'cancelled', 'attended'],
      default: 'registered'
    }
  },
  confirmationEmailSent: {
    type: Boolean,
    default: false
  },
  confirmationEmailSentAt: {
    type: Date
  },
  adminNotified: {
    type: Boolean,
    default: false
  },
  adminNotifiedAt: {
    type: Date
  },
  registrationNumber: {
    type: String,
    unique: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
registrationSchema.index({ email: 1 });
registrationSchema.index({ registrationId: 1 });
registrationSchema.index({ 'metadata.timestamp': -1 });
registrationSchema.index({ 'metadata.status': 1 });
registrationSchema.index({ registrationNumber: 1 });

// Virtual for full name
registrationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted registration number
registrationSchema.virtual('formattedRegistrationNumber').get(function() {
  return this.registrationNumber || `TGS-${this.registrationId.slice(-8).toUpperCase()}`;
});

// Pre-save middleware to generate registration number
registrationSchema.pre('save', function(next) {
  if (this.isNew) {
    this.metadata.timestamp = new Date();
    if (!this.registrationNumber) {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.registrationNumber = `TGS${year}${randomNum}`;
    }
  }
  next();
});

// Handle duplicate email error
registrationSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    if (error.keyPattern.email) {
      next(new Error('Email address is already registered for this event'));
    } else if (error.keyPattern.registrationNumber) {
      // Retry with new registration number
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.registrationNumber = `TGS${year}${randomNum}`;
      this.save().then(() => next()).catch(next);
    } else {
      next(error);
    }
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Registration', registrationSchema);
