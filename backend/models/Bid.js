const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: [true, 'Auction is required']
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bidder is required']
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount cannot be negative']
  },
  isWinning: {
    type: Boolean,
    default: false
  },
  isOutbid: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'outbid', 'won', 'lost', 'cancelled'],
    default: 'active'
  },
  placedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes for better query performance
bidSchema.index({ auction: 1, amount: -1 });
bidSchema.index({ bidder: 1, placedAt: -1 });
bidSchema.index({ auction: 1, bidder: 1 });
bidSchema.index({ status: 1 });

// Virtual for time since bid
bidSchema.virtual('timeSinceBid').get(function() {
  return Date.now() - this.placedAt;
});

// Pre-save middleware to validate bid amount
bidSchema.pre('save', async function(next) {
  if (this.isNew) {
    const auction = await mongoose.model('Auction').findById(this.auction);
    if (!auction) {
      return next(new Error('Auction not found'));
    }
    
    // Check if bid is higher than current price
    if (this.amount <= auction.currentPrice) {
      return next(new Error('Bid must be higher than current price'));
    }
    
    // Check if auction is active
    if (auction.status !== 'active') {
      return next(new Error('Auction is not active'));
    }
    
    // Check if auction has ended
    const now = new Date();
    const endTime = auction.extendedEndTime || auction.endTime;
    if (now > endTime) {
      return next(new Error('Auction has ended'));
    }
  }
  next();
});

// Post-save middleware to update auction and other bids
bidSchema.post('save', async function() {
  const auction = await mongoose.model('Auction').findById(this.auction);
  if (!auction) return;
  
  // Update auction current price
  auction.currentPrice = this.amount;
  auction.totalBids += 1;
  
  // Update unique bidders count
  const uniqueBidders = await mongoose.model('Bid').distinct('bidder', { 
    auction: this.auction 
  });
  auction.uniqueBidders = uniqueBidders.length;
  
  // Mark previous winning bid as outbid
  await mongoose.model('Bid').updateMany(
    { 
      auction: this.auction, 
      isWinning: true,
      _id: { $ne: this._id }
    },
    { 
      isWinning: false, 
      isOutbid: true, 
      status: 'outbid' 
    }
  );
  
  // Mark this bid as winning
  this.isWinning = true;
  this.status = 'active';
  await this.save();
  
  // Check for anti-sniping (extend auction if bid is placed in last 5 minutes)
  const now = new Date();
  const endTime = auction.extendedEndTime || auction.endTime;
  const timeUntilEnd = endTime - now;
  const fiveMinutes = 5 * 60 * 1000;
  
  if (timeUntilEnd <= fiveMinutes && auction.autoExtend) {
    await auction.extendTime(2); // Extend by 2 minutes
  }
  
  await auction.save();
});

module.exports = mongoose.model('Bid', bidSchema);
