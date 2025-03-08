const mongoose = require("mongoose");
const Category = require("../models/categoryModel");

// Get all categories
// GET /api/categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error });
  }
};

// Get category by ID
// GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error fetching category", error });
  }
};

// Get Category Dropdown by Id and Name
// GET /api/categories/dropdown
const dropdownCategories = async (req , res) => {
  try {
    const categories = await Category.find().select('categoryName');
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories", error });
  }
}

// Create a new category
// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new Category({
      categoryName,
      description,
      productCount: 0, // Initially zero
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ message: "Error creating category", error });
  }
};


// Update a category by Id
// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Error updating category", error });
  }
};

// Delete a category by ID
// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const productsInCategory = await Product.find({ category: req.params.id });

    if (productsInCategory.length > 0) {
      return res.status(400).json({
        message: "Cannot delete category with existing products.",
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error });
  }
};


module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  dropdownCategories,
  updateCategory,
  deleteCategory,
};
