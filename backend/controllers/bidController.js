const Bid = require('../models/Bid');
const Auction = require('../models/Auction');

// @desc    Place a bid on an auction
// @route   POST /api/bids/:auctionId
// @access  Private (bidder)
const placeBid = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }
    if (auction.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Auction is not active' });
    }

    const bid = await Bid.create({
      auction: auctionId,
      bidder: req.user._id,
      amount,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || ''
    });

    // Emit socket events
    const io = req.app.get('io');
    io.to(`auction-${auctionId}`).emit('bid-updated', {
      auctionId,
      currentPrice: bid.amount,
      totalBidsIncrement: 1
    });

    // Optionally notify via service (defer to service layer if wired)
    try {
      const NotificationService = require('../services/notificationService');
      const notifier = new NotificationService(io);
      notifier.sendBidPlacedNotification(auctionId, req.user._id, amount);
    } catch (e) {
      // ignore notification errors to not block bidding
    }

    res.status(201).json({ success: true, bid });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bids for an auction
// @route   GET /api/bids/auction/:auctionId
// @access  Public
const getAuctionBids = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [bids, total] = await Promise.all([
      Bid.find({ auction: req.params.auctionId })
        .sort({ amount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('bidder', 'username'),
      Bid.countDocuments({ auction: req.params.auctionId })
    ]);

    res.status(200).json({ success: true, bids, total, currentPage: page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's bid history
// @route   GET /api/bids/me
// @access  Private
const getMyBids = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [bids, total] = await Promise.all([
      Bid.find({ bidder: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('auction', 'title images currentPrice endTime status'),
      Bid.countDocuments({ bidder: req.user._id })
    ]);

    res.status(200).json({ success: true, bids, total, currentPage: page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeBid,
  getAuctionBids,
  getMyBids
};


