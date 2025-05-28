const Transaction = require('../models/clientTransactionModel');
const Quotation = require('../models/quotationModel');
const Client = require('../models/clientModel');

class ClientFinanceService {
  async addTransaction(data) {
    // Check for existing quotation with the same quotationNumber
    if (data.quotationNumber) {
      const quotation = await Quotation.findOne({ quotationNumber: data.quotationNumber });
      if (quotation && quotation.clientId) {
        data.clientId = quotation.clientId;
      }
    }
    const transaction = new Transaction(data);
    await transaction.save();
    return transaction;
  }

  async getTransactionsByQuotation(quotationId) {
    return Transaction.find({ quotationId }).sort({ date: -1 });
  }

  async getFinanceSummary(quotationId) {
    const quotation = await Quotation.findById(quotationId).populate('clientId');
    
    
    if (!quotation) throw new Error('Quotation not found');

    const transactions = await Transaction.find({ quotationId });
    const totalCredited = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const totalDebited = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const profit = totalCredited - totalDebited;

    // Paid and Due from quotation payments
    const paid = quotation.payments ? quotation.payments.reduce((sum, p) => sum + p.amountReceived, 0) : 0;
    const due = quotation.total - paid;

    return {
      quotation,
      client: quotation.clientId,
      transactions,
      totalCredited,
      totalDebited,
      profit,
      paid,
      due
    };
  }

  async getAllQuotationsForDropdown() {
    // For dropdown, show quotations that are not deleted
    return Quotation.find({ isDeleted: false }, 'quotationNumber').sort({ quotationNumber: 1 });
  }
}

module.exports = new ClientFinanceService();
