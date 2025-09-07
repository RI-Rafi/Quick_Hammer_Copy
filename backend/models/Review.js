const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 1000 },
}, { timestamps: true });

reviewSchema.index({ seller: 1, createdAt: -1 });
reviewSchema.index({ auction: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);


