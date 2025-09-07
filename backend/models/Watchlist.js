const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: [true, 'Auction is required']
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure user can only watch an auction once
watchlistSchema.index({ user: 1, auction: 1 }, { unique: true });

// Virtual for time since added
watchlistSchema.virtual('timeSinceAdded').get(function() {
  return Date.now() - this.addedAt;
});

module.exports = mongoose.model('Watchlist', watchlistSchema);
