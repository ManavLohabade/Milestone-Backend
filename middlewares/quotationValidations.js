const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const Quotation = require('../models/quotationModel');
const Client = require('../models/clientModel');
const { validationResult } = require('express-validator');

const quotationValidations = {
  // Create quotation validation
  createQuotation: [
    body('quotationName')
      .notEmpty()
      .withMessage('Quotation name is required')
      .isString()
      .withMessage('Quotation name must be a string')
      .trim(),

    body('clientName')
      .notEmpty()
      .withMessage('Client name is required')
      .isString()
      .withMessage('Client name must be a string')
      .trim(),

    body('subject')
      .notEmpty()
      .withMessage('Subject is required')
      .isString()
      .withMessage('Subject must be a string')
      .trim(),

    body('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),

    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required')
      .custom((items) => {
        for (const item of items) {
          if (!item.productName || typeof item.productName !== 'string') {
            throw new Error('Product name is required for all items');
          }
          if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
            throw new Error('Valid quantity is required for all items');
          }
          if (!item.unitPrice || typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
            throw new Error('Valid unit price is required for all items');
          }
          if (item.description && typeof item.description !== 'string') {
            throw new Error('Description must be a string');
          }
          if (item.category && typeof item.category !== 'string') {
            throw new Error('Category must be a string');
          }
          if (item.code && typeof item.code !== 'string') {
            throw new Error('Code must be a string');
          }
          if (item.unit && typeof item.unit !== 'string') {
            throw new Error('Unit must be a string');
          }
        }
        return true;
      }),

    body('cgst')
      .optional()
      .isNumeric()
      .withMessage('CGST must be a number')
      .custom((value) => {
        if (value < 0) {
          throw new Error('CGST cannot be negative');
        }
        return true;
      }),

    body('sgst')
      .optional()
      .isNumeric()
      .withMessage('SGST must be a number')
      .custom((value) => {
        if (value < 0) {
          throw new Error('SGST cannot be negative');
        }
        return true;
      }),

    body('otherTax')
      .optional()
      .isNumeric()
      .withMessage('Other tax must be a number')
      .custom((value) => {
        if (value < 0) {
          throw new Error('Other tax cannot be negative');
        }
        return true;
      }),

    body('discount')
      .optional()
      .isNumeric()
      .withMessage('Discount must be a number')
      .custom((value) => {
        if (value < 0) {
          throw new Error('Discount cannot be negative');
        }
        return true;
      }),

    body('termsAndConditions')
      .optional()
      .isString()
      .withMessage('Terms and conditions must be a string'),

    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array')
      .custom((attachments) => {
        if (attachments && attachments.length > 5) {
          throw new Error('Maximum 5 attachments allowed');
        }
        for (const attachment of attachments) {
          if (!attachment.fileName || !attachment.fileUrl) {
            throw new Error('Each attachment must have fileName and fileUrl');
          }
        }
        return true;
      }),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Validation for creating an initial quotation
  createInitialQuotation: [
    body('quotationName')
      .notEmpty()
      .withMessage('Quotation name is required')
      .isString()
      .withMessage('Quotation name must be a string')
      .trim(),

    body('clientName')
      .notEmpty()
      .withMessage('Client name is required')
      .isString()
      .withMessage('Client name must be a string')
      .trim(),

    body('subject')
      .notEmpty()
      .withMessage('Subject is required')
      .isString()
      .withMessage('Subject must be a string')
      .trim(),

    body('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Update quotation validation
  updateQuotation: [
    param('id')
      .notEmpty()
      .withMessage('Quotation ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid quotation ID format');
        }
        const quotation = await Quotation.findById(value);
        if (!quotation) {
          throw new Error('Quotation not found');
        }
        if (quotation.status !== 'Draft' && quotation.status !== 'Sent') {
          throw new Error('Only Draft or Sent quotations can be updated');
        }
        return true;
      }),

    body('quotationName')
      .optional()
      .isString()
      .withMessage('Quotation name must be a string')
      .trim(),

    body('clientName')
      .optional()
      .isString()
      .withMessage('Client name must be a string')
      .trim(),

    body('subject')
      .optional()
      .isString()
      .withMessage('Subject must be a string')
      .trim(),

    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one item is required')
      .custom((items) => {
        for (const item of items) {
          if (!item.productName || typeof item.productName !== 'string') {
            throw new Error('Product name is required for all items');
          }
          if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
            throw new Error('Valid quantity is required for all items');
          }
          if (!item.unitPrice || typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
            throw new Error('Valid unit price is required for all items');
          }
        }
        return true;
      }),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Add payment validation
  addPayment: [
    param('id')
      .notEmpty()
      .withMessage('Quotation ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid quotation ID format');
        }
        const quotation = await Quotation.findById(value);
        if (!quotation) {
          throw new Error('Quotation not found');
        }
        if (quotation.status !== 'Sent') {
          throw new Error('Only Sent quotations can receive payments');
        }
        return true;
      }),

    body('amountReceived')
      .notEmpty()
      .withMessage('Payment amount is required')
      .isNumeric()
      .withMessage('Payment amount must be a number')
      .custom((value) => {
        if (value <= 0) {
          throw new Error('Payment amount must be greater than 0');
        }
        return true;
      }),

    body('paymentMethod')
      .notEmpty()
      .withMessage('Payment method is required')
      .isIn(['Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'Other'])
      .withMessage('Invalid payment method'),

    body('paymentDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value) => {
        const paymentDate = new Date(value);
        const today = new Date();
        if (paymentDate > today) {
          throw new Error('Payment date cannot be in the future');
        }
        return true;
      }),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Approve quotation validation
  approveQuotation: [
    param('id')
      .notEmpty()
      .withMessage('Quotation ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid quotation ID format');
        }
        const quotation = await Quotation.findById(value);
        if (!quotation) {
          throw new Error('Quotation not found');
        }
        if (quotation.status !== 'Sent') {
          throw new Error('Only Sent quotations can be approved');
        }
        return true;
      }),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Delete quotation validation
  deleteQuotation: [
    param('id')
      .notEmpty()
      .withMessage('Quotation ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid quotation ID format');
        }
        const quotation = await Quotation.findById(value);
        if (!quotation) {
          throw new Error('Quotation not found');
        }
        if (quotation.status !== 'Draft' && quotation.status !== 'Rejected') {
          throw new Error('Only Draft or Rejected quotations can be deleted');
        }
        return true;
      }),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Get quotation validation
  getQuotation: [
    param('id')
      .notEmpty()
      .withMessage('Quotation ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid quotation ID format');
        }
        const quotation = await Quotation.findById(value);
        if (!quotation) {
          throw new Error('Quotation not found');
        }
        return true;
      }),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // List quotations validation
  listQuotations: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['Draft', 'Sent', 'Approved', 'Rejected']).withMessage('Invalid status'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Add products validation
  addProducts: [
    param('quotationId')
      .notEmpty()
      .withMessage('Quotation ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid quotation ID format');
        }
        const quotation = await Quotation.findById(value);
        if (!quotation) {
          throw new Error('Quotation not found');
        }
        if (quotation.status !== 'Draft') {
          throw new Error('Can only add products to Draft quotations');
        }
        return true;
      }),

    body('products')
      .isArray({ min: 1 })
      .withMessage('At least one product is required')
      .custom((products) => {
        for (const product of products) {
          if (!product.productId || !mongoose.Types.ObjectId.isValid(product.productId)) {
            throw new Error('Valid product ID is required for all products');
          }
          if (!product.quantity || typeof product.quantity !== 'number' || product.quantity <= 0) {
            throw new Error('Valid quantity is required for all products');
          }
        }
        return true;
      }),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Add financial details validation
  addFinancialDetails: [
    param('quotationId')
      .notEmpty()
      .withMessage('Quotation ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid quotation ID format');
        }
        const quotation = await Quotation.findById(value);
        if (!quotation) {
          throw new Error('Quotation not found');
        }
        if (quotation.status !== 'Draft') {
          throw new Error('Can only add financial details to Draft quotations');
        }
        return true;
      }),

    body('cgst').optional().isNumeric().withMessage('CGST must be a number'),
    body('sgst').optional().isNumeric().withMessage('SGST must be a number'),
    body('otherTax').optional().isNumeric().withMessage('Other tax must be a number'),
    body('discount').optional().isNumeric().withMessage('Discount must be a number'),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Finalize quotation validation
  finalizeQuotation: [
    param('quotationId')
      .notEmpty()
      .withMessage('Quotation ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid quotation ID format');
        }
        const quotation = await Quotation.findById(value);
        if (!quotation) {
          throw new Error('Quotation not found');
        }
        if (quotation.status !== 'Draft') {
          throw new Error('Can only finalize Draft quotations');
        }
        if (!quotation.items || quotation.items.length === 0) {
          throw new Error('Quotation must have at least one product');
        }
        return true;
      }),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Add transaction validation
  addTransaction: [
    param('quotationId')
      .notEmpty()
      .withMessage('Quotation ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid quotation ID format');
        }
        const quotation = await Quotation.findById(value);
        if (!quotation) {
          throw new Error('Quotation not found');
        }
        return true;
      }),

    body('type')
      .notEmpty()
      .withMessage('Transaction type is required')
      .isIn(['credit', 'debit', 'tax', 'discount', 'adjustment'])
      .withMessage('Invalid transaction type'),

    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom((value) => {
        if (value <= 0) {
          throw new Error('Amount must be greater than zero');
        }
        return true;
      }),

    body('note').optional().isString().withMessage('Note must be a string'),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ]
};

module.exports = quotationValidations; 