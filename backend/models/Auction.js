const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Auction title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Auction description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 
      'Collectibles', 'Automotive', 'Jewelry', 'Art', 'Antiques',
      'Toys & Games', 'Health & Beauty', 'Tools', 'Music', 'Other'
    ]
  },
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: [0, 'Starting price cannot be negative']
  },
  currentPrice: {
    type: Number,
    default: function() {
      return this.startingPrice;
    }
  },
  reservePrice: {
    type: Number,
    min: [0, 'Reserve price cannot be negative'],
    default: 0
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'active', 'ended', 'cancelled', 'sold'],
    default: 'draft'
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  extendedEndTime: {
    type: Date
  },
  totalBids: {
    type: Number,
    default: 0
  },
  uniqueBidders: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winningBid: {
    type: Number
  },
  location: {
    city: String,
    state: String,
    country: String
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    required: [true, 'Item condition is required']
  },
  shipping: {
    cost: {
      type: Number,
      default: 0
    },
    method: {
      type: String,
      enum: ['free', 'standard', 'express', 'pickup'],
      default: 'standard'
    },
    estimatedDays: {
      type: Number,
      default: 3
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isReserved: {
    type: Boolean,
    default: false
  },
  autoExtend: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date
}, {
  timestamps: true
});

// Indexes for better query performance
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ category: 1, status: 1 });
auctionSchema.index({ seller: 1 });
auctionSchema.index({ startTime: 1, endTime: 1 });
auctionSchema.index({ featured: 1, status: 1 });
auctionSchema.index({ title: 'text', description: 'text' });

// Virtual for time remaining
auctionSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const endTime = this.extendedEndTime || this.endTime;
  return Math.max(0, endTime - now);
});

// Virtual for is ending soon (within 5 minutes)
auctionSchema.virtual('isEndingSoon').get(function() {
  return this.timeRemaining <= 5 * 60 * 1000 && this.status === 'active';
});

// Virtual for is active
auctionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startTime && now <= (this.extendedEndTime || this.endTime);
});

// Pre-save middleware to update current price
auctionSchema.pre('save', function(next) {
  if (this.isNew) {
    this.currentPrice = this.startingPrice;
  }
  next();
});

// Method to check if reserve price is met
auctionSchema.methods.isReserveMet = function() {
  return this.currentPrice >= this.reservePrice;
};

// Method to extend auction time (anti-sniping)
auctionSchema.methods.extendTime = function(minutes = 2) {
  const extensionTime = minutes * 60 * 1000; // Convert to milliseconds
  const currentEndTime = this.extendedEndTime || this.endTime;
  this.extendedEndTime = new Date(currentEndTime.getTime() + extensionTime);
  return this.save();
};

// Method to update auction status
auctionSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (this.status === 'upcoming' && now >= this.startTime) {
    this.status = 'active';
  } else if (this.status === 'active' && now > (this.extendedEndTime || this.endTime)) {
    this.status = this.totalBids > 0 ? 'ended' : 'cancelled';
  }
  
  return this.save();
};

module.exports = mongoose.model('Auction', auctionSchema);
