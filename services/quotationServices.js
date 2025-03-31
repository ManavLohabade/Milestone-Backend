const Quotation = require("../../../../models/quotationModel");
const { formatMonetaryValue } = require("../validations/quotationValidations");

/**
 * Formats a quotation for API response
 * @param {Object} quotation - Quotation document
 * @param {boolean} detailed - Whether to return detailed information
 * @returns {Object} Formatted quotation
 */
const formatQuotation = (quotation, detailed = false) => {
  const baseFormat = {
    _id: quotation._id,
    customerName: quotation.customerName,
    quotationNumber: quotation.quotationNumber,
    date: quotation.date.toISOString(),
    paymentReceived: formatMonetaryValue(quotation.paymentReceived),
    grandTotal: formatMonetaryValue(quotation.grandTotal),
    status: quotation.status
  };

  if (!detailed) return baseFormat;

  return {
    ...baseFormat,
    items: quotation.items.map(item => ({
      productName: item.productName,
      quantity: Number(item.quantity),
      unit: item.unit,
      price: formatMonetaryValue(item.price),
      total: formatMonetaryValue(item.total)
    })),
    subTotal: formatMonetaryValue(quotation.subTotal),
    tax: formatMonetaryValue(quotation.tax),
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString()
  };
};

/**
 * Service methods for quotation operations
 */
const quotationService = {
  /**
   * Get all quotations
   * @returns {Promise<Array>} Array of formatted quotations
   */
  getAllQuotations: async () => {
    const quotations = await Quotation.find()
      .sort({ date: -1 })
      .select('customerName quotationNumber date paymentReceived grandTotal status');
    
    return quotations.map(quotation => formatQuotation(quotation));
  },

  /**
   * Get quotation by ID
   * @param {string} id - Quotation ID
   * @returns {Promise<Object>} Formatted quotation with details
   */
  getQuotationById: async (id) => {
    const quotation = await Quotation.findById(id);
    if (!quotation) return null;
    return formatQuotation(quotation, true);
  },

  /**
   * Create new quotation
   * @param {Object} quotationData - Quotation data
   * @returns {Promise<Object>} Created quotation
   */
  createQuotation: async (quotationData) => {
    const { customerName, items, tax = 0, paymentReceived = 0 } = quotationData;

    const calculatedItems = items.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));

    const newQuotation = new Quotation({
      customerName,
      items: calculatedItems,
      tax,
      paymentReceived,
      status: 'Pending'
    });

    const savedQuotation = await newQuotation.save();
    return formatQuotation(savedQuotation, true);
  },

  /**
   * Update quotation status
   * @param {string} id - Quotation ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated quotation
   */
  updateQuotationStatus: async (id, status) => {
    const quotation = await Quotation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!quotation) return null;
    return formatQuotation(quotation, true);
  },

  /**
   * Update entire quotation
   * @param {string} id - Quotation ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated quotation
   */
  updateQuotation: async (id, updateData) => {
    const { customerName, items, tax, paymentReceived, status } = updateData;

    const updateObj = {
      customerName,
      tax,
      paymentReceived,
      status
    };

    if (items) {
      updateObj.items = items.map(item => ({
        ...item,
        total: item.quantity * item.price
      }));
    }

    const updatedQuotation = await Quotation.findByIdAndUpdate(
      id,
      updateObj,
      { new: true, runValidators: true }
    );

    if (!updatedQuotation) return null;
    return formatQuotation(updatedQuotation, true);
  },

  /**
   * Delete quotation
   * @param {string} id - Quotation ID
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  deleteQuotation: async (id) => {
    const result = await Quotation.findByIdAndDelete(id);
    return !!result;
  }
};

module.exports = quotationService; 