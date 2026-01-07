const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 2000
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']
  },
  images: [{
    type: String // URLs or file paths
  }],
  // ML prediction data
  mlPrediction: {
    predictedCategory: String,
    confidence: Number,
    recyclability: String,
    suggestedUsage: String
  },
  quantity: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    default: 'good'
  },
  price: {
    amount: {
      type: Number,
      default: 0
    },
    negotiable: {
      type: Boolean,
      default: true
    },
    isFree: {
      type: Boolean,
      default: false
    }
  },
  location: {
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    }
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'expired', 'deleted'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for search and filtering
adSchema.index({ category: 1 });
adSchema.index({ 'location.city': 1 });
adSchema.index({ 'location.state': 1 });
adSchema.index({ title: 'text', description: 'text' });
adSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ad', adSchema);
