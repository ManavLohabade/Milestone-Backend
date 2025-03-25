const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Constants
const UPLOAD_DIR = 'uploads/';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_TYPES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp and clean original name
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9]/g, '');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = ALLOWED_TYPES[file.mimetype];
        cb(null, `${file.fieldname}-${uniqueSuffix}-${cleanFileName}${extension}`);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${Object.keys(ALLOWED_TYPES).join(', ')}`), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1 // Allow only 1 file per request
    }
});

// Helper function to delete image file
const deleteImageFile = (filename) => {
    if (!filename || filename === 'default.png') return;
    
    const fullPath = path.join(UPLOAD_DIR, filename);
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Successfully deleted: ${filename}`);
        }
    } catch (error) {
        console.error(`Error deleting file ${filename}:`, error);
    }
};

// Helper function to get image URL
const getImageUrl = (filename) => {
    if (!filename) return null;
    return `/uploads/${filename}`;
};

// Validate file before upload
const validateFile = (file) => {
    if (!file) {
        throw new Error('No file uploaded');
    }
    
    if (!ALLOWED_TYPES[file.mimetype]) {
        throw new Error(`Invalid file type. Allowed types: ${Object.keys(ALLOWED_TYPES).join(', ')}`);
    }
    
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    return true;
};

// Middleware for handling image upload errors
const handleImageUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    message: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    message: 'Too many files uploaded. Only 1 file allowed.'
                });
            default:
                return res.status(400).json({
                    message: 'Error uploading file.',
                    error: err.message
                });
        }
    }
    if (err) {
        return res.status(400).json({
            message: err.message
        });
    }
    next();
};

module.exports = {
    upload,
    deleteImageFile,
    getImageUrl,
    handleImageUploadError,
    validateFile,
    ALLOWED_TYPES,
    MAX_FILE_SIZE
}; 