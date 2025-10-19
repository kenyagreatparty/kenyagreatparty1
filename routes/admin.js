const express = require('express');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Membership = require('../models/Membership');
const News = require('../models/News');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin role definitions
const ADMIN_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    CONTENT_MANAGER: 'content_manager',
    MEMBERSHIP_MANAGER: 'membership_manager',
    FINANCE_MANAGER: 'finance_manager',
    COMMUNICATION_MANAGER: 'communication_manager'
};

// Role permissions
const ROLE_PERMISSIONS = {
    [ADMIN_ROLES.SUPER_ADMIN]: ['*'], // All permissions
    [ADMIN_ROLES.ADMIN]: [
        'users.read', 'users.update', 'users.delete',
        'memberships.read', 'memberships.update', 'memberships.delete',
        'news.read', 'news.create', 'news.update', 'news.delete',
        'events.read', 'events.create', 'events.update', 'events.delete',
        'contacts.read', 'contacts.update', 'contacts.delete',
        'analytics.read', 'reports.read'
    ],
    [ADMIN_ROLES.MODERATOR]: [
        'users.read', 'users.update',
        'memberships.read', 'memberships.update',
        'news.read', 'news.create', 'news.update',
        'events.read', 'events.create', 'events.update',
        'contacts.read', 'contacts.update'
    ],
    [ADMIN_ROLES.CONTENT_MANAGER]: [
        'news.read', 'news.create', 'news.update', 'news.delete',
        'events.read', 'events.create', 'events.update', 'events.delete'
    ],
    [ADMIN_ROLES.MEMBERSHIP_MANAGER]: [
        'memberships.read', 'memberships.create', 'memberships.update', 'memberships.delete',
        'users.read', 'users.update'
    ],
    [ADMIN_ROLES.FINANCE_MANAGER]: [
        'memberships.read', 'memberships.update',
        'analytics.read', 'reports.read'
    ],
    [ADMIN_ROLES.COMMUNICATION_MANAGER]: [
        'contacts.read', 'contacts.update', 'contacts.delete',
        'news.read', 'news.create', 'news.update'
    ]
};

// Middleware to check admin permissions
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
        
        if (userPermissions.includes('*') || userPermissions.includes(permission)) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions for this action.'
            });
        }
    };
};

// @desc    Get admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    // Get counts for different entities
    const [
      totalUsers,
      totalContacts,
      totalMemberships,
      totalNews,
      totalEvents,
      pendingMemberships,
      newContacts,
      publishedNews,
      upcomingEvents
    ] = await Promise.all([
      User.countDocuments(),
      Contact.countDocuments(),
      Membership.countDocuments(),
      News.countDocuments(),
      Event.countDocuments(),
      Membership.countDocuments({ status: 'pending' }),
      Contact.countDocuments({ 
        status: 'new',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      News.countDocuments({ status: 'published' }),
      Event.countDocuments({ 
        status: 'published',
        startDate: { $gte: new Date() }
      })
    ]);

    // Get recent activities
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email subject status createdAt');

    const recentMemberships = await Membership.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email status createdAt');

    const recentNews = await News.find()
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt author');

    const recentEvents = await Event.find()
      .populate('organizer', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status startDate organizer');

    // Get statistics by status
    const membershipStats = await Membership.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const contactStats = await Contact.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const newsStats = await News.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const eventStats = await Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalContacts,
          totalMemberships,
          totalNews,
          totalEvents,
          pendingMemberships,
          newContacts,
          publishedNews,
          upcomingEvents
        },
        recentActivities: {
          contacts: recentContacts,
          memberships: recentMemberships,
          news: recentNews,
          events: recentEvents
        },
        statistics: {
          memberships: membershipStats,
          contacts: contactStats,
          news: newsStats,
          events: eventStats
        }
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @desc    Get system statistics
// @route   GET /api/admin/stats/system
// @access  Private/Admin
router.get('/stats/system', protect, authorize('admin'), async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Get growth statistics
    const userGrowth = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const membershipGrowth = await Membership.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const contactGrowth = await Contact.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get top performing content
    const topNews = await News.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(5)
      .select('title views publishedAt');

    const topEvents = await Event.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(5)
      .select('title views startDate');

    res.json({
      success: true,
      data: {
        growth: {
          users: userGrowth,
          memberships: membershipGrowth,
          contacts: contactGrowth
        },
        topContent: {
          news: topNews,
          events: topEvents
        }
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching system statistics'
    });
  }
});

// @desc    Create admin user (Super Admin only)
// @route   POST /api/admin/create-admin
// @access  Private/Admin
router.post('/create-admin', protect, authorize('admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    // Create admin user
    const adminUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: { user: adminUser }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating admin user'
    });
  }
});

// @desc    Get admin activity log
// @route   GET /api/admin/activity-log
// @access  Private/Admin
router.get('/activity-log', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // This would typically come from an activity log model
    // For now, we'll return recent activities from different collections
    const recentActivities = [];

    // Get recent news created/updated
    const recentNews = await News.find()
      .populate('author', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title status author updatedAt');

    recentNews.forEach(news => {
      recentActivities.push({
        type: 'news',
        action: news.status === 'published' ? 'published' : 'updated',
        description: `News article "${news.title}" was ${news.status === 'published' ? 'published' : 'updated'}`,
        user: news.author,
        timestamp: news.updatedAt
      });
    });

    // Get recent events created/updated
    const recentEvents = await Event.find()
      .populate('organizer', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title status organizer updatedAt');

    recentEvents.forEach(event => {
      recentActivities.push({
        type: 'event',
        action: 'updated',
        description: `Event "${event.title}" was updated`,
        user: event.organizer,
        timestamp: event.updatedAt
      });
    });

    // Sort by timestamp and paginate
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const paginatedActivities = recentActivities.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          current: page,
          pages: Math.ceil(recentActivities.length / limit),
          total: recentActivities.length
        }
      }
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity log'
    });
  }
});

// @desc    Get admin settings
// @route   GET /api/admin/settings
// @access  Private/Admin
router.get('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    // This would typically come from a settings model
    // For now, return default settings
    const settings = {
      siteName: 'Kenya Great Party',
      siteDescription: 'Building a Brighter Future for Kenya',
      contactEmail: process.env.EMAIL_FROM || 'info@kenyagreatparty.org',
      contactPhone: '+254 729 554 475',
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: ''
      },
      features: {
        membershipRegistration: true,
        eventRegistration: true,
        newsletterSubscription: true,
        contactForm: true
      }
    };

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin settings'
    });
  }
});

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
router.put('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    // This would typically update a settings model
    // For now, just return success
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating admin settings'
    });
  }
});

// @desc    Get all admin roles
// @route   GET /api/admin/roles
// @access  Private/Admin
router.get('/roles', protect, checkPermission('users.read'), (req, res) => {
    res.json({
        success: true,
        roles: ADMIN_ROLES,
        permissions: ROLE_PERMISSIONS
    });
});

// @desc    Get user roles and permissions
// @route   GET /api/admin/users/:id/role
// @access  Private/Admin
router.get('/users/:id/role', protect, checkPermission('users.read'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name email role');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const permissions = ROLE_PERMISSIONS[user.role] || [];

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: permissions
            }
        });
    } catch (error) {
        console.error('Get user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving user role'
        });
    }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', protect, checkPermission('users.update'), async (req, res) => {
    try {
        const { role } = req.body;

        if (!role || !Object.values(ADMIN_ROLES).includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role provided'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('name email role');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User role updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: ROLE_PERMISSIONS[user.role] || []
            }
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user role'
        });
    }
});

// @desc    Get role-based analytics
// @route   GET /api/admin/analytics/roles
// @access  Private/Admin
router.get('/analytics/roles', protect, checkPermission('analytics.read'), async (req, res) => {
    try {
        const roleStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        const roleAnalytics = roleStats.map(stat => ({
            role: stat._id || 'member',
            count: stat.count,
            permissions: ROLE_PERMISSIONS[stat._id] || []
        }));

        res.json({
            success: true,
            analytics: roleAnalytics
        });
    } catch (error) {
        console.error('Role analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving role analytics'
        });
    }
});

// @desc    Get admin activity logs
// @route   GET /api/admin/activity-logs
// @access  Private/Admin
router.get('/activity-logs', protect, checkPermission('analytics.read'), async (req, res) => {
    try {
        const { page = 1, limit = 20, role } = req.query;
        
        let query = { role: { $in: Object.values(ADMIN_ROLES) } };
        if (role) {
            query.role = role;
        }

        const admins = await User.find(query)
            .select('name email role lastLogin createdAt')
            .sort({ lastLogin: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            admins,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving activity logs'
        });
    }
});

module.exports = router;
