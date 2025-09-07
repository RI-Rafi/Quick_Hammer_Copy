const Review = require('../models/Review');
const Auction = require('../models/Auction');
const User = require('../models/User');

// @desc    Create review for seller/product after auction
// @route   POST /api/reviews
// @access  Private (winner)
const createReview = async (req, res, next) => {
  try {
    const { auctionId, rating, comment } = req.body;
    const auction = await Auction.findById(auctionId).populate('seller', '_id rating totalRatings');
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });
    if (!auction.winner || auction.winner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the winning bidder can review' });
    }

    const review = await Review.create({
      auction: auction._id,
      seller: auction.seller._id,
      reviewer: req.user._id,
      rating,
      comment
    });

    // Update seller aggregate rating
    const agg = await Review.aggregate([
      { $match: { seller: auction.seller._id } },
      { $group: { _id: '$seller', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (agg[0]) {
      await User.findByIdAndUpdate(auction.seller._id, { rating: agg[0].avg, totalRatings: agg[0].count });
    }

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    List reviews for seller
// @route   GET /api/reviews/seller/:sellerId
// @access  Public
const listSellerReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sellerId = req.params.sellerId;

    const [reviews, total] = await Promise.all([
      Review.find({ seller: sellerId })
        .populate('reviewer', 'username')
        .populate('auction', 'title images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ seller: sellerId })
    ]);

    res.status(200).json({ success: true, reviews, total, currentPage: page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  listSellerReviews
};


