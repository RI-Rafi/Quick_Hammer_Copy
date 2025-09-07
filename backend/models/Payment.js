const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'usd'
  },
  stripePaymentIntentId: String,
  status: {
    type: String,
    enum: ['requires_payment', 'processing', 'succeeded', 'failed', 'refunded'],
    default: 'requires_payment'
  }
}, { timestamps: true });

paymentSchema.index({ payer: 1, createdAt: -1 });
paymentSchema.index({ auction: 1 });

module.exports = mongoose.model('Payment', paymentSchema);


