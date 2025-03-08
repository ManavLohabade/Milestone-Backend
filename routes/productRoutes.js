const express = require("express");
const multer = require("multer");
const router = express.Router();
const productController = require("../controllers/productController");
const { validateProduct } = require("../middlewares/productValidations");
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and GIF files are allowed"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit size to 5MB
});

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, validateProduct, productController.createProduct);
router.put("/:id", upload.single("image"), validateProduct, productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
