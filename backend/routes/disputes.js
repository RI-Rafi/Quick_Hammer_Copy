const express = require('express');
const { openDispute, listDisputes, updateDispute } = require('../controllers/disputeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Winner opens dispute
router.post('/', protect, openDispute);

// Admin views/updates disputes
router.get('/', protect, authorize('admin'), listDisputes);
router.put('/:id', protect, authorize('admin'), updateDispute);

module.exports = router;


