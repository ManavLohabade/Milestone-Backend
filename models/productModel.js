const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    description: { type: String },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);