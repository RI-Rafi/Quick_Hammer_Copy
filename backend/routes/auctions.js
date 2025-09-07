const express = require('express');
const {
  createAuction,
  updateAuction,
  deleteAuction,
  listAuctions,
  getAuction,
  upload
} = require('../controllers/auctionController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public listing and detail
router.get('/', optionalAuth, listAuctions);
router.get('/:id', optionalAuth, getAuction);

// Seller/Admin protected CRUD with multer for image uploads
router.post('/', protect, authorize('seller', 'admin'), upload.array('images', 10), createAuction);
router.put('/:id', protect, authorize('seller', 'admin'), upload.array('images', 10), updateAuction);
router.delete('/:id', protect, authorize('seller', 'admin'), deleteAuction);

module.exports = router;


