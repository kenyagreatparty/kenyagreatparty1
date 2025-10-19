const express = require('express');
const Membership = require('../models/Membership');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validateMembership, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// @desc    Submit membership application
// @route   POST /api/membership
// @access  Public
router.post('/', validateMembership, handleValidationErrors, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, idNumber, county, message } = req.body;

    // Check if application already exists
    const existingApplication = await Membership.findOne({
      $or: [
        { email },
        { idNumber }
      ]
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'An application with this email or ID number already exists'
      });
    }

    // Create membership application
    const membership = await Membership.create({
      firstName,
      lastName,
      email,
      phone,
      idNumber,
      county,
      message
    });

    // Send email notification to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@kenyagreatparty.org',
        subject: 'New KGP Membership Application',
        html: `
          <h2>New KGP Membership Application</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>ID Number:</strong> ${idNumber}</p>
          <p><strong>County:</strong> ${county}</p>
          <p><strong>Message:</strong></p>
          <p>${message || 'No additional message provided'}</p>
          <hr>
          <p><small>Submitted on: ${new Date().toLocaleString()}</small></p>
          <p><a href="${process.env.FRONTEND_URL}/admin/memberships">Review Application</a></p>
        `
      });

      // Send confirmation email to applicant
      await sendEmail({
        to: email,
        subject: 'KGP Membership Application Received',
        html: `
          <h2>Thank you for your KGP Membership Application!</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>We have received your membership application for the Kenya Great Party. Your application is currently under review.</p>
          <p><strong>Application Details:</strong></p>
          <ul>
            <li><strong>Name:</strong> ${firstName} ${lastName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>County:</strong> ${county}</li>
            <li><strong>Status:</strong> Under Review</li>
          </ul>
          <p>We will review your application and get back to you within 5-7 business days. If you have any questions, please don't hesitate to contact us.</p>
          <hr>
          <p>Best regards,<br>Kenya Great Party Membership Team</p>
        `
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Your membership application has been submitted successfully. We will review it and get back to you soon.',
      data: { membership }
    });
  } catch (error) {
    console.error('Membership application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing your application'
    });
  }
});

// @desc    Get all membership applications (Admin only)
// @route   GET /api/membership
// @access  Private/Admin
router.get('/', protect, authorize('admin'), validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, county } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (county) filter.county = county;

    const memberships = await Membership.find(filter)
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Membership.countDocuments(filter);

    res.json({
      success: true,
      data: {
        memberships,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get memberships error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching membership applications'
    });
  }
});

// @desc    Get single membership application (Admin only)
// @route   GET /api/membership/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id)
      .populate('reviewedBy', 'firstName lastName email');

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership application not found'
      });
    }

    res.json({
      success: true,
      data: { membership }
    });
  } catch (error) {
    console.error('Get membership error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching membership application'
    });
  }
});

// @desc    Review membership application (Admin only)
// @route   PUT /api/membership/:id/review
// @access  Private/Admin
router.put('/:id/review', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership application not found'
      });
    }

    // Update membership application
    membership.status = status;
    membership.reviewNotes = reviewNotes;
    membership.reviewedBy = req.user._id;
    membership.reviewedAt = new Date();

    // Generate membership number if approved
    if (status === 'approved' && !membership.membershipNumber) {
      const count = await Membership.countDocuments({ status: 'approved' });
      membership.membershipNumber = `KGP${String(count + 1).padStart(6, '0')}`;
    }

    await membership.save();

    // Send email notification to applicant
    try {
      const subject = status === 'approved' 
        ? 'Congratulations! Your KGP Membership Application has been Approved'
        : 'KGP Membership Application Update';

      const html = status === 'approved' 
        ? `
          <h2>Congratulations! Welcome to Kenya Great Party!</h2>
          <p>Dear ${membership.firstName} ${membership.lastName},</p>
          <p>We are pleased to inform you that your membership application has been <strong>APPROVED</strong>!</p>
          <p><strong>Your Membership Details:</strong></p>
          <ul>
            <li><strong>Name:</strong> ${membership.firstName} ${membership.lastName}</li>
            <li><strong>Membership Number:</strong> ${membership.membershipNumber}</li>
            <li><strong>County:</strong> ${membership.county}</li>
            <li><strong>Status:</strong> Active Member</li>
          </ul>
          <p>As a member of Kenya Great Party, you now have access to:</p>
          <ul>
            <li>Participate in party activities and events</li>
            <li>Vote in party elections</li>
            <li>Contribute to policy discussions</li>
            <li>Access member-only resources</li>
          </ul>
          <p>We look forward to working with you to build a better Kenya!</p>
          <hr>
          <p>Best regards,<br>Kenya Great Party Membership Team</p>
        `
        : `
          <h2>KGP Membership Application Update</h2>
          <p>Dear ${membership.firstName} ${membership.lastName},</p>
          <p>Thank you for your interest in joining the Kenya Great Party. After careful review, we regret to inform you that your membership application has not been approved at this time.</p>
          <p><strong>Review Notes:</strong></p>
          <p>${reviewNotes || 'No specific notes provided.'}</p>
          <p>We encourage you to reapply in the future. If you have any questions about this decision, please contact us.</p>
          <hr>
          <p>Best regards,<br>Kenya Great Party Membership Team</p>
        `;

      await sendEmail({
        to: membership.email,
        subject,
        html
      });
    } catch (emailError) {
      console.error('Review email error:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: `Membership application ${status} successfully`,
      data: { membership }
    });
  } catch (error) {
    console.error('Review membership error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reviewing membership application'
    });
  }
});

// @desc    Get membership statistics (Admin only)
// @route   GET /api/membership/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Membership.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const countyStats = await Membership.aggregate([
      {
        $group: {
          _id: '$county',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const totalApplications = await Membership.countDocuments();
    const approvedMembers = await Membership.countDocuments({ status: 'approved' });
    const pendingApplications = await Membership.countDocuments({ status: 'pending' });
    const todayApplications = await Membership.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    res.json({
      success: true,
      data: {
        total: totalApplications,
        approved: approvedMembers,
        pending: pendingApplications,
        today: todayApplications,
        byStatus: stats,
        topCounties: countyStats
      }
    });
  } catch (error) {
    console.error('Get membership stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching membership statistics'
    });
  }
});

// @desc    Check application status (Public)
// @route   GET /api/membership/status/:email
// @access  Public
router.get('/status/:email', async (req, res) => {
  try {
    const membership = await Membership.findOne({ 
      email: req.params.email 
    }).select('firstName lastName status membershipNumber reviewedAt');

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'No application found with this email address'
      });
    }

    res.json({
      success: true,
      data: { membership }
    });
  } catch (error) {
    console.error('Check membership status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking application status'
    });
  }
});

module.exports = router;
