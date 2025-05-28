const express = require('express');
const router = express.Router();
const controller = require('../controllers/clientFinanceController');
const { transactionValidation } = require('../middlewares/clientFinanceValidations');

// Get all quotation numbers for dropdown
router.get('/quotations/numbers', controller.getQuotationNumbers);

// Add a credit or debit transaction
router.post('/transaction', transactionValidation, controller.addTransaction);

// List all transactions for a quotation
router.get('/transactions/:quotationId', controller.getTransactionsByQuotation);

// Get finance summary for a quotation
router.get('/summary/:quotationId', controller.getFinanceSummary);

module.exports = router;
