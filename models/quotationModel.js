const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      unique: true,
    },
    quotationName: {
      type: String,
      trim: true,
      required: true
    },
    clientName: {
      type: String,
      trim: true,
      required: true
    },
    subject: {
      type: String,
      trim: true,
      required: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Approved', 'Rejected'],
      default: 'Draft'
    },
    items: [{
      productName: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      unitPrice: {
        type: Number,
        required: true,
        min: 0
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0
      },
      category: {
        type: String,
        trim: true
      },
      code: {
        type: String,
        trim: true
      },
      unit: {
        type: String,
        trim: true
      }
    }],
    payments: [{
      amountReceived: {
        type: Number,
        required: true,
        min: 0
      },
      paymentDate: {
        type: Date,
        default: Date.now,
        required: true
      },
      paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'Other'],
        default: 'Bank Transfer'
      },
      referenceNumber: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      }
    }],
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    cgst: {
      type: Number,
      default: 0
    },
    sgst: {
      type: Number,
      default: 0
    },
    otherTax: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      required: true,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      default: 0
    },
    termsAndConditions: {
      type: String,
      trim: true
    },
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isDeleted: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transactions: [{
      type: {
        type: String,
        enum: ["credit", "debit", "tax", "discount", "adjustment"],
        required: true,
      },
      amount: { 
        type: Number, 
        required: true 
      },
      taxType: {
        type: String,
        enum: ["CGST", "SGST", "IGST", "Other"],
        default: undefined,
      },
      taxPercentage: { 
        type: Number 
      },
      discountReason: { 
        type: String 
      },
      balanceAfter: { 
        type: Number 
      },
      date: { 
        type: Date, 
        default: Date.now 
      },
      note: { 
        type: String, 
        trim: true 
      },
      paymentMode: { 
        type: String, 
        trim: true 
      },
      transactionId: { 
        type: String, 
        trim: true 
      },
      attachment: { 
        type: String, 
        trim: true 
      }
    }],
    runningBalance: { 
      type: Number, 
      default: 0 
    }
  },
  { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

// Generate quotation number
quotationSchema.pre("save", async function(next) {
  if (this.isNew && !this.quotationNumber) {
    const currentDate = new Date();
    const financialYear = currentDate.getMonth() >= 3 ? 
      currentDate.getFullYear() : 
      currentDate.getFullYear() - 1;
    
    // Find the last quotation number for the current financial year
    const lastQuotation = await this.constructor
      .findOne({
        quotationNumber: new RegExp(`^${financialYear}-ME-`),
        isDeleted: false
      })
      .sort({ quotationNumber: -1 });

    let sequenceNumber = 1;
    if (lastQuotation) {
      const lastNumber = parseInt(lastQuotation.quotationNumber.split('-')[2]);
      if (!isNaN(lastNumber)) {
      sequenceNumber = lastNumber + 1;
      }
    }

    this.quotationNumber = `${financialYear}-ME-${sequenceNumber.toString().padStart(3, '0')}`;
  }
  next();
});

// Calculate item totals and quotation totals before saving
quotationSchema.pre("save", function(next) {
  // Calculate item totals
  this.items.forEach(item => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    item.totalPrice = quantity * unitPrice;
  });

  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);

  // Ensure tax/discount fields are numbers
  const cgst = Number(this.cgst) || 0;
  const sgst = Number(this.sgst) || 0;
  const otherTax = Number(this.otherTax) || 0;
  const discount = Number(this.discount) || 0;

  // Calculate total tax
  this.tax = cgst + sgst + otherTax;

  // Calculate total
  this.total = this.subtotal + this.tax - discount;

  next();
});

module.exports = mongoose.model("Quotation", quotationSchema);
