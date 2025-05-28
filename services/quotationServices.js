const Quotation = require('../models/quotationModel');
const Client = require('../models/clientModel');
const Product = require('../models/productModel');
/**
 * Service methods for quotation operations
 */
class QuotationService {
  /**
   * Create initial quotation with basic details
   */
  async createInitialQuotation(quotationData) {
    
    const initialQuotation = new Quotation({
      quotationName: quotationData.quotationName,
      clientName: quotationData.clientName,
      subject: quotationData.subject,
      date: quotationData.date || new Date(),
      items: [], // Empty items array initially
      status: 'Draft',
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      transactions: [], // Initialize transactions array
      runningBalance: 0 // Initialize running balance
    });

    await initialQuotation.save();
    return initialQuotation;
  }

  /**
   * Add products to quotation
   */
  async addProductsToQuotation(quotationId, products) {
    const quotation = await Quotation.findById(quotationId);
    if (!quotation || quotation.isDeleted) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'Draft') {
      throw new Error('Can only add products to Draft quotations');
    }

    // Validate and process product details
    const productDetails = products.map(item => ({
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      category: item.category,
      code: item.code,
      unit: item.unit
    }));

    // Update quotation with products
    quotation.items = productDetails;
    
    // The pre-save hook will calculate subtotal, tax, and total

    await quotation.save();
    return quotation;
  }

  /**
   * Add financial details to quotation
   */
  async addFinancialDetails(quotationId, financialDetails) {
    const quotation = await Quotation.findById(quotationId);
    if (!quotation || quotation.isDeleted) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'Draft') {
      throw new Error('Can only add financial details to Draft quotations');
    }

    // Update financial details
    quotation.cgst = financialDetails.cgst || 0;
    quotation.sgst = financialDetails.sgst || 0;
    quotation.otherTax = financialDetails.otherTax || 0;
    quotation.discount = financialDetails.discount || 0;

    // The pre-save hook will calculate tax and total

    await quotation.save();
    return quotation;
  }

  /**
   * Finalize and save complete quotation
   */
  async finalizeQuotation(quotationId) {
    const quotation = await Quotation.findById(quotationId);
    if (!quotation || quotation.isDeleted) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'Draft') {
      throw new Error('Can only finalize Draft quotations');
    }

    // Validate required fields (items and total are checked in pre-save hook now)
    if (!quotation.items || quotation.items.length === 0) {
      throw new Error('Quotation must have at least one product');
    }
    if (quotation.total <= 0) {
      throw new Error('Quotation total must be greater than zero');
    }

    // Update status to Sent
    quotation.status = 'Sent';

    // Add an initial transaction entry for the total amount
    quotation.transactions.push({
        type: 'credit',
        amount: quotation.total,
        note: 'Initial quotation total',
        balanceAfter: quotation.total
    });
    quotation.runningBalance = quotation.total; // Set running balance to total initially

    await quotation.save();

    return quotation;
  }

  /**
   * Create a complete quotation with all details
   */
  async createQuotation(quotationData) {
    try {
      
      // Validate required fields
      if (!quotationData.items || quotationData.items.length === 0) {
        throw new Error('At least one product is required');
      }

      // Process each product
      const productDetails = quotationData.items.map(item => ({
        productName: item.productName,
        description: item.description,
            quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        category: item.category,
        code: item.code,
        unit: item.unit
      }));

      // Calculate financial details (pre-save hook will do this on save)

      // Create quotation with all details
      const quotation = new Quotation({
        quotationName: quotationData.quotationName,
        clientName: quotationData.clientName,
        subject: quotationData.subject,
        date: quotationData.date || new Date(),
        items: productDetails,
        cgst: quotationData.cgst || 0,
        sgst: quotationData.sgst || 0,
        otherTax: quotationData.otherTax || 0,
        discount: quotationData.discount || 0,
        termsAndConditions: quotationData.termsAndConditions,
        status: 'Draft',
        createdBy: quotationData.createdBy,
        transactions: [], // Initialize transactions array
        runningBalance: 0 // Initialize running balance
      });

      await quotation.save();

      // Add an initial transaction entry for the total amount after saving
       quotation.transactions.push({
          type: 'credit',
           amount: quotation.total,
           note: 'Initial quotation total',
           balanceAfter: quotation.total // Use the calculated total
       });
       quotation.runningBalance = quotation.total; // Set running balance

       await quotation.save(); // Save again to include transaction

      return quotation;
    } catch (error) {
      throw new Error(`Error creating quotation: ${error.message}`);
    }
  }

  /**
   * Get single quotation by ID
   */
  async getQuotationById(id) {
    const quotation = await Quotation.findById(id);
    
    if (!quotation || quotation.isDeleted) {
      throw new Error('Quotation not found');
    }

    return quotation;
  }

  /**
   * Update quotation
   */
  async updateQuotation(id, updateData) {
    const quotation = await Quotation.findById(id);
    if (!quotation || quotation.isDeleted) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'Draft' && quotation.status !== 'Sent') {
      throw new Error('Only Draft or Sent quotations can be updated');
    }

    // Apply updates
    Object.assign(quotation, updateData);

    // Re-calculate totals and potentially update initial transaction if items/financials changed
    // The pre-save hook handles recalculating totals.
    // We might need specific logic here if changes affect the initial transaction entry.

    await quotation.save();
    return quotation;
  }

  /**
   * Delete quotation (soft delete)
   */
  async deleteQuotation(id) {
    const quotation = await Quotation.findById(id);
    if (!quotation || quotation.isDeleted) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'Draft' && quotation.status !== 'Rejected') {
      throw new Error('Only Draft or Rejected quotations can be deleted');
    }

    quotation.isDeleted = true;
    await quotation.save();
    return quotation;
  }

  /**
   * Approve quotation
   */
  async approveQuotation(id, approvedBy) { // Note: approvedBy was in original validation, but not model
    const quotation = await Quotation.findById(id);
    if (!quotation || quotation.isDeleted) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'Sent') {
      throw new Error('Only Sent quotations can be approved');
    }

    quotation.status = 'Approved';
    // How to record who approved? Add to transactions or a separate field?

    await quotation.save();
    return quotation;
  }

  /**
   * Add payment to quotation
   */
  async addPayment(quotationId, paymentData) {
    const quotation = await Quotation.findById(quotationId);
    if (!quotation || quotation.isDeleted) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'Sent' && quotation.status !== 'Approved') {
         throw new Error('Payments can only be added to Sent or Approved quotations');
    }

    const totalPayments = quotation.payments.reduce((sum, p) => sum + p.amountReceived, 0);
    const newTotalReceived = totalPayments + paymentData.amountReceived;

    // Check if total payments exceed quotation total
    if (newTotalReceived > quotation.total) {
      throw new Error('Payment amount exceeds quotation total');
    }

    // Add payment to the payments array
    quotation.payments.push(paymentData);

    // Add a corresponding transaction entry
    quotation.transactions.push({
        type: 'credit',
        amount: paymentData.amountReceived,
        date: paymentData.paymentDate,
        note: paymentData.notes || 'Payment received',
        paymentMode: paymentData.paymentMethod,
        transactionId: paymentData.referenceNumber
        // balanceAfter will be calculated below
    });

    // Recalculate running balance after adding transactions
    quotation.runningBalance = this.calculateRunningBalance(quotation.transactions);

    await quotation.save();
    return quotation;
  }

  /**
   * Get quotations by filters
   */
  async getQuotationsByFilters(filters) {
    const query = { isDeleted: false };

    if (filters.status) query.status = filters.status;
    if (filters.clientName) query.clientName = { $regex: filters.clientName, $options: 'i' }; // Case-insensitive search
    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    // Add search for quotationName and subject
     if (filters.search) {
         query.$or = [
             { quotationName: { $regex: filters.search, $options: 'i' } },
             { subject: { $regex: filters.search, $options: 'i' } }
         ];
     }

    // Add pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const quotations = await Quotation.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 }); // Sort by date descending

    const totalCount = await Quotation.countDocuments(query);

    return {
        quotations,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
    };
  }

  /**
   * Get quotation with all details including transactions
   */
  async getQuotationView(id) {
    try {
      const quotation = await Quotation.findById(id);
      if (!quotation || quotation.isDeleted) {
        throw new Error('Quotation not found');
      }

      // The transactions are now embedded, so we just return the quotation object
      return quotation;
    } catch (error) {
      throw new Error(`Error fetching quotation view: ${error.message}`);
    }
  }

  /**
   * Get all unique categories from quotation items
   */
   async getAllCategories() {
       try {
           const categories = await Quotation.aggregate([
               { $unwind: "$items" },
               { $group: { _id: "$items.category" } },
               { $match: { _id: { $ne: null, $ne: '' } } }, // Exclude null or empty categories
               { $sort: { _id: 1 } }
           ]);
           return categories.map(c => c._id);
       } catch (error) {
            throw new Error(`Error fetching categories: ${error.message}`);
       }
   }

  /**
   * Get all quotations with items in a given category
   */
   async getQuotationsByCategory(category) {
       try {
           const quotations = await Quotation.find({ "items.category": category, isDeleted: false });
           return quotations;
       } catch (error) {
           throw new Error(`Error fetching quotations by category: ${error.message}`);
       }
   }

  /**
   * Get all quotations with products and financial details
   */
  async getAllQuotationsWithDetails() {
    try {
      // Since transactions are embedded, we can just fetch quotations directly
      const quotations = await Quotation.find({ isDeleted: false }).sort({ date: -1 });

      // We might need to format the output to match the previous structure if necessary
      // or update the frontend to work with the new embedded structure.

      return quotations;
    } catch (error) {
      throw new Error(`Error fetching all quotations with details: ${error.message}`);
    }
  }

  /**
   * Add a new transaction entry to quotation
   */
  async addTransactionEntry(quotationId, entryData) {
    try {
      const quotation = await Quotation.findById(quotationId);
      if (!quotation || quotation.isDeleted) {
        throw new Error('Quotation not found');
      }

      // Add the new entry to the transactions array
      quotation.transactions.push(entryData);

      // Recalculate running balance
      quotation.runningBalance = this.calculateRunningBalance(quotation.transactions);

      await quotation.save();

      return quotation.transactions[quotation.transactions.length - 1]; // Return the added entry
    } catch (error) {
      throw new Error(`Error adding transaction entry: ${error.message}`);
    }
  }

  /**
   * Helper function to calculate running balance
   */
  calculateRunningBalance(transactions) {
      let balance = 0;
      for (const entry of transactions) {
          if (entry.type === 'credit') {
              balance += entry.amount;
          } else if (entry.type === 'debit' || entry.type === 'tax' || entry.type === 'discount' || entry.type === 'adjustment') {
              balance -= entry.amount;
          }
          // Update balanceAfter for each entry (optional, can be done during insertion)
          // entry.balanceAfter = balance;
      }
      return balance;
  }
}

module.exports = QuotationService; 