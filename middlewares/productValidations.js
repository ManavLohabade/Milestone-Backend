const { body, validationResult } = require("express-validator");

const validateProduct = [
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

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),

  body("price")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number")
    .isLength({ min: 1, max: 10 })
    .withMessage("Price must be between 1 and 10 digits"),

  body("quantity")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be a positive integer")
    .isLength({ min: 1, max: 10 })
    .withMessage("Quantity must be between 1 and 10 digits"),

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
    .withMessage("Description cannot exceed 500 characters"),

  // Custom validation for image
  (req, res, next) => {
    if (!req.file && req.method === 'POST') {
      return res.status(400).json({ message: "Image is required for new products" });
    }
    
    if (req.file) {
      // Check file size (5MB limit)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Image size must be less than 5MB" });
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          message: "Invalid file type. Only JPEG, PNG, JPG and WEBP are allowed" 
        });
      }
    }
    
    next();
  },

  // Check for validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateProduct };
