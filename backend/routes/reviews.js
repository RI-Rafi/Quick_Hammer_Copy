const express = require('express');
const { createReview, listSellerReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/seller/:sellerId', listSellerReviews);
router.post('/', protect, createReview);

module.exports = router;


