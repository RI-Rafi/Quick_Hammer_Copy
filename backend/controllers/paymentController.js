const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const Payment = require('../models/Payment');
const Auction = require('../models/Auction');

// @desc    Create payment intent for winning bidder
// @route   POST /api/payments/create-intent
// @access  Private (winner/admin)
const createPaymentIntent = async (req, res, next) => {
  try {
    const { auctionId } = req.body;

    const auction = await Auction.findById(auctionId);
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });
    if (auction.status !== 'ended' && auction.status !== 'sold') {
      return res.status(400).json({ success: false, message: 'Auction is not payable yet' });
    }
    if (!auction.winner || auction.winner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the winning bidder can pay' });
    }

    const amountUsd = Math.round((auction.winningBid + (auction.shipping?.cost || 0)) * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountUsd,
      currency: 'usd',
      metadata: { auctionId: auction._id.toString(), userId: req.user._id.toString() },
      automatic_payment_methods: { enabled: true }
    });

    const payment = await Payment.create({
      auction: auction._id,
      payer: req.user._id,
      amount: (amountUsd / 100),
      currency: 'usd',
      stripePaymentIntentId: intent.id,
      status: 'requires_payment'
    });

    res.status(201).json({ success: true, clientSecret: intent.client_secret, paymentId: payment._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public (Stripe)
const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    let event;

    if (endpointSecret) {
      const rawBody = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } else {
      event = req.body; // In dev without signing
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
      if (payment) {
        payment.status = 'succeeded';
        await payment.save();

        // Mark auction as sold
        const auction = await Auction.findById(payment.auction);
        if (auction) {
          auction.status = 'sold';
          await auction.save();
        }

        // Notify user
        try {
          const io = req.app.get('io');
          const NotificationService = require('../services/notificationService');
          const notifier = new NotificationService(io);
          await notifier.sendPaymentNotification(payment.payer, payment.auction, payment.amount, true);
        } catch (e) {}
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
      if (payment) {
        payment.status = 'failed';
        await payment.save();
        try {
          const io = req.app.get('io');
          const NotificationService = require('../services/notificationService');
          const notifier = new NotificationService(io);
          await notifier.sendPaymentNotification(payment.payer, payment.auction, payment.amount, false);
        } catch (e) {}
      }
    }

    res.json({ received: true });
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhook
};


