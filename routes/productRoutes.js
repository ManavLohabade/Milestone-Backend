const express = require("express");
const multer = require("multer");
const Product = require("../models/Product");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { productName, category, price, quantity, unit, description } = req.body;
    const code = `PROD${Math.floor(1000 + Math.random() * 9000)}`;

    const newProduct = new Product({
      productName,
      code,
      category,
      price,
      quantity,
      unit,
      description,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
    });

    await newProduct.save();
    res.json({ success: true, message: "Product added successfully", product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get All Products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
