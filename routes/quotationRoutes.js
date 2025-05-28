const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotationController");
const quotationValidations = require("../middlewares/quotationValidations");

// Get all quotations
router.get("/", 
  quotationValidations.listQuotations,
  quotationController.getAllQuotations
);

// Get single quotation by ID
router.get("/:id", 
  quotationValidations.getQuotation,
  quotationController.getQuotationById
);

// Create complete quotation
router.post("/", 
  quotationValidations.createQuotation,
  quotationController.createQuotation
);

// Create initial quotation
router.post("/initial",
  quotationValidations.createInitialQuotation,
  quotationController.createInitialQuotation
);

// Add products to quotation
router.post("/:quotationId/products",
  quotationValidations.addProducts,
  quotationController.addProductsToQuotation
);

// Add financial details to quotation
router.post("/:quotationId/financial",
  quotationValidations.addFinancialDetails,
  quotationController.addFinancialDetails
);

// Finalize quotation
router.post("/:quotationId/finalize",
  quotationValidations.finalizeQuotation,
  quotationController.finalizeQuotation
);

// Update quotation
router.put("/:id", 
  quotationValidations.updateQuotation,
  quotationController.updateQuotation
);

// Approve quotation
router.patch("/:id/approve", 
  quotationValidations.approveQuotation,
  quotationController.approveQuotation
);

// Add payment
router.post("/:id/payment", 
  quotationValidations.addPayment,
  quotationController.addPayment
);

// Delete quotation
router.delete("/:id", 
  quotationValidations.deleteQuotation,
  quotationController.deleteQuotation
);

// Get quotation with all details
router.get("/:id/view", 
  quotationValidations.getQuotation,
  quotationController.getQuotationView
);

// Get all unique categories
router.get('/categories', quotationController.getAllCategories);

// Get quotations by category
router.get('/category/:category', quotationController.getQuotationsByCategory);

// Get all quotations with products and financial details
router.get("/all/details", 
  quotationValidations.listQuotations,
  quotationController.getAllQuotationsWithDetails
);

// Add transaction entry
router.post("/:quotationId/transaction",
  quotationValidations.addTransaction,
  quotationController.addTransactionEntry
);

module.exports = router;