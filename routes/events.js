const express = require('express');
const Event = require('../models/Event');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validateEvent, validatePagination, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all published events
// @route   GET /api/events
// @access  Public
router.get('/', validatePagination, handleValidationErrors, optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { eventType, county, featured, upcoming, search } = req.query;

    // Build filter for published events only
    const filter = { status: 'published' };
    
    if (eventType) filter.eventType = eventType;
    if (county) filter['location.county'] = county;
    if (featured === 'true') filter.featured = true;
    if (upcoming === 'true') {
      filter.startDate = { $gte: new Date() };
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.name': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(filter)
      .populate('organizer', 'firstName lastName')
      .select('-description') // Exclude full description for list view
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
});

// @desc    Get single event
// @route   GET /api/events/:slug
// @access  Public
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    }).populate('organizer', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Increment view count
    event.views += 1;
    await event.save();

    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  }
});

// @desc    Get featured events
// @route   GET /api/events/featured/list
// @access  Public
router.get('/featured/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;

    const featuredEvents = await Event.find({ 
      status: 'published', 
      featured: true,
      startDate: { $gte: new Date() }
    })
      .populate('organizer', 'firstName lastName')
      .select('-description')
      .sort({ startDate: 1 })
      .limit(limit);

    res.json({
      success: true,
      data: { events: featuredEvents }
    });
  } catch (error) {
    console.error('Get featured events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured events'
    });
  }
});

// @desc    Get upcoming events
// @route   GET /api/events/upcoming/list
// @access  Public
router.get('/upcoming/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const upcomingEvents = await Event.find({
      status: 'published',
      startDate: { $gte: new Date() }
    })
      .populate('organizer', 'firstName lastName')
      .select('-description')
      .sort({ startDate: 1 })
      .limit(limit);

    res.json({
      success: true,
      data: { events: upcomingEvents }
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upcoming events'
    });
  }
});

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
router.post('/:id/register', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for registration'
      });
    }

    if (event.startDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event has already started'
      });
    }

    if (event.registrationDeadline && event.registrationDeadline < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if user is already registered
    if (event.registeredAttendees.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check capacity
    if (event.capacity && event.registeredAttendees.length >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is at full capacity'
      });
    }

    // Register user
    event.registeredAttendees.push(req.user._id);
    await event.save();

    res.json({
      success: true,
      message: 'Successfully registered for the event',
      data: { 
        event: {
          _id: event._id,
          title: event.title,
          startDate: event.startDate,
          location: event.location
        }
      }
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering for event'
    });
  }
});

// @desc    Unregister from event
// @route   DELETE /api/events/:id/register
// @access  Private
router.delete('/:id/register', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is registered
    if (!event.registeredAttendees.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this event'
      });
    }

    // Unregister user
    event.registeredAttendees = event.registeredAttendees.filter(
      attendeeId => attendeeId.toString() !== req.user._id.toString()
    );
    await event.save();

    res.json({
      success: true,
      message: 'Successfully unregistered from the event'
    });
  } catch (error) {
    console.error('Event unregistration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unregistering from event'
    });
  }
});

// @desc    Create event (Admin only)
// @route   POST /api/events
// @access  Private/Admin
router.post('/', protect, authorize('admin'), validateEvent, handleValidationErrors, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id
    };

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating event'
    });
  }
});

// @desc    Update event (Admin only)
// @route   PUT /api/events/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), validateEvent, handleValidationErrors, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating event'
    });
  }
});

// @desc    Delete event (Admin only)
// @route   DELETE /api/events/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting event'
    });
  }
});

// @desc    Get all events for admin (Admin only)
// @route   GET /api/events/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, eventType, organizer } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;
    if (organizer) filter.organizer = organizer;

    const events = await Event.find(filter)
      .populate('organizer', 'firstName lastName')
      .populate('registeredAttendees', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get admin events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events for admin'
    });
  }
});

// @desc    Get event statistics (Admin only)
// @route   GET /api/events/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Event.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Event.aggregate([
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalEvents = await Event.countDocuments();
    const publishedEvents = await Event.countDocuments({ status: 'published' });
    const upcomingEvents = await Event.countDocuments({ 
      status: 'published',
      startDate: { $gte: new Date() }
    });
    const totalRegistrations = await Event.aggregate([
      { $group: { _id: null, totalRegistrations: { $sum: { $size: '$registeredAttendees' } } } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalEvents,
        published: publishedEvents,
        upcoming: upcomingEvents,
        totalRegistrations: totalRegistrations[0]?.totalRegistrations || 0,
        byStatus: stats,
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event statistics'
    });
  }
});

module.exports = router;
