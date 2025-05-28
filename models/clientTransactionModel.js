const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: false },
  quotationNumber: { type: String, required: false },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true }, 
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paymentMode: { type: String, trim: true },
  transactionId: { type: String, trim: true },
  note: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
