const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach(error => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  next();
};

// Contact form validation rules
const contactValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name contains invalid characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail({ allow_utf8_local_part: true })
    .withMessage('Please provide a valid email address')
    .isLength({ max: 320 })
    .withMessage('Email cannot exceed 320 characters'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 7, max: 25 })
    .withMessage('Phone number must be between 7 and 25 characters')
    .matches(/^[\+]?[\d\s\-\(\)\.]{7,25}$/)
    .withMessage('Please provide a valid phone number (numbers, spaces, dashes, parentheses allowed)'),

  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),

  handleValidationErrors
];

// Registration form validation rules
const registrationValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name contains invalid characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name contains invalid characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail({ allow_utf8_local_part: true })
    .withMessage('Please provide a valid email address')
    .isLength({ max: 320 })
    .withMessage('Email cannot exceed 320 characters'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 7, max: 25 })
    .withMessage('Phone number must be between 7 and 25 characters')
    .matches(/^[\+]?[\d\s\-\(\)\.]{7,25}$/)
    .withMessage('Please provide a valid phone number (numbers, spaces, dashes, parentheses allowed)'),

  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),

  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title cannot exceed 100 characters'),

  body('experience')
    .notEmpty()
    .withMessage('Experience level is required')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Experience must be one of: beginner, intermediate, advanced, expert'),

  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array')
    .custom((interests) => {
      const validInterests = [
        'ai-trading',
        'risk-management',
        'fraud-detection',
        'robo-advisors',
        'regulatory-compliance'
      ];
      
      if (interests && interests.length > 0) {
        const invalidInterests = interests.filter(interest => !validInterests.includes(interest));
        if (invalidInterests.length > 0) {
          throw new Error(`Invalid interests: ${invalidInterests.join(', ')}`);
        }
      }
      return true;
    }),

  body('expectations')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Expectations cannot exceed 1000 characters'),

  body('newsletter')
    .optional()
    .isBoolean()
    .withMessage('Newsletter preference must be a boolean'),

  body('terms')
    .notEmpty()
    .withMessage('You must accept the terms and conditions')
    .isBoolean()
    .withMessage('Terms acceptance must be a boolean')
    .custom((value) => {
      if (value !== true) {
        throw new Error('Terms and conditions must be accepted');
      }
      return true;
    }),

  handleValidationErrors
];

// Newsletter subscription validation rules
const newsletterValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail({ allow_utf8_local_part: true })
    .withMessage('Please provide a valid email address')
    .isLength({ max: 320 })
    .withMessage('Email cannot exceed 320 characters'),

  handleValidationErrors
];

// Additional validation helpers
const sanitizeInput = (req, res, next) => {
  // Remove any HTML tags and trim whitespace
  const sanitizeString = (str) => {
    if (typeof str === 'string') {
      return str.replace(/<[^>]*>/g, '').trim();
    }
    return str;
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }

  next();
};

// Rate limiting for specific endpoints
const createRateLimit = (windowMs, max, message) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress;
    }
  });
};

// Specific rate limiters for each endpoint
const contactRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  parseInt(process.env.CONTACT_RATE_LIMIT) || 5,
  'Too many contact form submissions. Please try again in 15 minutes.'
);

const registrationRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  parseInt(process.env.REGISTRATION_RATE_LIMIT) || 3,
  'Too many registration attempts. Please try again in 1 hour.'
);

const newsletterRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  parseInt(process.env.NEWSLETTER_RATE_LIMIT) || 10,
  'Too many newsletter subscription attempts. Please try again in 1 hour.'
);

module.exports = {
  contactValidation,
  registrationValidation,
  newsletterValidation,
  sanitizeInput,
  contactRateLimit,
  registrationRateLimit,
  newsletterRateLimit,
  handleValidationErrors
};
