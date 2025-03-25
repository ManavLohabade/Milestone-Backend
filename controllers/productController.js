const mongoose = require("mongoose");
const Product = require("../models/productModel");
const { deleteImageFile } = require("../helpers/imageUpload");

// Get all products
// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();    
    const productsWithUrls = products.map(product => ({
      ...product.toObject(),
      image: product.image ? `/uploads/${product.image}` : null
    }));
    res.json(productsWithUrls);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ 
      message: "Failed to fetch products", 
      error: error.message 
    });
  }
};

// Get product by ID
// GET /api/products/:id
const getProductById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const productWithUrl = {
      ...product.toObject(),
      image: product.image ? `/uploads/${product.image}` : null
    };
    res.status(200).json(productWithUrl);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ 
      message: "Error fetching product", 
      error: error.message 
    });
  }
};

// Create a new product
// POST /api/products
const createProduct = async (req, res) => {
  try {
    const { productName, code, category, price, quantity, unit, description } = req.body;

    // Check for duplicate product code
    const existingProduct = await Product.findOne({ code });
    if (existingProduct) {
      return res.status(400).json({ message: "Product code already exists" });
    }

    if (!productName || !code || !category || !price || !quantity || !unit) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const imageUrl = `uploads/${req.file.filename}`;

    const newProduct = new Product({
      productName,
      code,
      category,
      price,
      quantity,
      unit,
      description,
      image: req.file ? req.file.filename : null,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    // If there's an error, delete the uploaded file
    if (req.file) {
      deleteImageFile(`uploads/${req.file.filename}`);
    }
    res.status(500).json({ 
      message: "Error creating product", 
      error: error.message 
    });
  }
};

// Delete a product by ID
// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete the image file
    deleteImageFile(product.imageUrl);
    
    // Delete the product from database
    await Product.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ 
      message: "Error deleting product", 
      error: error.message 
    });
  }
};

// Update a product by ID
// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check for duplicate product code if code is being updated
    if (req.body.code && req.body.code !== product.code) {
      const existingProduct = await Product.findOne({ code: req.body.code });
      if (existingProduct) {
        return res.status(400).json({ message: "Product code already exists" });
      }
    }

    // If new image is uploaded, delete the old one
    if (req.file) {
      deleteImageFile(product.imageUrl);
      req.body.imageUrl = `uploads/${req.file.filename}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    // If there's an error and a new file was uploaded, delete it
    if (req.file) {
      deleteImageFile(`uploads/${req.file.filename}`);
    }
    res.status(500).json({ 
      message: "Error updating product", 
      error: error.message 
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};