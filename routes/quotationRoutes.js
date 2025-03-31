const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotationController");

// Get all quotations
router.get("/", quotationController.getAllQuotations);

// Get single quotation by ID
router.get("/:id", quotationController.getQuotationById);

// Create new quotation
router.post("/", quotationController.createQuotation);

// Update quotation status
router.patch("/:id/status", quotationController.updateQuotationStatus);

// Update payment received
router.patch("/:id/payment", quotationController.updatePayment);

// Delete quotation
router.delete("/:id", quotationController.deleteQuotation);

module.exports = router;