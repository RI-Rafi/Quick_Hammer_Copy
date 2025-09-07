const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ['open', 'approved', 'denied', 'refunded'], default: 'open' },
  adminNotes: { type: String, maxlength: 1000 }
}, { timestamps: true });

disputeSchema.index({ requester: 1, createdAt: -1 });
disputeSchema.index({ auction: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);


