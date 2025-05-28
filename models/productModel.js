const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    category: {
      mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
      subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      subSubCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
    },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    description: { type: String },
    productImage: { 
      type: String, 
      required: true,
      get: function(v) {
        return v ? `/uploads/products/${v}` : null;
      }
    },
    productGallery: [{ 
      type: String,
      get: function(v) {
        return v ? `/uploads/products/${v}` : null;
      }
    }],
    isActive: { type: Boolean, default: true },
  },
  { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

// Add indexes for better performance
productSchema.index({ productName: 'text' });
productSchema.index({ code: 1 });
productSchema.index({ 'category.mainCategory': 1 });
productSchema.index({ 'category.subCategory': 1 });
productSchema.index({ 'category.subSubCategory': 1 });

module.exports = mongoose.model("Product", productSchema);