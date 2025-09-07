const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Payment = require('../models/Payment');
const Dispute = require('../models/Dispute');

// @desc    Get admin dashboard metrics
// @route   GET /api/admin/metrics
// @access  Private (admin)
const getMetrics = async (req, res, next) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalSellers,
      totalBidders,
      totalAuctions,
      activeAuctions,
      endedAuctions,
      soldAuctions,
      totalBids,
      totalRevenue,
      disputesOpen,
      disputesResolved,
      topAuctionsByBids,
      bidsLast7,
      revenueLast30
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'bidder' }),
      Auction.countDocuments({}),
      Auction.countDocuments({ status: 'active' }),
      Auction.countDocuments({ status: 'ended' }),
      Auction.countDocuments({ status: 'sold' }),
      Bid.countDocuments({}),
      Payment.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Dispute.countDocuments({ status: 'open' }),
      Dispute.countDocuments({ status: { $in: ['approved', 'denied', 'refunded'] } }),
      Bid.aggregate([
        { $group: { _id: '$auction', bidCount: { $sum: 1 } } },
        { $sort: { bidCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'auctions', localField: '_id', foreignField: '_id', as: 'auction' } },
        { $unwind: '$auction' },
        { $project: { _id: 0, auctionId: '$auction._id', title: '$auction.title', bidCount: 1 } }
      ]),
      Bid.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Payment.aggregate([
        { $match: { status: 'succeeded', createdAt: { $gte: monthAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      users: { total: totalUsers, sellers: totalSellers, bidders: totalBidders },
      auctions: { total: totalAuctions, active: activeAuctions, ended: endedAuctions, sold: soldAuctions },
      bids: { total: totalBids, last7Days: bidsLast7 },
      revenue: { total: totalRevenue[0]?.total || 0, last30Days: revenueLast30 },
      disputes: { open: disputesOpen, resolved: disputesResolved },
      leaderboards: { topAuctionsByBids }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetrics
};


