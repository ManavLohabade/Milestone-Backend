const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Constants
const UPLOAD_DIRS = {
    products: 'uploads/products/',
    quotations: 'uploads/quotations/',
    temp: 'uploads/temp/'
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

// Create upload directories if they don't exist
Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const createStorage = (uploadDir) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9]/g, '');
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = ALLOWED_TYPES[file.mimetype];
            cb(null, `${file.fieldname}-${uniqueSuffix}-${cleanFileName}${extension}`);
        }
    });
};

const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${Object.keys(ALLOWED_TYPES).join(', ')}`), false);
    }
};

// Product image upload configuration
const uploadProductImages = multer({
    storage: createStorage(UPLOAD_DIRS.products),
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
}).fields([
    { name: 'productImage', maxCount: 1 },
    { name: 'productGallery', maxCount: 10 }
]);

// Quotation image upload configuration
const uploadQuotationImages = multer({
    storage: createStorage(UPLOAD_DIRS.quotations),
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
}).fields([
    { name: 'quotationImage', maxCount: 1 },
    { name: 'attachments', maxCount: 5 }
]);

// Error handler
const handleImageUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    message: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    message: 'Unexpected field name. Please check the field names in your form.'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    message: 'Too many files uploaded. Please check the maximum allowed files.'
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

// Helper functions
const deleteImageFile = (filename, type = 'products') => {
    if (!filename || filename === 'default.png') return;
    
    const uploadDir = UPLOAD_DIRS[type] || UPLOAD_DIRS.temp;
    const fullPath = path.join(uploadDir, filename);
    
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted: ${filename} from ${uploadDir}`);
        }
    } catch (err) {
        console.error(`Delete error for file ${filename}:`, err);
    }
};

const deleteMultipleImageFiles = (filenames, type = 'products') => {
    if (!filenames || !Array.isArray(filenames)) return;
    
    filenames.forEach(filename => {
        deleteImageFile(filename, type);
    });
};

const getImageUrl = (filename, type = 'products') => {
    if (!filename) return null;
    const uploadDir = UPLOAD_DIRS[type] || UPLOAD_DIRS.temp;
    return `/${uploadDir}${filename}`;
};

const getMultipleImageUrls = (filenames, type = 'products') => {
    if (!filenames || !Array.isArray(filenames)) return [];
    return filenames.map(filename => getImageUrl(filename, type));
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
    uploadQuotationImages,
    handleImageUploadError,
    deleteImageFile,
    deleteMultipleImageFiles,
    getImageUrl,
    getMultipleImageUrls,
    validateFile,
    UPLOAD_DIRS
}; 