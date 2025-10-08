const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const newsletterSchema = new mongoose.Schema({
  subscriptionId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  metadata: {
    subscriptionId: {
      type: String,
      default: function() { return this.subscriptionId; }
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
      default: 'newsletter_subscription'
    },
    sourcePage: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed', 'bounced'],
      default: 'subscribed'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  welcomeEmailSent: {
    type: Boolean,
    default: false
  },
  welcomeEmailSentAt: {
    type: Date
  },
  adminNotified: {
    type: Boolean,
    default: false
  },
  adminNotifiedAt: {
    type: Date
  },
  unsubscribedAt: {
    type: Date
  },
  unsubscribeReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Unsubscribe reason cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  preferences: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    topics: [{
      type: String,
      enum: [
        'ai-finance',
        'trading-technology',
        'fintech-news',
        'event-updates',
        'industry-insights'
      ]
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ subscriptionId: 1 });
newsletterSchema.index({ 'metadata.timestamp': -1 });
newsletterSchema.index({ 'metadata.status': 1 });
newsletterSchema.index({ isActive: 1 });

// Virtual for subscription status
newsletterSchema.virtual('subscriptionStatus').get(function() {
  if (!this.isActive) return 'inactive';
  return this.metadata.status;
});

// Virtual for formatted subscription date
newsletterSchema.virtual('formattedSubscriptionDate').get(function() {
  return this.metadata.timestamp.toLocaleDateString();
});

// Pre-save middleware
newsletterSchema.pre('save', function(next) {
  if (this.isNew) {
    this.metadata.timestamp = new Date();
    // Set default preferences for new subscribers
    if (!this.preferences.topics || this.preferences.topics.length === 0) {
      this.preferences.topics = ['event-updates', 'industry-insights'];
    }
  }
  
  // Update unsubscribed timestamp
  if (this.isModified('metadata.status') && this.metadata.status === 'unsubscribed') {
    this.unsubscribedAt = new Date();
    this.isActive = false;
  }
  
  next();
});

// Static method to find active subscribers
newsletterSchema.statics.findActiveSubscribers = function() {
  return this.find({ 
    isActive: true, 
    'metadata.status': 'subscribed' 
  });
};

// Static method to subscribe email
newsletterSchema.statics.subscribeEmail = async function(email, metadata = {}) {
  try {
    // Check if email already exists
    const existing = await this.findOne({ email });
    
    if (existing) {
      if (existing.isActive && existing.metadata.status === 'subscribed') {
        throw new Error('Email is already subscribed to newsletter');
      } else {
        // Reactivate subscription
        existing.isActive = true;
        existing.metadata.status = 'subscribed';
        existing.metadata.timestamp = new Date();
        existing.unsubscribedAt = undefined;
        existing.unsubscribeReason = undefined;
        
        // Update metadata if provided
        Object.keys(metadata).forEach(key => {
          if (existing.metadata[key] !== undefined) {
            existing.metadata[key] = metadata[key];
          }
        });
        
        return await existing.save();
      }
    } else {
      // Create new subscription
      return await this.create({
        email,
        metadata: {
          ...metadata,
          timestamp: new Date()
        }
      });
    }
  } catch (error) {
    throw error;
  }
};

// Handle duplicate email error
newsletterSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    if (error.keyPattern.email) {
      next(new Error('Email address is already subscribed to newsletter'));
    } else {
      next(error);
    }
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
