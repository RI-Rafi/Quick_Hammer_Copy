const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Create and send notification
  async createNotification(data) {
    try {
      const notification = await Notification.createNotification(data);
      
      // Send real-time notification
      this.io.to(`user-${data.recipient}`).emit('new-notification', notification);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send bid placed notification
  async sendBidPlacedNotification(auctionId, bidderId, amount) {
    try {
      const auction = await require('../models/Auction').findById(auctionId)
        .populate('seller', 'username');

      // Notify seller about new bid
      await this.createNotification({
        recipient: auction.seller._id,
        type: 'bid_placed',
        title: 'New Bid Placed',
        message: `A new bid of $${amount} has been placed on your auction "${auction.title}"`,
        data: {
          auction: auctionId,
          amount: amount
        }
      });

      // Notify other bidders that they've been outbid
      const previousBids = await require('../models/Bid').find({
        auction: auctionId,
        isWinning: true,
        bidder: { $ne: bidderId }
      }).populate('bidder', '_id');

      for (const bid of previousBids) {
        await this.createNotification({
          recipient: bid.bidder._id,
          type: 'outbid',
          title: 'You\'ve Been Outbid',
          message: `You've been outbid on "${auction.title}". Current price: $${amount}`,
          data: {
            auction: auctionId,
            amount: amount
          }
        });
      }
    } catch (error) {
      console.error('Error sending bid notification:', error);
    }
  }

  // Send auction ending soon notification
  async sendAuctionEndingSoonNotification(auctionId) {
    try {
      const auction = await require('../models/Auction').findById(auctionId)
        .populate('seller', 'username');

      // Get all bidders for this auction
      const bidders = await require('../models/Bid').distinct('bidder', { auction: auctionId });

      for (const bidderId of bidders) {
        await this.createNotification({
          recipient: bidderId,
          type: 'auction_ending_soon',
          title: 'Auction Ending Soon',
          message: `The auction "${auction.title}" is ending in 5 minutes!`,
          data: {
            auction: auctionId
          }
        });
      }
    } catch (error) {
      console.error('Error sending auction ending soon notification:', error);
    }
  }

  // Send auction ended notification
  async sendAuctionEndedNotification(auctionId) {
    try {
      const auction = await require('../models/Auction').findById(auctionId)
        .populate('seller', 'username')
        .populate('winner', 'username');

      if (auction.winner) {
        // Notify winner
        await this.createNotification({
          recipient: auction.winner._id,
          type: 'auction_won',
          title: 'Congratulations! You Won!',
          message: `You won the auction "${auction.title}" for $${auction.winningBid}`,
          data: {
            auction: auctionId,
            amount: auction.winningBid
          }
        });

        // Notify seller
        await this.createNotification({
          recipient: auction.seller._id,
          type: 'auction_ended',
          title: 'Auction Ended Successfully',
          message: `Your auction "${auction.title}" has ended. Winner: ${auction.winner.username}`,
          data: {
            auction: auctionId
          }
        });
      } else {
        // Notify seller if no bids
        await this.createNotification({
          recipient: auction.seller._id,
          type: 'auction_ended',
          title: 'Auction Ended',
          message: `Your auction "${auction.title}" has ended with no bids.`,
          data: {
            auction: auctionId
          }
        });
      }
    } catch (error) {
      console.error('Error sending auction ended notification:', error);
    }
  }

  // Send payment notification
  async sendPaymentNotification(userId, auctionId, amount, success = true) {
    try {
      const auction = await require('../models/Auction').findById(auctionId);

      await this.createNotification({
        recipient: userId,
        type: success ? 'payment_received' : 'payment_failed',
        title: success ? 'Payment Successful' : 'Payment Failed',
        message: success 
          ? `Payment of $${amount} for "${auction.title}" was successful.`
          : `Payment of $${amount} for "${auction.title}" failed. Please try again.`,
        data: {
          auction: auctionId,
          amount: amount
        }
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }

  // Send system announcement
  async sendSystemAnnouncement(message, title = 'System Announcement') {
    try {
      const users = await User.find({ isActive: true });

      for (const user of users) {
        await this.createNotification({
          recipient: user._id,
          type: 'system_announcement',
          title: title,
          message: message,
          data: {}
        });
      }
    } catch (error) {
      console.error('Error sending system announcement:', error);
    }
  }
}

module.exports = NotificationService;
