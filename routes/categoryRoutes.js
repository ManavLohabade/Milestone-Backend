const express = require("express");
const router = express.Router();

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  dropdownCategories,
  updateCategory,
  deleteCategory,
  addSubcategories,
  addSubSubcategories,
  getAllParentCategories,
  getSubcategories,
  getSubSubcategories,
  updateSubcategory,
  deleteSubcategory,
  updateSubSubcategory,
  deleteSubSubcategory,
  createBulkCategories
} = require("../controllers/categoryController");

const {
  validateCreateCategory,
  validateUpdateCategory,
  validateDeleteCategory,
  validateSubcategoryOperations,
  validateSubSubcategoryCreation
} = require("../middlewares/categoryValidations");

// Common routes
router.get("/", getAllCategories); // Get all categories
router.get("/dropdown", dropdownCategories); // Get categories for dropdown
router.get("/parents", getAllParentCategories);// Get all parent categories
router.get("/:id", getCategoryById); // Get category by ID

// Category management routes
router.post("/", validateCreateCategory, createCategory); // Create new category
router.put("/:id", validateUpdateCategory, updateCategory); // Update category
router.delete("/:id", validateDeleteCategory, deleteCategory);// Delete category

// Subcategory routes
router.get("/:parentId/subs", getSubcategories); // Get subcategories
router.post("/:parentId/sub", validateSubcategoryOperations, addSubcategories); // Add subcategories
router.put("/sub/:id", validateUpdateCategory, updateSubcategory); // Update subcategory
router.delete("/sub/:id", validateDeleteCategory, deleteSubcategory);// Delete subcategory

// Sub-subcategory routes
router.get("/sub/:subcategoryId/subsubs", getSubSubcategories);// Get sub-subcategories
router.post("/sub/:subcategoryId/subsub", validateSubSubcategoryCreation, addSubSubcategories); // Add sub-subcategories
router.put("/subsub/:id", validateUpdateCategory, updateSubSubcategory); // Update sub-subcategory
router.delete("/subsub/:id", validateDeleteCategory, deleteSubSubcategory); // Delete sub-subcategory

// Master bulk category creation
router.post("/bulk", createBulkCategories);

module.exports = router;
