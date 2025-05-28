const { HTTP_STATUS } = require('../constants/httpStatus');
const { API_RESPONSES } = require('../constants/apiResponses');

const ResponseHandler = {
    success: (res, data, message = 'Success', statusCode = 200) => {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    },

    error: (res, error, statusCode = 500) => {
        const message = error.message || error;
        return res.status(statusCode).json({
            success: false,
            message
        });
    },

    badRequest: (res, message) => {
        return res.status(400).json({
            success: false,
            message: typeof message === 'object' ? message.message : message
        });
    },

    notFound: (res, message = 'Resource not found') => {
        return res.status(404).json({
            success: false,
            message
        });
    },

    unauthorized: (res, message = 'Unauthorized access') => {
        return res.status(401).json({
            success: false,
            message
        });
    },

    validationError: (res, error) => {
        return this.error(res, error, 422);
    }
};

module.exports = ResponseHandler; 