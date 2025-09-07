const express = require('express');
const { getMetrics } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/metrics', getMetrics);

module.exports = router;


