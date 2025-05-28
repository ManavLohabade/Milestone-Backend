const mongoose = require("mongoose");
const Product = require("../models/productModel");
const ResponseHandler = require("../utils/responseHandler");
const { API_RESPONSES } = require("../constants/apiResponses");
const { deleteImageFile, deleteMultipleImageFiles } = require("../helpers/upload");

// Helper function for error handling
const handleError = (res, error, message = "Internal server error") => {
  console.error(`Error: ${message}`, error);
  const status = error.code === 11000 ? 400 : 500;
  const errorMessage = error.code === 11000 ? API_RESPONSES.ERROR.PRODUCT.ALREADY_EXISTS : message;
  
  return ResponseHandler.error(res, { message: errorMessage }, status);
};

/**
 * Get all products
 * GET /api/products
 */
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const query = { isActive: true };

    // Add search functionality
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .populate('category.mainCategory', 'categoryName')
      .populate('category.subCategory', 'categoryName')
      .populate('category.subSubCategory', 'categoryName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments(query);

    return ResponseHandler.success(
      res,
      {
        products,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalProducts: count
      },
      API_RESPONSES.SUCCESS.PRODUCT.FETCHED
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return ResponseHandler.error(
      res,
      error,
      API_RESPONSES.ERROR.PRODUCT.FETCH_FAILED
    );
  }
};

/**
 * Get a single product by ID
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.PRODUCT.INVALID_ID);
    }

    const product = await Product.findById(id).populate('category', 'categoryName');

    if (!product) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.PRODUCT.NOT_FOUND);
    }

    return ResponseHandler.success(
      res,
      product,
      API_RESPONSES.SUCCESS.PRODUCT.SINGLE_FETCHED
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return ResponseHandler.error(
      res,
      error,
      API_RESPONSES.ERROR.PRODUCT.FETCH_FAILED
    );
  }
};

/**
 * Get product gallery
 * GET /api/products/:id/gallery
 */
const getProductGallery = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.PRODUCT.INVALID_ID);
    }

    const product = await Product.findById(id);
    if (!product) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.PRODUCT.NOT_FOUND);
    }

    // Prepare gallery data
    const galleryData = {
      mainImage: product.productImage,
      gallery: product.productGallery || []
    };

    return ResponseHandler.success(
      res,
      galleryData,
      API_RESPONSES.SUCCESS.PRODUCT.FETCHED
    );
  } catch (error) {
    console.error("Error fetching product gallery:", error);
    return ResponseHandler.error(
      res,
      error,
      API_RESPONSES.ERROR.PRODUCT.FETCH_FAILED
    );
  }
};

/**
 * Create a new product
 * POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    console.log('CREATE PRODUCT CONTROLLER CALLED');
    console.log('DEBUG: req.files:', req.files);
    console.log('DEBUG: req.body:', req.body);
    const productData = req.body;

    console.log('STEP 1: Parsed productData:', productData);

    // Validate required fields
    if (!productData.productName || !productData.code) {
      console.log('STEP 2: Missing required fields');
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.PRODUCT.REQUIRED_FIELDS);
    }

    // Validate main category
    if (!productData.category?.mainCategory) {
      console.log('STEP 3: Missing mainCategory');
      return ResponseHandler.badRequest(res, "Main category is required");
    }

    // Check for duplicate product code
    const existingProduct = await Product.findOne({ code: productData.code });
    console.log('STEP 4: Duplicate check result:', existingProduct);
    if (existingProduct) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.PRODUCT.ALREADY_EXISTS);
    }

    // Handle file uploads
    if (req.files) {
      // Handle main product image
      if (req.files.productImage && req.files.productImage[0]) {
        productData.productImage = req.files.productImage[0].filename;
        console.log('STEP 5: productImage filename set:', productData.productImage);
      } else {
        console.log('STEP 5: Missing productImage');
        return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.PRODUCT.IMAGE_REQUIRED);
      }

      // Handle gallery images
      if (req.files.productGallery) {
        productData.productGallery = req.files.productGallery.map(file => file.filename);
        console.log('STEP 6: productGallery filenames set:', productData.productGallery);
      }
    } else {
      console.log('STEP 5: req.files missing');
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.PRODUCT.IMAGE_REQUIRED);
    }

    // Ensure isActive is set to true by default
    productData.isActive = true;

    console.log('STEP 7: Creating new Product instance');
    const newProduct = new Product(productData);
    console.log('STEP 8: Saving new Product');
    const savedProduct = await newProduct.save();
    console.log('STEP 9: Product saved:', savedProduct._id);

    // Populate category names
    const populatedProduct = await Product.findById(savedProduct._id)
      .populate('category.mainCategory', 'categoryName')
      .populate('category.subCategory', 'categoryName')
      .populate('category.subSubCategory', 'categoryName');
    console.log('STEP 10: Populated product:', populatedProduct);

    return ResponseHandler.success(
      res,
      populatedProduct,
      API_RESPONSES.SUCCESS.PRODUCT.CREATED,
      201
    );
  } catch (error) {
    // If there's an error, delete any uploaded files
    if (req.files) {
      if (req.files.productImage && req.files.productImage[0]) {
        await deleteImageFile(req.files.productImage[0].filename);
      }
      if (req.files.productGallery) {
        await deleteMultipleImageFiles(req.files.productGallery.map(file => file.filename));
      }
    }
    console.error("Error creating product:", error);
    console.error("Error stack:", error.stack);
    return ResponseHandler.error(
      res,
      error,
      API_RESPONSES.ERROR.PRODUCT.CREATE_FAILED
    );
  }
};

/**
 * Update a product
 * PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.PRODUCT.INVALID_ID);
    }

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.PRODUCT.NOT_FOUND);
    }

    // Check for duplicate code if code is being updated
    if (updateData.code && updateData.code !== existingProduct.code) {
      const duplicateProduct = await Product.findOne({ code: updateData.code });
      if (duplicateProduct) {
        return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.PRODUCT.ALREADY_EXISTS);
      }
    }

    // Handle file uploads
    if (req.files) {
      // Handle main product image update
      if (req.files.productImage && req.files.productImage[0]) {
        // Delete old image
        if (existingProduct.productImage) {
          await deleteImageFile(existingProduct.productImage);
        }
        updateData.productImage = req.files.productImage[0].filename;
      }

      // Handle gallery images update
      if (req.files.productGallery) {
        // Delete old gallery images
        if (existingProduct.productGallery && existingProduct.productGallery.length > 0) {
          await deleteMultipleImageFiles(existingProduct.productGallery);
        }
        updateData.productGallery = req.files.productGallery.map(file => file.filename);
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('category', 'categoryName');

    return ResponseHandler.success(
      res,
      updatedProduct,
      API_RESPONSES.SUCCESS.PRODUCT.UPDATED
    );
  } catch (error) {
    // If there's an error, delete any newly uploaded files
    if (req.files) {
      if (req.files.productImage && req.files.productImage[0]) {
        await deleteImageFile(req.files.productImage[0].filename);
      }
      if (req.files.productGallery) {
        await deleteMultipleImageFiles(req.files.productGallery.map(file => file.filename));
      }
    }
    console.error("Error updating product:", error);
    return ResponseHandler.error(
      res,
      error,
      API_RESPONSES.ERROR.PRODUCT.UPDATE_FAILED
    );
  }
};

/**
 * Delete a product
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, API_RESPONSES.ERROR.PRODUCT.INVALID_ID);
    }

    const product = await Product.findById(id);
    if (!product) {
      return ResponseHandler.notFound(res, API_RESPONSES.ERROR.PRODUCT.NOT_FOUND);
    }

    // Delete all associated images
    if (product.productImage) {
      await deleteImageFile(product.productImage);
    }
    if (product.productGallery && product.productGallery.length > 0) {
      await deleteMultipleImageFiles(product.productGallery);
    }

    await Product.findByIdAndDelete(id);

    return ResponseHandler.success(
      res,
      null,
      API_RESPONSES.SUCCESS.PRODUCT.DELETED
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return ResponseHandler.error(
      res,
      error,
      API_RESPONSES.ERROR.PRODUCT.DELETE_FAILED
    );
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductGallery,
  createProduct,
  updateProduct,
  deleteProduct
};