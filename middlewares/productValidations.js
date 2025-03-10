const { body, validationResult } = require("express-validator");

const validateProduct = [
  body("productName").notEmpty().withMessage("Product name is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("price")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number"),
  body("quantity")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be a positive integer"),
  body("unit").notEmpty().withMessage("Unit is required"),
  body("code")
    .isInt({ gt: 0 })
    .withMessage("Product code must be a positive integer"),
  body("imageUrl")
    .optional()
    .isString()
    .withMessage("Image URL must be a string"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateProduct };
