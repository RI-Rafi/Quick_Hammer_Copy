const express = require('express');
const { createPaymentIntent, handleWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Webhook is registered at top-level in server.js to ensure raw body is used first

// Require auth to create payment intents
router.post('/create-intent', protect, createPaymentIntent);

module.exports = router;


