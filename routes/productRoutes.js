const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { validateProduct } = require("../middlewares/productValidations");
const { upload, handleImageUploadError } = require("../helpers/imageUpload");

// Get all products
router.get("/", productController.getAllProducts);

// Get single product
router.get("/:id", productController.getProductById);

// Create new product
router.post(
  "/",
  upload.single("image"),
  handleImageUploadError,
  validateProduct,
  productController.createProduct
);

// Update product
router.put(
  "/:id",
  upload.single("image"),
  handleImageUploadError,
  validateProduct,
  productController.updateProduct
);

// Delete product
router.delete("/:id", productController.deleteProduct);

module.exports = router;
