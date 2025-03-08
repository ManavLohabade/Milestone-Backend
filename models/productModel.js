const mongoose = require("mongoose");
const validator = require("validator");
const Product = require("./productModel");

const ProductSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, "Product name is required"],
  },
  code: {
    type: String,
    required: [true, "Product code is required"],
    unique: true,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price must be a positive number"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0, "Quantity must be a positive number"],
  },
  unit: {
    type: String,
    required: [true, "Unit is required"],
  },
  description: {
    type: String,
    default: "No description provided",
  },
  imageUrl: {
    type: String,
    default: "default.png",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", ProductSchema);
