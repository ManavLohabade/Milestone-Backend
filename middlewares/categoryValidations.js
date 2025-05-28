const mongoose = require('mongoose');
const Category = require('../models/categoryModel');
const ResponseHandler = require('../utils/responseHandler');
const { API_RESPONSES } = require('../constants/apiResponses');
const Product = require('../models/productModel');
const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * Validate category name format and length
 * @param {string} categoryName 
 * @returns {boolean}
 */
const isValidCategoryName = (categoryName) => {
  if (!categoryName || typeof categoryName !== 'string') return false;
  const trimmedName = categoryName.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 50;
};

/**
 * Validate description length
 * @param {string} description 
 * @returns {boolean}
 */
const isValidDescription = (description) => {
  if (!description) return true; // Description is optional
  return description.length <= 500;
};

/**
 * Validate subcategory structure
 * @param {Object} subcategory 
 * @param {number} level 
 * @returns {string|null} Error message or null if valid
 */
const validateSubcategoryStructure = async (subcategory, level) => {
  // Check maximum nesting level
  if (level >= 3) {
    return API_RESPONSES.ERROR.CATEGORY.MAX_LEVEL;
  }

  // Validate category name
  if (!isValidCategoryName(subcategory.categoryName)) {
    return API_RESPONSES.ERROR.CATEGORY.INVALID_NAME;
  }

  // Validate description if provided
  if (subcategory.description && !isValidDescription(subcategory.description)) {
    return API_RESPONSES.ERROR.CATEGORY.INVALID_DESCRIPTION;
  }

  // Check if category name already exists
  const existingCategory = await Category.findOne({ categoryName: subcategory.categoryName });
  if (existingCategory) {
    return API_RESPONSES.ERROR.CATEGORY.ALREADY_EXISTS;
  }

  // Validate nested subcategories if they exist
  if (subcategory.subcategories && Array.isArray(subcategory.subcategories)) {
    for (const subCat of subcategory.subcategories) {
      const error = await validateSubcategoryStructure(subCat, level + 1);
      if (error) return error;
    }
  }

  return null;
};

/**
 * Validate create category request
 */
const validateCreateCategory = async (req, res, next) => {
  try {
    const { categoryName, description, subcategories } = req.body;

    // Validate main category
    if (!isValidCategoryName(categoryName)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_NAME);
    }

    if (description && !isValidDescription(description)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_DESCRIPTION);
    }

    // Check if main category name exists
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.ALREADY_EXISTS);
    }

    // Validate subcategories if provided
    if (subcategories && Array.isArray(subcategories)) {
      for (const subcategory of subcategories) {
        const error = await validateSubcategoryStructure(subcategory, 1);
        if (error) {
          return ResponseHandler.badRequest(res, error);
        }
      }
    }

    next();
  } catch (error) {
    console.error("Error in validateCreateCategory:", error);
    return ResponseHandler.error(res, API_RESPONSES.ERROR.GENERAL.VALIDATION_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Validate update category request
 */
const validateUpdateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { categoryName, description } = req.body;

    // Validate category ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }

    // Validate category name if provided
    if (categoryName !== undefined) {
      if (!isValidCategoryName(categoryName)) {
        return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_NAME);
      }

      // Check if new name already exists (if name is being changed)
      if (categoryName !== category.categoryName) {
        const existingCategory = await Category.findOne({ categoryName });
        if (existingCategory) {
          return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.ALREADY_EXISTS);
        }
      }
    }

    // Validate description if provided
    if (description !== undefined && !isValidDescription(description)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_DESCRIPTION);
    }

    next();
  } catch (error) {
    console.error("Error in validateUpdateCategory:", error);
    return ResponseHandler.error(res, API_RESPONSES.ERROR.GENERAL.VALIDATION_ERROR);
  }
};

/**
 * Validate delete category request
 */
const validateDeleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate category ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }

    // Allow deletion even if products or subcategories exist (handled in controller)
    next();
  } catch (error) {
    console.error("Error in validateDeleteCategory:", error);
    return ResponseHandler.error(res, API_RESPONSES.ERROR.GENERAL.VALIDATION_ERROR);
  }
};

/**
 * Validate subcategory operations
 */
const validateSubcategoryOperations = async (req, res, next) => {
  try {
    const { parentId } = req.params;
    const { subcategories } = req.body;

    // Validate parent ID
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }

    // Check if parent category exists
    const parentCategory = await Category.findById(parentId);
    if (!parentCategory) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }

    // Check if parent is at maximum level
    if (parentCategory.level >= 2) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.MAX_LEVEL);
    }

    // Validate subcategories array
    if (!subcategories || !Array.isArray(subcategories) || subcategories.length === 0) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_SUBCATEGORIES);
    }

    // Validate each subcategory
    for (const sub of subcategories) {
      if (!sub.categoryName || !isValidCategoryName(sub.categoryName)) {
        return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_NAME);
      }

      if (sub.description && !isValidDescription(sub.description)) {
        return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_DESCRIPTION);
      }

      // Check if subcategory name already exists
      const existingCategory = await Category.findOne({ categoryName: sub.categoryName });
      if (existingCategory) {
        return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.ALREADY_EXISTS);
      }
    }

    next();
  } catch (error) {
    console.error("Error in validateSubcategoryOperations:", error);
    return ResponseHandler.error(res, API_RESPONSES.ERROR.GENERAL.VALIDATION_ERROR);
  }
};

/**
 * Validate sub-subcategory operations
 */
const validateSubSubcategoryOperations = async (req, res, next) => {
  try {
    const { parentId } = req.params;
    const { categoryName, description } = req.body;

    // Validate parent ID
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return ResponseHandler.badRequest(res, {
        success: false,
        status: 400,
        error: 'Invalid parent category ID'
      });
    }

    // Check if parent category exists and is a subcategory (level 1)
    const parentCategory = await Category.findById(parentId);
    if (!parentCategory) {
      return ResponseHandler.badRequest(res, {
        success: false,
        status: 400,
        error: 'Parent category not found'
      });
    }

    if (parentCategory.level !== 1) {
      return ResponseHandler.badRequest(res, {
        success: false,
        status: 400,
        error: 'Parent must be a subcategory (level 1)'
      });
    }

    // Validate category name
    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim().length === 0) {
      return ResponseHandler.badRequest(res, {
        success: false,
        status: 400,
        error: 'Category name is required'
      });
    }

    if (categoryName.trim().length < 2 || categoryName.trim().length > 50) {
      return ResponseHandler.badRequest(res, {
        success: false,
        status: 400,
        error: 'Category name must be between 2 and 50 characters'
      });
    }

    // Validate description if provided
    if (description && description.trim().length > 500) {
      return ResponseHandler.badRequest(res, {
        success: false,
        status: 400,
        error: 'Description cannot exceed 500 characters'
      });
    }

    // Check if category name already exists
    const existingCategory = await Category.findOne({
      categoryName: categoryName.trim(),
      isActive: true
    });

    if (existingCategory) {
      return ResponseHandler.badRequest(res, {
        success: false,
        status: 400,
        error: 'Category name already exists'
      });
    }

    next();
  } catch (error) {
    console.error("Error in validateSubSubcategoryOperations:", error);
    return ResponseHandler.error(res, {
      success: false,
      status: 500,
      error: 'Internal server error during validation'
    });
  }
};

/**
 * Validate sub-subcategory creation
 */
const validateSubSubcategoryCreation = async (req, res, next) => {
  try {
    const { subcategoryId } = req.params;
    const { categoryName, description } = req.body;

    console.log('Validating sub-subcategory creation:', {
      subcategoryId,
      categoryName,
      description
    });

    // Validate subcategory ID
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      console.log('Invalid subcategory ID:', subcategoryId);
      return ResponseHandler.badRequest(res, 'Invalid subcategory ID');
    }

    // Check if subcategory exists
    const parentSubcategory = await Category.findById(subcategoryId);
    console.log('Parent subcategory:', parentSubcategory);
    
    if (!parentSubcategory) {
      console.log('Subcategory not found for ID:', subcategoryId);
      return ResponseHandler.badRequest(res, 'Subcategory not found');
    }

    // Verify parent is a subcategory (level 1)
    console.log('Parent subcategory level:', parentSubcategory.level);
    if (parentSubcategory.level !== 1) {
      console.log('Invalid parent level:', parentSubcategory.level);
      return ResponseHandler.badRequest(res, 'Parent must be a subcategory (level 1)');
    }

    // Validate category name
    if (!categoryName || typeof categoryName !== 'string') {
      console.log('Invalid category name:', categoryName);
      return ResponseHandler.badRequest(res, 'Category name is required and must be a string');
    }

    if (categoryName.trim().length < 2 || categoryName.trim().length > 50) {
      console.log('Invalid category name length:', categoryName.length);
      return ResponseHandler.badRequest(res, 'Category name must be between 2 and 50 characters');
    }

    // Check for duplicate name
    const existingCategory = await Category.findOne({
      categoryName: categoryName.trim(),
      isActive: true
    });

    if (existingCategory) {
      console.log('Duplicate category found:', existingCategory);
      return ResponseHandler.badRequest(res, 'Category name already exists');
    }

    console.log('Validation passed successfully');
    next();
  } catch (error) {
    console.error("Error in validateSubSubcategoryCreation:", error);
    return ResponseHandler.error(res, 'Internal server error during validation', 500);
  }
};

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
  validateDeleteCategory,
  validateSubcategoryOperations,
  validateSubSubcategoryOperations,
  validateSubSubcategoryCreation
};