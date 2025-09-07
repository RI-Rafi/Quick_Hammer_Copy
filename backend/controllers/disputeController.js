const Dispute = require('../models/Dispute');
const Payment = require('../models/Payment');
const Auction = require('../models/Auction');

// @desc    Open a dispute/refund request
// @route   POST /api/disputes
// @access  Private (winner)
const openDispute = async (req, res, next) => {
  try {
    const { auctionId, paymentId, reason } = req.body;

    const auction = await Auction.findById(auctionId);
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });
    if (!auction.winner || auction.winner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the winning bidder can open disputes' });
    }

    const payment = paymentId ? await Payment.findById(paymentId) : null;

    const dispute = await Dispute.create({
      auction: auctionId,
      payment: payment ? payment._id : undefined,
      requester: req.user._id,
      reason
    });

    res.status(201).json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};

// @desc    List disputes (admin)
// @route   GET /api/disputes
// @access  Private (admin)
const listDisputes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filters = {};
    if (req.query.status) filters.status = req.query.status;

    const [disputes, total] = await Promise.all([
      Dispute.find(filters)
        .populate('requester', 'username email')
        .populate('auction', 'title')
        .populate('payment', 'amount status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Dispute.countDocuments(filters)
    ]);

    res.status(200).json({ success: true, disputes, total, currentPage: page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update dispute status (admin)
// @route   PUT /api/disputes/:id
// @access  Private (admin)
const updateDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const allowed = ['open', 'approved', 'denied', 'refunded'];
    if (req.body.status && !allowed.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (req.body.status) dispute.status = req.body.status;
    if (req.body.adminNotes !== undefined) dispute.adminNotes = req.body.adminNotes;

    await dispute.save();
    res.status(200).json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  openDispute,
  listDisputes,
  updateDispute
};


