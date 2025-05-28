const express = require("express");
const router = express.Router();
const { 
  getAllProducts, 
  getProductById, 
  getProductGallery, 
  createProduct, 
  updateProduct, 
  deleteProduct
} = require("../controllers/productController");
const { 
  uploadProductImages, 
  handleImageUploadError,
  validateFile 
} = require("../helpers/upload");
const { validateProduct, parseProductData } = require("../middlewares/productValidations");
const Product = require('../models/productModel');

// Get all products with pagination and search
router.get("/", getAllProducts);

// Get product by ID
router.get("/:id", getProductById);

// Get product gallery
router.get("/:id/gallery", getProductGallery);

// Create new product
router.post("/", uploadProductImages, handleImageUploadError, parseProductData, validateProduct, createProduct);

// Update product
router.put("/:id", uploadProductImages, handleImageUploadError, updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

// Add image to product gallery
router.post('/:id/gallery', uploadProductImages, handleImageUploadError, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!req.files || !req.files.productGallery) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const newImages = req.files.productGallery.map(file => file.filename);
    
    // Add new images to the existing gallery
    if (!product.gallery) {
      product.gallery = [];
    }
    product.gallery.push(...newImages);
    
    await product.save();
    
    res.status(200).json({
      message: 'Images uploaded successfully',
      gallery: product.gallery
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Error uploading images', error: error.message });
  }
});

// Get product gallery
router.get('/:id/gallery', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json({
      gallery: product.gallery || []
    });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ message: 'Error fetching gallery', error: error.message });
  }
});

// Delete image from gallery
router.delete('/:id/gallery/:imageIndex', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (!product.gallery || imageIndex >= product.gallery.length || imageIndex < 0) {
      return res.status(400).json({ message: 'Invalid image index' });
    }

    // Get the filename to delete
    const imageToDelete = product.gallery[imageIndex];
    
    // Remove from gallery array
    product.gallery.splice(imageIndex, 1);
    await product.save();

    // Delete the actual file
    deleteImageFile(imageToDelete);

    res.status(200).json({
      message: 'Image deleted successfully',
      gallery: product.gallery
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
});

module.exports = router;