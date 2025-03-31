const mongoose = require("mongoose");
const Quotation = require("../models/quotationModel");

/**
 * Controller for handling quotation-related requests
 */
const quotationController = {
  /**
   * Create a new quotation
   */
  createQuotation: async (req, res) => {
    try {
      const { customerName, items, paymentReceived = 0 } = req.body;

      if (!customerName) {
        return res.status(400).json({ message: "Customer name is required" });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Please provide at least one item" });
      }

      // Validate items
      for (const item of items) {
        if (!item.productName || !item.quantity || !item.unit || !item.price) {
          return res.status(400).json({ 
            message: "Each item must have productName, quantity, unit, and price" 
          });
        }
      }

      const newQuotation = new Quotation({
        customerName,
        items,
        paymentReceived
      });

      const savedQuotation = await newQuotation.save();
      res.status(201).json(savedQuotation);
    } catch (error) {
      res.status(400).json({ 
        message: error.message || "Error creating quotation"
      });
    }
  },

  /**
   * Get all quotations
   */
  getAllQuotations: async (req, res) => {
    try {
      const quotations = await Quotation.find()
        .sort({ date: -1 })
        .select('customerName quotationNumber date paymentReceived grandTotal status');

      const formattedQuotations = quotations.map(quotation => ({
        _id: quotation._id,
        customerName: quotation.customerName,
        quotationNumber: quotation.quotationNumber,
        date: quotation.date.toISOString(),
        paymentReceived: Number(quotation.paymentReceived || 0).toFixed(2),
        grandTotal: Number(quotation.grandTotal || 0).toFixed(2),
        status: quotation.status
      }));

      res.status(200).json(formattedQuotations);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch quotations"
      });
    }
  },

  /**
   * Get quotation by ID
   */
  getQuotationById: async (req, res) => {
    try {
      const quotation = await Quotation.findById(req.params.id);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      const formattedQuotation = {
        _id: quotation._id,
        customerName: quotation.customerName,
        quotationNumber: quotation.quotationNumber,
        date: quotation.date.toISOString(),
        items: quotation.items.map(item => ({
          productName: item.productName,
          quantity: Number(item.quantity),
          unit: item.unit,
          price: Number(item.price).toFixed(2),
          total: Number(item.total).toFixed(2)
        })),
        grandTotal: Number(quotation.grandTotal).toFixed(2),
        paymentReceived: Number(quotation.paymentReceived || 0).toFixed(2),
        status: quotation.status
      };
      
      res.status(200).json(formattedQuotation);
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: "Invalid quotation ID format" });
      }
      res.status(500).json({ message: "Error fetching quotation" });
    }
  },

  /**
   * Update quotation status
   */
  updateQuotationStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["Pending", "Approved"].includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status. Must be either 'Pending' or 'Approved'" 
        });
      }

      const quotation = await Quotation.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      res.status(200).json(quotation);
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: "Invalid quotation ID format" });
      }
      res.status(400).json({ message: error.message || "Failed to update quotation status" });
    }
  },

  /**
   * Update payment received
   */
  updatePayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentReceived } = req.body;

      if (typeof paymentReceived !== 'number' || paymentReceived < 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const quotation = await Quotation.findByIdAndUpdate(
        id,
        { paymentReceived },
        { new: true }
      );

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      res.status(200).json({
        _id: quotation._id,
        quotationNumber: quotation.quotationNumber,
        paymentReceived: Number(quotation.paymentReceived).toFixed(2),
        grandTotal: Number(quotation.grandTotal).toFixed(2)
      });
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: "Invalid quotation ID format" });
      }
      res.status(400).json({ message: "Failed to update payment" });
    }
  },

  /**
   * Delete quotation
   */
  deleteQuotation: async (req, res) => {
    try {
      const quotation = await Quotation.findByIdAndDelete(req.params.id);

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      res.status(200).json({ message: "Quotation deleted successfully" });
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: "Invalid quotation ID format" });
      }
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  }
};

module.exports = quotationController;