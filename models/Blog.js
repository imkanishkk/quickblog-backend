const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a blog title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  subTitle: {
    type: String,
    trim: true,
    maxlength: [300, 'Subtitle cannot be more than 300 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide blog content'],
    minlength: [50, 'Content must be at least 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Technology', 'Startup', 'Lifestyle', 'Finance', 'Health', 'Travel', 'Food', 'Education'],
    default: 'Technology'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  image: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  readTime: {
    type: String,
    default: function() {
      // Calculate reading time based on content length
      const wordsPerMinute = 200;
      const textContent = this.description.replace(/<[^>]*>/g, ''); // Remove HTML tags
      const words = textContent.split(/\s+/).length;
      const readingTime = Math.ceil(words / wordsPerMinute);
      return `${readingTime} min read`;
    }
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot be more than 1000 characters']
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot be more than 160 characters']
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ isPublished: 1 });
blogSchema.index({ slug: 1 });
blogSchema.index({ title: 'text', description: 'text' }); // Text search index

// Generate slug before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
    
    // Add timestamp to ensure uniqueness
    if (this.isNew) {
      this.slug += '-' + Date.now();
    }
  }
  next();
});

// Virtual for like count
blogSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
blogSchema.virtual('commentCount').get(function() {
  return this.comments.filter(comment => comment.isApproved).length;
});

// Instance method to increment views
blogSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to add like
blogSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (!existingLike) {
    this.likes.push({ user: userId });
    return this.save();
  }
  
  return this;
};

// Instance method to remove like
blogSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Instance method to add comment
blogSchema.methods.addComment = function(userId, name, content) {
  this.comments.push({
    user: userId,
    name: name,
    content: content,
    isApproved: false // Comments need approval by default
  });
  return this.save();
};

// Static method to get published blogs
blogSchema.statics.getPublished = function() {
  return this.find({ isPublished: true, isDraft: false })
    .populate('author', 'name email avatar')
    .sort({ publishedAt: -1 });
};

// Static method to search blogs
blogSchema.statics.searchBlogs = function(query) {
  return this.find({
    $and: [
      { isPublished: true, isDraft: false },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  })
  .populate('author', 'name email avatar')
  .sort({ publishedAt: -1 });
};

// Static method to get blogs by category
blogSchema.statics.getByCategory = function(category) {
  const query = { isPublished: true, isDraft: false };
  
  if (category && category !== 'All') {
    query.category = category;
  }
  
  return this.find(query)
    .populate('author', 'name email avatar')
    .sort({ publishedAt: -1 });
};

// Static method to get related blogs
blogSchema.statics.getRelated = function(blogId, category, limit = 3) {
  return this.find({
    _id: { $ne: blogId },
    category: category,
    isPublished: true,
    isDraft: false
  })
  .populate('author', 'name email avatar')
  .sort({ publishedAt: -1 })
  .limit(limit);
};

// Transform JSON output
blogSchema.methods.toJSON = function() {
  const blog = this.toObject({ virtuals: true });
  
  delete blog.__v;
  
  return blog;
};

module.exports = mongoose.model('Blog', blogSchema);
