const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Constants
const UPLOAD_DIR = 'uploads/products/';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9]/g, '');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = ALLOWED_TYPES[file.mimetype];
        cb(null, `${file.fieldname}-${uniqueSuffix}-${cleanFileName}${extension}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${Object.keys(ALLOWED_TYPES).join(', ')}`), false);
    }
};

// Create multer upload instance for product images
const uploadProductImages = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
}).fields([
    { name: 'productImage', maxCount: 1 },
    { name: 'productGallery', maxCount: 10 }
]);

// Error handler for multer
const handleImageUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    message: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    message: 'Unexpected field name. Please use productImage for main image and productGallery for gallery images.'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    message: 'Too many gallery images. Maximum 10 images allowed.'
                });
            default:
                return res.status(400).json({
                    message: 'Error uploading file.',
                    error: err.message
                });
        }
    }
    if (err) return res.status(400).json({ message: err.message });
    next();
};

// Helper functions for image management
const deleteImageFile = (filename) => {
    if (!filename || filename === 'default.png') return;

    const fullPath = path.join(UPLOAD_DIR, filename);
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted: ${filename}`);
        }
    } catch (err) {
        console.error(`Delete error for file ${filename}:`, err);
    }
};

const deleteMultipleImageFiles = (filenames) => {
    if (!filenames || !Array.isArray(filenames)) return;
    
    filenames.forEach(filename => {
        deleteImageFile(filename);
    });
};

const getImageUrl = (filename) => {
    return filename ? `/uploads/products/${filename}` : null;
};

const getMultipleImageUrls = (filenames) => {
    if (!filenames || !Array.isArray(filenames)) return [];
    return filenames.map(filename => getImageUrl(filename));
};

const validateFile = (file) => {
    if (!file) throw new Error('No file uploaded');
    if (!ALLOWED_TYPES[file.mimetype]) {
        throw new Error(`Invalid file type. Allowed types: ${Object.keys(ALLOWED_TYPES).join(', ')}`);
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Max size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    return true;
};

module.exports = {
    uploadProductImages,
    handleImageUploadError,
    deleteImageFile,
    deleteMultipleImageFiles,
    getImageUrl,
    getMultipleImageUrls,
    validateFile
}; 