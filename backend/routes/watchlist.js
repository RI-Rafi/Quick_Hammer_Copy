const express = require('express');
const {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist
} = require('../controllers/watchlistController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getWatchlist);
router.get('/check/:auctionId', checkWatchlist);
router.post('/:auctionId', addToWatchlist);
router.delete('/:auctionId', removeFromWatchlist);

module.exports = router;
