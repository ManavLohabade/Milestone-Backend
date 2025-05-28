const { body } = require('express-validator');

exports.transactionValidation = [
  body('quotationId').notEmpty().withMessage('Quotation ID is required'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('type').isIn(['credit', 'debit']).withMessage('Type must be credit or debit'),
  body('amount').isNumeric().withMessage('Amount must be a number').custom(val => val > 0).withMessage('Amount must be positive'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  body('paymentMode').optional().isString(),
  body('transactionId').optional().isString(),
  body('note').optional().isString()
];
