const clientFinanceService = require('../services/clientFinanceServices');

// Add a transaction (credit or debit)
exports.addTransaction = async (req, res) => {
  try {
    const transaction = await clientFinanceService.addTransaction(req.body);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// List all transactions for a quotation
exports.getTransactionsByQuotation = async (req, res) => {
  try {
    const transactions = await clientFinanceService.getTransactionsByQuotation(req.params.quotationId);
    res.json(transactions);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get finance summary for a quotation
exports.getFinanceSummary = async (req, res) => {
  try {
    const summary = await clientFinanceService.getFinanceSummary(req.params.quotationId);
    res.json(summary);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all quotation numbers for dropdown
exports.getQuotationNumbers = async (req, res) => {
  try {
    const numbers = await clientFinanceService.getAllQuotationsForDropdown();
    res.json(numbers);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
