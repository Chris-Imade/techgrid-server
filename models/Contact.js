const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const contactSchema = new mongoose.Schema({
  contactId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  metadata: {
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
      default: 'contact_form'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'responded'],
    default: 'pending'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  adminNotified: {
    type: Boolean,
    default: false
  },
  adminNotifiedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
contactSchema.index({ email: 1 });
contactSchema.index({ 'metadata.timestamp': -1 });
contactSchema.index({ status: 1 });
contactSchema.index({ contactId: 1 });

// Virtual for formatted timestamp
contactSchema.virtual('formattedDate').get(function() {
  return this.metadata.timestamp.toLocaleDateString();
});

// Pre-save middleware to set metadata
contactSchema.pre('save', function(next) {
  if (this.isNew) {
    this.metadata.timestamp = new Date();
  }
  next();
});

module.exports = mongoose.model('Contact', contactSchema);
