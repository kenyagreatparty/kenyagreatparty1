const express = require('express');
const News = require('../models/News');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validateNews, validatePagination, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all published news articles
// @route   GET /api/news
// @access  Public
router.get('/', validatePagination, handleValidationErrors, optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { category, tag, featured, search } = req.query;

    // Build filter for published articles only
    const filter = { status: 'published' };
    
    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag] };
    if (featured === 'true') filter.featured = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const news = await News.find(filter)
      .populate('author', 'firstName lastName')
      .select('-content') // Exclude full content for list view
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments(filter);

    res.json({
      success: true,
      data: {
        news,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news'
    });
  }
});

// @desc    Get single news article
// @route   GET /api/news/:slug
// @access  Public
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const news = await News.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    }).populate('author', 'firstName lastName');

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Increment view count
    news.views += 1;
    await news.save();

    res.json({
      success: true,
      data: { news }
    });
  } catch (error) {
    console.error('Get news article error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news article'
    });
  }
});

// @desc    Get featured news articles
// @route   GET /api/news/featured/list
// @access  Public
router.get('/featured/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;

    const featuredNews = await News.find({ 
      status: 'published', 
      featured: true 
    })
      .populate('author', 'firstName lastName')
      .select('-content')
      .sort({ publishedAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: { news: featuredNews }
    });
  } catch (error) {
    console.error('Get featured news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured news'
    });
  }
});

// @desc    Get news categories
// @route   GET /api/news/categories/list
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await News.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get news categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news categories'
    });
  }
});

// @desc    Get popular news articles
// @route   GET /api/news/popular/list
// @access  Public
router.get('/popular/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const days = parseInt(req.query.days) || 30;

    const popularNews = await News.find({
      status: 'published',
      publishedAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    })
      .populate('author', 'firstName lastName')
      .select('-content')
      .sort({ views: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: { news: popularNews }
    });
  } catch (error) {
    console.error('Get popular news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching popular news'
    });
  }
});

// @desc    Create news article (Admin only)
// @route   POST /api/news
// @access  Private/Admin
router.post('/', protect, authorize('admin'), validateNews, handleValidationErrors, async (req, res) => {
  try {
    const newsData = {
      ...req.body,
      author: req.user._id
    };

    const news = await News.create(newsData);

    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      data: { news }
    });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating news article'
    });
  }
});

// @desc    Update news article (Admin only)
// @route   PUT /api/news/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), validateNews, handleValidationErrors, async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    res.json({
      success: true,
      message: 'News article updated successfully',
      data: { news }
    });
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating news article'
    });
  }
});

// @desc    Delete news article (Admin only)
// @route   DELETE /api/news/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    res.json({
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting news article'
    });
  }
});

// @desc    Get all news articles for admin (Admin only)
// @route   GET /api/news/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, category, author } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (author) filter.author = author;

    const news = await News.find(filter)
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments(filter);

    res.json({
      success: true,
      data: {
        news,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get admin news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news for admin'
    });
  }
});

// @desc    Get news statistics (Admin only)
// @route   GET /api/news/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await News.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await News.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalNews = await News.countDocuments();
    const publishedNews = await News.countDocuments({ status: 'published' });
    const draftNews = await News.countDocuments({ status: 'draft' });
    const totalViews = await News.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalNews,
        published: publishedNews,
        draft: draftNews,
        totalViews: totalViews[0]?.totalViews || 0,
        byStatus: stats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Get news stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news statistics'
    });
  }
});

module.exports = router;
