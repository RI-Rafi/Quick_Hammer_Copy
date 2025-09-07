const express = require('express');
const { placeBid, getAuctionBids, getMyBids } = require('../controllers/bidController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public auction bid history
router.get('/auction/:auctionId', optionalAuth, getAuctionBids);

// Place bid (bidder only)
router.post('/:auctionId', protect, authorize('bidder', 'admin'), placeBid);

// My bids
router.get('/me', protect, getMyBids);

module.exports = router;


