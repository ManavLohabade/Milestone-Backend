const API_RESPONSES = {
    // Success Messages
    SUCCESS: {
        CATEGORY: {
            CREATED: "Category created successfully",
            UPDATED: "Category updated successfully",
            DELETED: "Category deleted successfully",
            FETCHED: "Categories fetched successfully",
            PARENT_FETCHED: "Parent categories fetched successfully",
            SUB_FETCHED: "Subcategories fetched successfully",
            SUB_SUB_FETCHED: "Sub-subcategories fetched successfully"
        }
    },

    // Error Messages
    ERROR: {
        CATEGORY: {
            NOT_FOUND: "Category not found",
            ALREADY_EXISTS: "Category with this name already exists",
            INVALID_ID: "Invalid category ID",
            CREATE_FAILED: "Failed to create category",
            UPDATE_FAILED: "Failed to update category",
            DELETE_FAILED: "Failed to delete category",
            FETCH_FAILED: "Failed to fetch categories",
            MAX_LEVEL: "Maximum category nesting level exceeded",
            HAS_PRODUCTS: "Cannot delete category with products",
            HAS_SUBCATEGORIES: "Cannot delete category with subcategories",
            INVALID_PARENT: "Invalid parent category",
            CIRCULAR_REF: "Circular reference detected in category hierarchy"
        },
        GENERAL: {
            UNAUTHORIZED: "Unauthorized access",
            SERVER_ERROR: "Internal server error",
            INVALID_REQUEST: "Invalid request",
            VALIDATION_ERROR: "Validation error"
        }
    }
};

const MESSAGES = {
    VALIDATION: {
        REQUIRED: (field) => `${field} is required`,
        MIN_LENGTH: (field, min) => `${field} must be at least ${min} characters`,
        MAX_LENGTH: (field, max) => `${field} cannot exceed ${max} characters`,
        INVALID_FORMAT: (field) => `Invalid ${field} format`,
        INVALID_VALUE: (field) => `Invalid ${field}`
    },
    CATEGORY: {
        LEVELS: {
            PARENT: "parentcategory",
            SUB: "subcategory",
            SUB_SUB: "sub-subcategory"
        },
        MAX_DEPTH: 3,
        NAME_MIN_LENGTH: 2,
        NAME_MAX_LENGTH: 50,
        DESC_MAX_LENGTH: 500
    }
};

module.exports = { ...API_RESPONSES, ...MESSAGES };
