const { body, validationResult } = require("express-validator");

const validateProduct = [
  (req, res, next) => {
    console.log('VALIDATE PRODUCT MIDDLEWARE CALLED');
    console.log('DEBUG (validation): req.body:', req.body);
    console.log('DEBUG (validation): req.files:', req.files);
    if (req.body.data) {
      try {
        const parsedData = JSON.parse(req.body.data);
        req.body = { ...req.body, ...parsedData };
      } catch (error) {
        return res.status(400).json({ 
          message: "Invalid JSON data", 
          error: error.message 
        });
      }
    }
    next();
  },

  body("productName")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),

  body("code")
    .trim()
    .notEmpty()
    .withMessage("Product code is required")
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage("Product code can only contain letters, numbers, and hyphens"),

  body("category").custom((value) => {
    const mongoose = require('mongoose');
    if (!value || typeof value !== 'object' || !value.mainCategory) {
      throw new Error("Category with mainCategory is required");
    }
    if (!mongoose.Types.ObjectId.isValid(value.mainCategory)) {
      throw new Error("mainCategory must be a valid ObjectId");
    }
    if (value.subCategory && !mongoose.Types.ObjectId.isValid(value.subCategory)) {
      throw new Error("subCategory must be a valid ObjectId");
    }
    if (value.subSubCategory && !mongoose.Types.ObjectId.isValid(value.subSubCategory)) {
      throw new Error("subSubCategory must be a valid ObjectId");
    }
    return true;
  }),

  body("price")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be greater than 0"),

  body("quantity")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a positive integer"),

  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Unit must be between 1 and 20 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  (req, res, next) => {
    if (
      req.method === "POST" &&
      (!req.files || !req.files.productImage || !req.files.productImage.length)
    ) {
      return res.status(400).json({ message: "Product image is required for new products" });
    }
    next();
  },

  (req, res, next) => {
    if (req.files) {
      const maxGallerySize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

      // Iterate over each field in req.files (e.g., productImage, productGallery)
      for (const field in req.files) {
        const filesArray = req.files[field];
        for (const file of filesArray) {
          if (file.size > maxGallerySize) {
            return res.status(400).json({ message: "Gallery image size must be less than 5MB" });
          }
          if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ 
              message: "Invalid gallery image type. Allowed types: jpeg, png, jpg, webp" 
            });
          }
        }
      }
    }
    next();
  },

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('VALIDATION ERRORS:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    console.log('END OF VALIDATION MIDDLEWARE');
    next();
  },
];

function parseProductData(req, res, next) {
  if (req.body.data) {
    try {
      const parsedData = JSON.parse(req.body.data);
      req.body = { ...req.body, ...parsedData };
    } catch (error) {
      return res.status(400).json({
        message: "Invalid JSON data",
        error: error.message
      });
    }
  }
  next();
}

module.exports = { validateProduct, parseProductData };