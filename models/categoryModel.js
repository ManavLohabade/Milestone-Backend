const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryName: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: [2, "Category name must be at least 2 characters long"],
    maxlength: [50, "Category name cannot exceed 50 characters"]
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  productCount: { 
    type: Number, 
    default: 0,
    min: [0, "Product count cannot be negative"]
  },
  level: {
    type: Number,
    default: 0,
    min: [0, "Level cannot be negative"],
    max: [2, "Maximum category depth is 3 levels"]
  },
  categoryType: {
    type: String,
    enum: ["parentcategory", "subcategory", "sub-subcategory"],
    default: "parentcategory"
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }],
  ancestryPath: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ level: 1 });

module.exports = mongoose.model("Category", categorySchema);

