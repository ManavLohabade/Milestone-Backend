const mongoose = require("mongoose");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const ResponseHandler = require("../utils/responseHandler");
const { API_RESPONSES } = require("../constants/apiResponses");

// Helper function for error handling
const handleError = (res, error, message = "Internal server error") => {
  console.error(`Error: ${message}`, error);
  const status = error.code === 11000 ? 400 : 500;
  const errorMessage = error.code === 11000 ? "Category name already exists" : message;
  
  return ResponseHandler.error(res, { message: errorMessage }, status);
};

// Helper function to validate category ID
const validateCategoryId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  return true;
};

// Helper function to check category existence
const checkCategoryExists = async (id) => {
  const category = await Category.findById(id);
  return category;
};

const checkDuplicateName = async (categoryName, excludeId = null) => {
  const query = { categoryName };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existingCategory = await Category.findOne(query);
  return existingCategory;
};

/**
 * Get all categories with complete hierarchical structure
 * GET /api/categories
 */
const getAllCategories = async (req, res) => {
  try {
    console.log("Fetching all categories");

    // Get parent categories with complete population
    const parentCategories = await Category.find({ 
      level: 0, 
      isActive: true 
    })
    .populate({
      path: "subcategories",
      match: { isActive: true },
      select: "-__v",
      populate: {
        path: "subcategories",
        match: { isActive: true },
        select: "-__v"
      }
    })
    .select("-__v")
    .sort({ categoryName: 1 });

    // Transform the data to include all necessary information
    const transformResponse = (category) => {
      const subcategories = category.subcategories || [];
      
      return {
      _id: category._id,
      categoryName: category.categoryName,
      description: category.description,
      productCount: category.productCount || 0,
      level: category.level,
      categoryType: category.categoryType,
      parentCategory: category.parentCategory,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      subcategories: subcategories.map(sub => transformResponse(sub))
      };
    };

    const transformedCategories = parentCategories.map(category => transformResponse(category));

    return ResponseHandler.success(
      res, 
      transformedCategories,
      API_RESPONSES.SUCCESS.CATEGORY.FETCHED,
      200
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return ResponseHandler.error(
      res, 
      { message: API_RESPONSES.ERROR.CATEGORY.FETCH_FAILED }, 
      500
    );
  }
};

/**
 * Get all parent categories (level 0)
 * GET /api/categories/parents
 */
const getAllParentCategories = async (req, res) => {
  try {
    // Get all parent categories with subcategory count
    const parentCategories = await Category.find({ 
      level: 0, 
      isActive: true 
    })
    .select("categoryName description productCount createdAt updatedAt")
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: '_id'
    })
    .sort({ categoryName: 1 });

    // Get product counts
    const productCounts = await Promise.all(
      parentCategories.map(async (category) => {
        const count = await Product.countDocuments({ category: category._id });
        return { categoryId: category._id.toString(), count };
      })
    );

    // Create a map of category IDs to product counts
    const productCountMap = productCounts.reduce((map, item) => {
      map[item.categoryId] = item.count;
      return map;
    }, {});

    // Transform the response
    const transformedCategories = parentCategories.map(category => ({
      _id: category._id,
      categoryName: category.categoryName,
      description: category.description,
      productCount: productCountMap[category._id.toString()] || 0,
      subcategoriesCount: category.subcategories ? category.subcategories.length : 0,
      level: 0,
      categoryType: "parentcategory",
      hierarchyLevel: "Parent Category",
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));

    return ResponseHandler.success(
      res, 
      transformedCategories, 
      API_RESPONSES.SUCCESS.CATEGORY.PARENT_FETCHED, 
      200
    );
  } catch (error) {
    console.error("Error fetching parent categories:", error);
    return ResponseHandler.error(
      res, 
      { message: API_RESPONSES.ERROR.CATEGORY.FETCH_FAILED }, 
      500
    );
  }
};

/**
 * Get a single category by ID
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }

  try {
    const category = await Category.findById(id).populate({
        path: "subcategories",
      select: "categoryName description productCount level categoryType",
      match: { isActive: true },
        populate: {
          path: "subcategories",
          select: "categoryName description productCount level categoryType",
        match: { isActive: true }
      }
    });

    if (!category) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }

    // Transform the data to include explicit level information
    const transformedCategory = {
      _id: category._id,
      categoryName: category.categoryName,
      description: category.description,
      productCount: category.productCount,
      level: category.level,
      categoryType: category.categoryType,
      parentCategory: category.parentCategory,
      subcategories: category.subcategories.map((sub) => ({
        _id: sub._id,
        categoryName: sub.categoryName,
        description: sub.description,
        productCount: sub.productCount,
        level: sub.level,
        categoryType: sub.categoryType,
        subcategories: sub.subcategories.map((subSub) => ({
          _id: subSub._id,
          categoryName: subSub.categoryName,
          description: subSub.description,
          productCount: subSub.productCount,
          level: subSub.level,
          categoryType: subSub.categoryType,
        })),
      })),
    };

    return ResponseHandler.success(res, transformedCategory, API_RESPONSES.SUCCESS.CATEGORY.SINGLE_FETCHED, 200);
  } catch (error) {
    console.error("Error fetching category:", error);
    return ResponseHandler.error(res, { message: API_RESPONSES.ERROR.CATEGORY.FETCH_FAILED }, 500);
  }
};

/**
 * Get categories for dropdown menu
 * GET /api/categories/dropdown
 */
const dropdownCategories = async (req, res) => {
  try {
    // Get all active categories
    const categories = await Category.find({ isActive: true })
      .select("categoryName level categoryType parentCategory")
      .sort({ categoryName: 1 });

    // Transform categories for dropdown
    const dropdownData = categories.map(category => ({
      _id: category._id,
      name: category.categoryName,
      level: category.level,
      type: category.categoryType,
      parentId: category.parentCategory
    }));

    return ResponseHandler.success(res, dropdownData, API_RESPONSES.SUCCESS.CATEGORY.FETCHED, 200);
  } catch (error) {
    console.error("Error fetching dropdown categories:", error);
    return ResponseHandler.error(res, { message: API_RESPONSES.ERROR.CATEGORY.FETCH_FAILED }, 500);
  }
};

/**
 * Create a new category with nested subcategories
 * POST /api/categories/parent
 */
const createCategory = async (req, res) => {
  try {
    const { categoryName, description, subcategories } = req.body;

    // Check for duplicate category name
    const existingCategory = await checkDuplicateName(categoryName);
    if (existingCategory) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.ALREADY_EXISTS);
    }

    // Create parent category
    const newCategory = new Category({
      categoryName,
      description,
      level: 0,
      categoryType: "parentcategory",
      parentCategory: null,
      ancestryPath: [],
      subcategories: []
    });

    const savedCategory = await newCategory.save();

    // Process subcategories recursively
    const processSubcategories = async (parentCategory, subcategoriesArray, level) => {
      const savedSubcategories = [];
      
      for (const sub of subcategoriesArray) {
        // Check for duplicate subcategory name
        const existingSubcategory = await checkDuplicateName(sub.categoryName);
        if (existingSubcategory) {
          throw new Error(`Subcategory name "${sub.categoryName}" already exists`);
        }

        // Create subcategory
        const newSubcategory = new Category({
          categoryName: sub.categoryName,
          description: sub.description,
          level: level,
          categoryType: level === 1 ? "subcategory" : "sub-subcategory",
          parentCategory: parentCategory._id,
          ancestryPath: [...parentCategory.ancestryPath, parentCategory._id],
          subcategories: []
        });

        const savedSubcategory = await newSubcategory.save();
        savedSubcategories.push(savedSubcategory);

        // Update parent's subcategories array
        await Category.findByIdAndUpdate(
          parentCategory._id,
          { $push: { subcategories: savedSubcategory._id } }
        );

        // Process nested subcategories if they exist
        if (sub.subcategories && Array.isArray(sub.subcategories) && sub.subcategories.length > 0) {
          await processSubcategories(savedSubcategory, sub.subcategories, level + 1);
        }
      }
      
      return savedSubcategories;
    };

    // Process first level subcategories if they exist
    if (subcategories && Array.isArray(subcategories) && subcategories.length > 0) {
      await processSubcategories(savedCategory, subcategories, 1);
    }

    // Fetch the complete category with populated subcategories
    const populatedCategory = await Category.findById(savedCategory._id)
      .populate({
        path: 'subcategories',
        match: { isActive: true },
        populate: {
          path: 'subcategories',
          match: { isActive: true }
        }
      });

    return ResponseHandler.success(
      res,
      populatedCategory,
      API_RESPONSES.SUCCESS.CATEGORY.CREATED,
      201
    );
  } catch (error) {
    console.error("Error in createCategory:", error);
    return ResponseHandler.error(res, error, API_RESPONSES.ERROR.CATEGORY.CREATE_FAILED);
  }
};

/**
 * Update a category
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, description } = req.body;

    if (!validateCategoryId(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }

    // Check if category exists
    const category = await checkCategoryExists(id);
    if (!category) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }

    // Check if new name already exists (if name is being updated)
    if (categoryName && categoryName !== category.categoryName) {
      const existingCategory = await checkDuplicateName(categoryName, id);
      if (existingCategory) {
        return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.ALREADY_EXISTS);
      }
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { categoryName, description },
      { new: true }
    );

    return ResponseHandler.success(res, updatedCategory, API_RESPONSES.SUCCESS.CATEGORY.UPDATED, 200);
  } catch (error) {
    return handleError(res, error, API_RESPONSES.ERROR.CATEGORY.UPDATE_FAILED);
  }
};

/**
 * Delete a category and all its subcategories and sub-subcategories (cascade delete)
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to delete category with ID: ${id}`);

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      console.log(`Category with ID ${id} not found`);
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }
    console.log(`Found category: ${category.categoryName}`);

    // If this is a parent (main) category, set all products with this category to category=null
    if (category.level === 0) {
      await Product.updateMany({ category: id }, { $set: { category: null } });
    }

    // Helper function to recursively delete subcategories and their products
    const deleteCategoryRecursively = async (categoryId) => {
      // Find all subcategories
      const subcategories = await Category.find({ parentCategory: categoryId });
      for (const sub of subcategories) {
        await deleteCategoryRecursively(sub._id);
      }
      // Delete the category itself
      await Category.findByIdAndDelete(categoryId);
    };

    // Start recursive deletion
    await deleteCategoryRecursively(id);
    console.log(`Successfully deleted category and all descendants: ${category.categoryName}`);

    return ResponseHandler.success(res, null, API_RESPONSES.SUCCESS.CATEGORY.DELETED, 200);
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    return handleError(res, error, API_RESPONSES.ERROR.CATEGORY.DELETE_FAILED);
  }
};

/**
 * Add subcategories to a parent category
 * POST /api/categories/:parentId/sub
 */
const addSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { subcategories } = req.body;

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

    // Create subcategories
    const createdSubcategories = [];
    for (const sub of subcategories) {
      // Check if subcategory name already exists
      const existingCategory = await Category.findOne({ categoryName: sub.categoryName });
      if (existingCategory) {
        return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.ALREADY_EXISTS);
      }

      // Create new subcategory
      const newSubcategory = new Category({
        categoryName: sub.categoryName,
        description: sub.description,
        parentCategory: parentId,
        level: parentCategory.level + 1,
        categoryType: parentCategory.level === 0 ? "subcategory" : "sub-subcategory",
        ancestryPath: [...parentCategory.ancestryPath, parentId]
      });

      const savedSubcategory = await newSubcategory.save();
      createdSubcategories.push(savedSubcategory);

      // Update parent's subcategories array
      await Category.findByIdAndUpdate(
        parentId,
        { $push: { subcategories: savedSubcategory._id } }
      );
    }

    return ResponseHandler.success(res, createdSubcategories, API_RESPONSES.SUCCESS.CATEGORY.CREATED, 201);
  } catch (error) {
    console.error("Error adding subcategories:", error);
    return ResponseHandler.error(res, { message: API_RESPONSES.ERROR.CATEGORY.CREATE_FAILED }, 500);
  }
};

/**
 * Get subcategories of a parent category
 * GET /api/categories/:parentId/subs
 */
const getSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }

    // Check if parent category exists
    const parentCategory = await Category.findById(parentId);
    if (!parentCategory) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }

    // Get subcategories and populate their sub-subcategory count
    const subcategories = await Category.aggregate([
      { $match: { parentCategory: new mongoose.Types.ObjectId(parentId), isActive: true } },
      { $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parentCategory',
          as: 'subSubCategories'
      }},
      { $addFields: {
          subcategoriesCount: { $size: '$subSubCategories' }
      }},
      { $project: {
          _id: 1,
          categoryName: 1,
          description: 1,
          productCount: 1,
          level: 1,
          categoryType: 1,
          parentCategory: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          // Explicitly include the calculated count
          subcategoriesCount: '$subcategoriesCount' 
      }},
      { $sort: { categoryName: 1 } }
    ]);

    console.log("Fetched subcategories with count:", subcategories);
    return ResponseHandler.success(res, subcategories, API_RESPONSES.SUCCESS.CATEGORY.SUB_FETCHED, 200);
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return ResponseHandler.error(res, { message: API_RESPONSES.ERROR.CATEGORY.FETCH_FAILED }, 500);
  }
};

/**
 * Add sub-subcategories to a subcategory
 * POST /api/categories/:parentId/subsub
 */
const addSubSubcategories = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { categoryName, description } = req.body;

    // Basic validation
    if (!categoryName || !subcategoryId) {
      return ResponseHandler.badRequest(res, {
        message: 'Category name and subcategory ID are required'
      });
    }

    // Validate subcategory ID format
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return ResponseHandler.badRequest(res, {
        message: 'Invalid subcategory ID format'
      });
    }

    // Find parent subcategory
    const parentSubcategory = await Category.findById(subcategoryId);
    if (!parentSubcategory) {
      return ResponseHandler.badRequest(res, {
        message: 'Parent subcategory not found'
      });
    }

    // Check if parent is a subcategory (level 1)
    if (parentSubcategory.level !== 1) {
      return ResponseHandler.badRequest(res, {
        message: 'Parent must be a subcategory'
      });
    }

    // Check for duplicate name
    const existingCategory = await Category.findOne({
      categoryName: categoryName.trim(),
      isActive: true
    });

    if (existingCategory) {
      return ResponseHandler.badRequest(res, {
        message: 'A category with this name already exists'
      });
    }

    // Create new sub-subcategory
    const newSubSubcategory = new Category({
      categoryName: categoryName.trim(),
      description: description ? description.trim() : '',
      parentCategory: subcategoryId,
      level: 2,
      categoryType: "sub-subcategory",
      ancestryPath: [...parentSubcategory.ancestryPath, subcategoryId],
      isActive: true
    });

    // Save the sub-subcategory
    const savedSubSubcategory = await newSubSubcategory.save();

    // Update parent's subcategories array
    await Category.findByIdAndUpdate(
      subcategoryId,
      { $push: { subcategories: savedSubSubcategory._id } }
    );

    return ResponseHandler.success(
      res,
      savedSubSubcategory,
      "Sub-subcategory created successfully",
      201
    );

  } catch (error) {
    console.error("Error in addSubSubcategories:", error);
    return ResponseHandler.error(
      res,
      {
        message: error.message || 'Failed to create sub-subcategory'
      },
      500
    );
  }
};

/**
 * Get sub-subcategories of a subcategory
 * GET /api/categories/:subcategoryId/subsubs
 */
const getSubSubcategories = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    console.log("Received subcategoryId in BE:", subcategoryId);

    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      console.log("mongoose.Types.ObjectId.isValid returned false for ID:", subcategoryId);
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }

    // Check if subcategory exists
    const parentSubcategory = await Category.findById(subcategoryId);
    if (!parentSubcategory) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }

    // Get sub-subcategories and populate their child count (which should be 0 for level 2)
    const subSubcategories = await Category.aggregate([
        { $match: { parentCategory: new mongoose.Types.ObjectId(subcategoryId), isActive: true } },
        { $addFields: { // Level 2 categories should not have children in this hierarchy
            subcategoriesCount: 0 
        }},
        { $project: {
            _id: 1,
            categoryName: 1,
            description: 1,
            productCount: 1,
            level: 1,
            categoryType: 1,
            parentCategory: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            subcategoriesCount: 1 // Include the count (will be 0)
        }},
        { $sort: { categoryName: 1 } }
      ]);

    return ResponseHandler.success(res, subSubcategories, API_RESPONSES.SUCCESS.CATEGORY.SUB_SUB_FETCHED, 200);
  } catch (error) {
    console.error("Error fetching sub-subcategories:", error);
    return ResponseHandler.error(res, { message: API_RESPONSES.ERROR.CATEGORY.FETCH_FAILED }, 500);
  }
};

/**
 * Update a subcategory
 * PUT /api/categories/sub/:id
 */
const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }

    // Check if subcategory exists
    const subcategory = await Category.findById(id);
    if (!subcategory) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }

    // Check if it's a subcategory (level 1)
    if (subcategory.level !== 1) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_LEVEL);
    }

    // Check if new name already exists
    if (categoryName && categoryName !== subcategory.categoryName) {
      const existingCategory = await Category.findOne({ categoryName });
      if (existingCategory) {
        return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.ALREADY_EXISTS);
      }
    }

    // Update subcategory
    const updatedSubcategory = await Category.findByIdAndUpdate(
      id,
      { 
        categoryName: categoryName || subcategory.categoryName,
        description: description || subcategory.description
      },
      { new: true }
    );

    return ResponseHandler.success(res, updatedSubcategory, API_RESPONSES.SUCCESS.CATEGORY.UPDATED, 200);
  } catch (error) {
    console.error("Error updating subcategory:", error);
    return ResponseHandler.error(res, { message: API_RESPONSES.ERROR.CATEGORY.UPDATE_FAILED }, 500);
  }
};

/**
 * Delete a subcategory
 * DELETE /api/categories/sub/:id
 */
const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }
    const subcategory = await Category.findById(id);
    if (!subcategory) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }
    if (subcategory.level !== 1) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_LEVEL);
    }
    // Remove subcategory from parent's subcategories array
    await Category.findByIdAndUpdate(
      subcategory.parentCategory,
      { $pull: { subcategories: id } }
    );
    // Delete subcategory
    await Category.findByIdAndDelete(id);
    return ResponseHandler.success(res, null, API_RESPONSES.SUCCESS.CATEGORY.DELETED, 200);
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    return ResponseHandler.error(res, { message: API_RESPONSES.ERROR.CATEGORY.DELETE_FAILED }, 500);
  }
};

/**
 * Update a sub-subcategory
 * PUT /api/categories/subsub/:id
 */
const updateSubSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }

    // Check if sub-subcategory exists and is a sub-subcategory (level 2)
    const subSubcategory = await Category.findById(id);
    if (!subSubcategory) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }

    if (subSubcategory.level !== 2) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_PARENT);
    }

    // Check if new name already exists (if name is being updated)
    if (categoryName && categoryName !== subSubcategory.categoryName) {
      const existingCategory = await Category.findOne({ categoryName });
      if (existingCategory) {
        return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.ALREADY_EXISTS);
      }
    }

    // Update sub-subcategory
    const updatedSubSubcategory = await Category.findByIdAndUpdate(
      id,
      { categoryName, description },
      { new: true }
    );

    return ResponseHandler.success(res, updatedSubSubcategory, API_RESPONSES.SUCCESS.CATEGORY.UPDATED, 200);
  } catch (error) {
    console.error("Error updating sub-subcategory:", error);
    return ResponseHandler.error(res, API_RESPONSES.ERROR.CATEGORY.UPDATE_FAILED, 500);
  }
};

/**
 * Delete a sub-subcategory
 * DELETE /api/categories/subsub/:id
 */
const deleteSubSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_ID);
    }
    const subSubcategory = await Category.findById(id);
    if (!subSubcategory) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.CATEGORY.NOT_FOUND);
    }
    if (subSubcategory.level !== 2) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.CATEGORY.INVALID_LEVEL);
    }
    // Remove sub-subcategory from parent's subcategories array
    await Category.findByIdAndUpdate(
      subSubcategory.parentCategory,
      { $pull: { subcategories: id } }
    );
    // Delete sub-subcategory
    await Category.findByIdAndDelete(id);
    return ResponseHandler.success(res, null, API_RESPONSES.SUCCESS.CATEGORY.DELETED, 200);
  } catch (error) {
    console.error("Error deleting sub-subcategory:", error);
    return ResponseHandler.error(res, { message: API_RESPONSES.ERROR.CATEGORY.DELETE_FAILED }, 500);
  }
};

/**
 * Bulk create parent categories with nested subcategories and sub-subcategories
 * POST /api/categories/bulk
 */
const createBulkCategories = async (req, res) => {
  try {
    const categories = req.body;
    if (!Array.isArray(categories) || categories.length === 0) {
      return ResponseHandler.badRequest(res, { message: 'Request body must be a non-empty array of categories.' });
    }

    const results = [];
    const errors = [];

    // Helper function (copied from createCategory)
    const processSubcategories = async (parentCategory, subcategoriesArray, level) => {
      for (const sub of subcategoriesArray) {
        // Check for duplicate subcategory name
        const existingSubcategory = await Category.findOne({ categoryName: sub.categoryName });
        if (existingSubcategory) {
          throw new Error(`Subcategory name "${sub.categoryName}" already exists`);
        }
        // Create subcategory
        const newSubcategory = new Category({
          categoryName: sub.categoryName,
          description: sub.description,
          level: level,
          categoryType: level === 1 ? "subcategory" : "sub-subcategory",
          parentCategory: parentCategory._id,
          ancestryPath: [...parentCategory.ancestryPath, parentCategory._id],
          subcategories: []
        });
        const savedSubcategory = await newSubcategory.save();
        // Update parent's subcategories array
        await Category.findByIdAndUpdate(
          parentCategory._id,
          { $push: { subcategories: savedSubcategory._id } }
        );
        // Process nested subcategories if they exist
        if (sub.subcategories && Array.isArray(sub.subcategories) && sub.subcategories.length > 0) {
          await processSubcategories(savedSubcategory, sub.subcategories, level + 1);
        }
      }
    };

    for (const cat of categories) {
      try {
        // Check for duplicate parent category name
        const existingCategory = await Category.findOne({ categoryName: cat.categoryName });
        if (existingCategory) {
          errors.push({ categoryName: cat.categoryName, error: 'Category name already exists' });
          continue;
        }
        // Create parent category
        const newCategory = new Category({
          categoryName: cat.categoryName,
          description: cat.description,
          level: 0,
          categoryType: "parentcategory",
          parentCategory: null,
          ancestryPath: [],
          subcategories: []
        });
        const savedCategory = await newCategory.save();
        // Process subcategories if any
        if (cat.subcategories && Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
          await processSubcategories(savedCategory, cat.subcategories, 1);
        }
        // Fetch the complete category with populated subcategories
        const populatedCategory = await Category.findById(savedCategory._id)
          .populate({
            path: 'subcategories',
            match: { isActive: true },
            populate: {
              path: 'subcategories',
              match: { isActive: true }
            }
          });
        results.push(populatedCategory);
      } catch (err) {
        errors.push({ categoryName: cat.categoryName, error: err.message });
      }
    }
    return ResponseHandler.success(res, { created: results, errors }, API_RESPONSES.SUCCESS.CATEGORY.CREATED, 201);
  } catch (error) {
    console.error("Error in createBulkCategories:", error);
    return ResponseHandler.error(res, error, API_RESPONSES.ERROR.CATEGORY.CREATE_FAILED);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getAllParentCategories, 
  getCategoryById,
  dropdownCategories,
  updateCategory,
  deleteCategory,
  addSubcategories,
  addSubSubcategories,
  getSubcategories,
  getSubSubcategories,
  updateSubcategory,
  deleteSubcategory,
  updateSubSubcategory,
  deleteSubSubcategory,
  createBulkCategories
};
