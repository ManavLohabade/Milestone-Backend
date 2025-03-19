const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { validateProduct } = require("../middlewares/productValidations");
const { upload, handleImageUploadError } = require("../helpers/imageUpload");

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", upload.single("image"), handleImageUploadError, validateProduct, productController.createProduct);
router.put("/:id", upload.single("image"), handleImageUploadError, validateProduct, productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;

