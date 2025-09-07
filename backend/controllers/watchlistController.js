const Watchlist = require('../models/Watchlist');
const Auction = require('../models/Auction');

// @desc    Get user's watchlist
// @route   GET /api/watchlist
// @access  Private
const getWatchlist = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const watchlist = await Watchlist.find({ user: req.user.id })
      .populate({
        path: 'auction',
        select: 'title description images currentPrice startingPrice endTime status totalBids category seller',
        populate: {
          path: 'seller',
          select: 'username rating'
        }
      })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Watchlist.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      watchlist,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add auction to watchlist
// @route   POST /api/watchlist/:auctionId
// @access  Private
const addToWatchlist = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    // Check if auction exists
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Check if already in watchlist
    const existingWatch = await Watchlist.findOne({
      user: req.user.id,
      auction: auctionId
    });

    if (existingWatch) {
      return res.status(400).json({
        success: false,
        message: 'Auction is already in your watchlist'
      });
    }

    const watchlistItem = await Watchlist.create({
      user: req.user.id,
      auction: auctionId
    });

    await watchlistItem.populate({
      path: 'auction',
      select: 'title description images currentPrice startingPrice endTime status totalBids category seller',
      populate: {
        path: 'seller',
        select: 'username rating'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Auction added to watchlist',
      watchlistItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove auction from watchlist
// @route   DELETE /api/watchlist/:auctionId
// @access  Private
const removeFromWatchlist = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const watchlistItem = await Watchlist.findOneAndDelete({
      user: req.user.id,
      auction: auctionId
    });

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found in watchlist'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Auction removed from watchlist'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if auction is in watchlist
// @route   GET /api/watchlist/check/:auctionId
// @access  Private
const checkWatchlist = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const watchlistItem = await Watchlist.findOne({
      user: req.user.id,
      auction: auctionId
    });

    res.status(200).json({
      success: true,
      isWatched: !!watchlistItem
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist
};
