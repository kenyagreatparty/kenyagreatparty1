const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  idNumber: {
    type: String,
    required: [true, 'National ID number is required'],
    unique: true,
    match: [/^\d{8}$/, 'National ID must be 8 digits']
  },
  county: {
    type: String,
    required: [true, 'County is required'],
    enum: [
      'baringo', 'bomet', 'bungoma', 'busia', 'elgeyo_marakwet', 'embu',
      'garissa', 'homa_bay', 'isiolo', 'kajiado', 'kakamega', 'kericho',
      'kiambu', 'kilifi', 'kirinyaga', 'kisii', 'kisumu', 'kitui', 'kwale',
      'laikipia', 'lamu', 'machakos', 'makueni', 'mandera', 'marsabit',
      'meru', 'migori', 'mombasa', 'muranga', 'nairobi', 'nakuru', 'nandi',
      'narok', 'nyamira', 'nyandarua', 'nyeri', 'samburu', 'siaya',
      'taita_taveta', 'tana_river', 'tharaka_nithi', 'trans_nzoia',
      'turkana', 'uasin_gishu', 'vihiga', 'wajir', 'west_pokot'
    ]
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    maxlength: [500, 'Review notes cannot exceed 500 characters']
  },
  membershipNumber: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Indexes
membershipSchema.index({ email: 1 });
membershipSchema.index({ idNumber: 1 });
membershipSchema.index({ status: 1 });
membershipSchema.index({ county: 1 });

// Virtual for full name
membershipSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Generate membership number before saving
membershipSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'approved' && !this.membershipNumber) {
    const count = await this.constructor.countDocuments({ status: 'approved' });
    this.membershipNumber = `KGP${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Membership', membershipSchema);
