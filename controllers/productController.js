const mongoose = require("mongoose");
const Product = require("../models/productModel");

// Get all products
// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
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
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error fetching product", error });
  }
};

// Create a new product
// POST /api/products
const createProduct = async (req, res) => {
  try {
    console.log("Received Body:", req.body); 
    console.log("Received File:", req.file);
    const { productName, code, category, price, quantity, unit, description } = req.body;

    if (!productName || !code || !category || !price || !quantity || !unit) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }
    const imageUrl = `uploads/${req.file.filename}`;
    // const imageUrl = req.file.buffer.toString("base64"); 

    const newProduct = new Product({
      productName,
      code,
      category,
      price,
      quantity,
      unit,
      description,
      imageUrl,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Error creating product", error });
  }
};

// Delete a product by ID
// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
};

// Update a product by ID
// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
