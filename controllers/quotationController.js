const mongoose = require("mongoose");
const Quotation = require("../models/quotationModel");
const QuotationService = require('../services/quotationServices');

// Create an instance of the service
const quotationService = new QuotationService();

// Add Quotation
const quotationController = {
  // Create complete quotation
  createQuotation: async (req, res) => {
    try {
      const quotation = await quotationService.createQuotation(req.body);
      res.status(201).json(quotation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Create initial quotation with basic details
  createInitialQuotation: async (req, res) => {
    try {
      const quotation = await quotationService.createInitialQuotation(req.body);
      res.status(201).json(quotation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Add products to quotation
  addProductsToQuotation: async (req, res) => {
    try {
      const { quotationId } = req.params;
      const { products } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(quotationId)) {
        return res.status(400).json({ message: 'Invalid quotation ID' });
      }

      const quotation = await quotationService.addProductsToQuotation(quotationId, products);
      res.json(quotation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Add financial details to quotation
  addFinancialDetails: async (req, res) => {
    try {
      const { quotationId } = req.params;
      const financialDetails = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(quotationId)) {
        return res.status(400).json({ message: 'Invalid quotation ID' });
      }

      const quotation = await quotationService.addFinancialDetails(quotationId, financialDetails);
      res.json(quotation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Finalize quotation
  finalizeQuotation: async (req, res) => {
    try {
      const { quotationId } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(quotationId)) {
        return res.status(400).json({ message: 'Invalid quotation ID' });
      }

      const quotation = await quotationService.finalizeQuotation(quotationId);
      res.json(quotation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Get all quotations
  getAllQuotations: async (req, res) => {
    try {
      const quotations = await quotationService.getQuotationsByFilters(req.query);
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get single quotation
  getQuotationById: async (req, res) => {
    try {
      const quotation = await quotationService.getQuotationById(req.params.id);
      res.json(quotation);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  // Update quotation
  updateQuotation: async (req, res) => {
    try {
      const quotation = await quotationService.updateQuotation(req.params.id, req.body);
      res.json(quotation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Delete quotation
  deleteQuotation: async (req, res) => {
    try {
      const quotation = await quotationService.deleteQuotation(req.params.id);
      res.json(quotation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Approve quotation
  approveQuotation: async (req, res) => {
    try {
      const quotation = await quotationService.approveQuotation(req.params.id);
      res.json(quotation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Add payment
  addPayment: async (req, res) => {
    try {
      const payment = await quotationService.addPayment(req.params.id, req.body);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Get quotation with all details
  getQuotationView: async (req, res) => {
    try {
      const viewData = await quotationService.getQuotationView(req.params.id);
      res.json(viewData);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  // Get all unique categories from quotation items
  getAllCategories: async (req, res) => {
    try {
      const categories = await Quotation.aggregate([
        { $unwind: "$items" },
        { $group: { _id: "$items.category" } },
        { $match: { _id: { $ne: null } } },
        { $sort: { _id: 1 } }
      ]);
      res.json(categories.map(c => c._id));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get all quotations with items in a given category
  getQuotationsByCategory: async (req, res) => {
    try {
      const category = req.params.category;
      const quotations = await Quotation.find({ "items.category": category });
      res.json(quotations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get all quotations with products and financial details
  getAllQuotationsWithDetails: async (req, res) => {
    try {
      const quotations = await quotationService.getAllQuotationsWithDetails();
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Add transaction entry
  addTransactionEntry: async (req, res) => {
    try {
      const { quotationId } = req.params;
      const entryData = req.body;

      if (!mongoose.Types.ObjectId.isValid(quotationId)) {
        return res.status(400).json({ message: 'Invalid quotation ID' });
      }

      const transaction = await quotationService.addTransactionEntry(quotationId, entryData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = quotationController; 