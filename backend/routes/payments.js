const express = require('express');
const { createPaymentIntent, handleWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Stripe webhook must receive raw body; ensure server config supports it
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Require auth to create payment intents
router.post('/create-intent', protect, createPaymentIntent);

module.exports = router;


