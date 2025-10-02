const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Blog = require('../models/Blog');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/blogs
// @desc    Get all published blogs with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().trim(),
  query('search').optional().trim(),
  query('sort').optional().isIn(['newest', 'oldest', 'popular']).withMessage('Sort must be newest, oldest, or popular')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, search, sort = 'newest' } = req.query;

    // Build query
    let query = { isPublished: true, isDraft: false };

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { publishedAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1, publishedAt: -1 };
        break;
      default: // newest
        sortOption = { publishedAt: -1 };
    }

    // Execute query
    const blogs = await Blog.find(query)
      .populate('author', 'name email avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Blog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalBlogs: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blogs'
    });
  }
});

// @route   GET /api/blogs/categories
// @desc    Get all blog categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Blog.distinct('category', { isPublished: true, isDraft: false });
    
    res.json({
      success: true,
      data: {
        categories: ['All', ...categories]
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

// @route   GET /api/blogs/featured
// @desc    Get featured blogs
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const blogs = await Blog.find({ 
      isPublished: true, 
      isDraft: false, 
      featured: true 
    })
    .populate('author', 'name email avatar')
    .sort({ publishedAt: -1 })
    .limit(5)
    .lean();

    res.json({
      success: true,
      data: {
        blogs
      }
    });

  } catch (error) {
    console.error('Get featured blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured blogs'
    });
  }
});

// @route   GET /api/blogs/:id
// @desc    Get single blog by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email avatar')
      .populate('comments.user', 'name avatar');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if blog is published (unless user is author or admin)
    if (!blog.isPublished || blog.isDraft) {
      if (!req.user || (req.user._id.toString() !== blog.author._id.toString() && req.user.role !== 'admin')) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }
    }

    // Increment views (only if not the author viewing their own blog)
    if (!req.user || req.user._id.toString() !== blog.author._id.toString()) {
      await blog.incrementViews();
    }

    // Get related blogs
    const relatedBlogs = await Blog.getRelated(blog._id, blog.category, 3);

    res.json({
      success: true,
      data: {
        blog,
        relatedBlogs
      }
    });

  } catch (error) {
    console.error('Get blog error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blog'
    });
  }
});

// @route   POST /api/blogs
// @desc    Create a new blog
// @access  Private
router.post('/', [
  auth,
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  body('category')
    .isIn(['Technology', 'Startup', 'Lifestyle', 'Finance', 'Health', 'Travel', 'Food', 'Education'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('subTitle')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Subtitle cannot be more than 300 characters'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('isDraft')
    .optional()
    .isBoolean()
    .withMessage('isDraft must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, category, tags, subTitle, image, isDraft } = req.body;

    // Create blog
    const blog = new Blog({
      title,
      description,
      category,
      tags: tags || [],
      subTitle,
      image,
      author: req.user._id,
      authorName: req.user.name,
      isDraft: isDraft || false,
      isPublished: !isDraft,
      publishedAt: isDraft ? null : new Date()
    });

    await blog.save();
    
    // Populate author info
    await blog.populate('author', 'name email avatar');

    res.status(201).json({
      success: true,
      message: isDraft ? 'Blog saved as draft' : 'Blog published successfully',
      data: {
        blog
      }
    });

  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating blog'
    });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update a blog
// @access  Private (Author or Admin)
router.put('/:id', [
  auth,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  body('category')
    .optional()
    .isIn(['Technology', 'Startup', 'Lifestyle', 'Finance', 'Health', 'Travel', 'Food', 'Education'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('subTitle')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Subtitle cannot be more than 300 characters'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('isDraft')
    .optional()
    .isBoolean()
    .withMessage('isDraft must be a boolean'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('featured must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user is author or admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }

    const { title, description, category, tags, subTitle, image, isDraft, featured } = req.body;

    // Update fields
    if (title) blog.title = title;
    if (description) blog.description = description;
    if (category) blog.category = category;
    if (tags) blog.tags = tags;
    if (subTitle !== undefined) blog.subTitle = subTitle;
    if (image !== undefined) blog.image = image;
    
    // Handle draft/publish status
    if (isDraft !== undefined) {
      blog.isDraft = isDraft;
      blog.isPublished = !isDraft;
      
      if (!isDraft && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }
    }
    
    // Only admin can set featured
    if (featured !== undefined && req.user.role === 'admin') {
      blog.featured = featured;
    }

    await blog.save();
    await blog.populate('author', 'name email avatar');

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: {
        blog
      }
    });

  } catch (error) {
    console.error('Update blog error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating blog'
    });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog
// @access  Private (Author or Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user is author or admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });

  } catch (error) {
    console.error('Delete blog error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting blog'
    });
  }
});

// @route   POST /api/blogs/:id/like
// @desc    Like/Unlike a blog
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    if (!blog.isPublished || blog.isDraft) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const existingLike = blog.likes.find(like => like.user.toString() === req.user._id.toString());

    if (existingLike) {
      // Unlike
      await blog.removeLike(req.user._id);
      res.json({
        success: true,
        message: 'Blog unliked',
        data: {
          liked: false,
          likeCount: blog.likes.length
        }
      });
    } else {
      // Like
      await blog.addLike(req.user._id);
      res.json({
        success: true,
        message: 'Blog liked',
        data: {
          liked: true,
          likeCount: blog.likes.length
        }
      });
    }

  } catch (error) {
    console.error('Like blog error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while processing like'
    });
  }
});

// @route   POST /api/blogs/:id/comments
// @desc    Add a comment to a blog
// @access  Private
router.post('/:id/comments', [
  auth,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    if (!blog.isPublished || blog.isDraft) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const { content } = req.body;

    await blog.addComment(req.user._id, req.user.name, content);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully (pending approval)',
      data: {
        commentCount: blog.comments.length
      }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

module.exports = router;
