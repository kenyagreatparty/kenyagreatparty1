const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
exports.validateUser = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
];

// Login validation rules
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Membership validation rules
exports.validateMembership = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('idNumber')
    .matches(/^\d{8}$/)
    .withMessage('National ID must be exactly 8 digits'),
  body('county')
    .isIn([
      'baringo', 'bomet', 'bungoma', 'busia', 'elgeyo_marakwet', 'embu',
      'garissa', 'homa_bay', 'isiolo', 'kajiado', 'kakamega', 'kericho',
      'kiambu', 'kilifi', 'kirinyaga', 'kisii', 'kisumu', 'kitui', 'kwale',
      'laikipia', 'lamu', 'machakos', 'makueni', 'mandera', 'marsabit',
      'meru', 'migori', 'mombasa', 'muranga', 'nairobi', 'nakuru', 'nandi',
      'narok', 'nyamira', 'nyandarua', 'nyeri', 'samburu', 'siaya',
      'taita_taveta', 'tana_river', 'tharaka_nithi', 'trans_nzoia',
      'turkana', 'uasin_gishu', 'vihiga', 'wajir', 'west_pokot'
    ])
    .withMessage('Please select a valid county'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
];

// Contact validation rules
exports.validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
];

// News validation rules
exports.validateNews = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('excerpt')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Excerpt must be between 10 and 500 characters'),
  body('content')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  body('category')
    .isIn([
      'party-news', 'policy-updates', 'community-outreach', 'youth-initiatives',
      'economic-development', 'environmental-issues', 'healthcare', 'education',
      'infrastructure', 'governance'
    ])
    .withMessage('Please select a valid category'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived')
];

// Event validation rules
exports.validateEvent = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Description must be at least 50 characters'),
  body('shortDescription')
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage('Short description must be between 10 and 300 characters'),
  body('eventType')
    .isIn([
      'conference', 'seminar', 'workshop', 'rally', 'meeting', 'fundraiser',
      'community-outreach', 'youth-event', 'women-event', 'other'
    ])
    .withMessage('Please select a valid event type'),
  body('startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid start time (HH:MM format)'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid end time (HH:MM format)'),
  body('location.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location name must be between 2 and 100 characters'),
  body('location.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Location address must be between 5 and 200 characters'),
  body('location.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('location.county')
    .isIn([
      'baringo', 'bomet', 'bungoma', 'busia', 'elgeyo_marakwet', 'embu',
      'garissa', 'homa_bay', 'isiolo', 'kajiado', 'kakamega', 'kericho',
      'kiambu', 'kilifi', 'kirinyaga', 'kisii', 'kisumu', 'kitui', 'kwale',
      'laikipia', 'lamu', 'machakos', 'makueni', 'mandera', 'marsabit',
      'meru', 'migori', 'mombasa', 'muranga', 'nairobi', 'nakuru', 'nandi',
      'narok', 'nyamira', 'nyandarua', 'nyeri', 'samburu', 'siaya',
      'taita_taveta', 'tana_river', 'tharaka_nithi', 'trans_nzoia',
      'turkana', 'uasin_gishu', 'vihiga', 'wajir', 'west_pokot'
    ])
    .withMessage('Please select a valid county')
];

// MongoDB ObjectId validation
exports.validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID format`)
];

// Pagination validation
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];
