const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

const updateAuctionStatuses = async () => {
  try {
    const now = new Date();

    // 1. Update upcoming auctions to active when start time is reached
    const upcomingAuctions = await Auction.find({
      status: 'upcoming',
      startTime: { $lte: now }
    });

    for (const auction of upcomingAuctions) {
      auction.status = 'active';
      await auction.save();
      console.log(`Auction ${auction._id} status updated to active`);
    }

    // 2. Update active auctions to ended when end time is reached
    const activeAuctions = await Auction.find({
      status: 'active',
      $or: [
        { endTime: { $lte: now } },
        { extendedEndTime: { $lte: now } }
      ]
    });

    for (const auction of activeAuctions) {
      auction.status = 'ended';

      // Find the highest bid and set winner
      const highestBid = await Bid.findOne({ auction: auction._id })
        .sort({ amount: -1 })
        .populate('bidder', 'username email');

      if (highestBid) {
        auction.winner = highestBid.bidder._id;
        auction.currentPrice = highestBid.amount;
      }

      await auction.save();
      console.log(`Auction ${auction._id} status updated to ended`);
    }

    // 3. Update ended auctions to sold when payment is completed
    // This would typically be triggered by payment completion webhook
    // For now, we'll mark auctions as sold after a certain period
    const endedAuctions = await Auction.find({
      status: 'ended',
      winner: { $exists: true },
      updatedAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } // 24 hours after ending
    });

    for (const auction of endedAuctions) {
      auction.status = 'sold';
      await auction.save();
      console.log(`Auction ${auction._id} status updated to sold`);
    }

    console.log(`Auction status update completed at ${now}`);
  } catch (error) {
    console.error('Error updating auction statuses:', error);
  }
};

// Mark auction as sold when payment is completed
const markAuctionAsSold = async (auctionId) => {
  try {
    const auction = await Auction.findById(auctionId);
    if (auction && auction.status === 'ended' && auction.winner) {
      auction.status = 'sold';
      await auction.save();
      console.log(`Auction ${auctionId} marked as sold after payment`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking auction as sold:', error);
    return false;
  }
};

// Get auction statistics
const getAuctionStats = async () => {
  try {
    const stats = await Auction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      upcoming: 0,
      active: 0,
      ended: 0,
      sold: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    return result;
  } catch (error) {
    console.error('Error getting auction stats:', error);
    return null;
  }
};

module.exports = {
  updateAuctionStatuses,
  markAuctionAsSold,
  getAuctionStats
};
