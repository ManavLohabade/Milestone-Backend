const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
     required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
  },
  alternatePhone: {
    type: String,
    trim: true,
    match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
  },

  // Address Information
  address: {
    line1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true
    },
    line2: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    pinCode: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit PIN code']
    }
  },

  // Business Information
  businessName: {
    type: String,
    trim: true
  },
  gstn: {
    type: String,
    trim: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
  },
  panNumber: {
    type: String,
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
  },

  // Financial Information
  paymentTerms: {
    type: String,
    trim: true,
    enum: ['Immediate', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom'],
    default: 'Net 30'
  },
  customPaymentTerms: {
    type: String,
    trim: true
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },

  // Contact Person Information
  contactPerson: {
    name: {
      type: String,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
    }
  },

  // Financial Summary (Calculated fields)
  financialSummary: {
    totalQuotations: {
      type: Number,
      default: 0
    },
    totalInvoiced: {
      type: Number,
      default: 0
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    totalDue: {
      type: Number,
      default: 0
    },
    lastPaymentDate: {
      type: Date
    },
    lastPaymentAmount: {
      type: Number,
      default: 0
    }
  },

  // Status and Classification
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Blocked'],
    default: 'Active'
  },
  clientType: {
    type: String,
    enum: ['Individual', 'Company', 'Partnership', 'LLP', 'Other'],
    default: 'Individual'
  },
  category: {
    type: String,
    enum: ['Regular', 'Premium', 'VIP'],
    default: 'Regular'
  },

  // Additional Information
  notes: {
    type: String,
    trim: true
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // System Fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
clientSchema.index({ name: 1 });
clientSchema.index({ email: 1 }, { unique: true });
clientSchema.index({ phone: 1 });
clientSchema.index({ gstn: 1 }, { sparse: true });
clientSchema.index({ 'address.city': 1 });
clientSchema.index({ 'address.state': 1 });
clientSchema.index({ status: 1 });

// Virtual for full address
clientSchema.virtual('fullAddress').get(function() {
  return `${this.address.line1}, ${this.address.line2 ? this.address.line2 + ', ' : ''}${this.address.city}, ${this.address.state}, ${this.address.country} - ${this.address.pinCode}`;
});

// Method to update financial summary
clientSchema.methods.updateFinancialSummary = async function() {
  const Quotation = mongoose.model('Quotation');
  
  const quotations = await Quotation.find({
    clientId: this._id,
    isDeleted: false
  });

  this.financialSummary = {
    totalQuotations: quotations.length,
    totalInvoiced: quotations.reduce((sum, q) => sum + q.total, 0),
    totalPaid: quotations.reduce((sum, q) => sum + q.payments.reduce((pSum, p) => pSum + p.amountReceived, 0), 0),
    totalDue: quotations.reduce((sum, q) => {
      const paid = q.payments.reduce((pSum, p) => pSum + p.amountReceived, 0);
      return sum + (q.total - paid);
    }, 0)
  };

  // Find last payment
  const lastPayment = await Quotation.findOne({
    clientId: this._id,
    'payments.0': { $exists: true }
  }).sort({ 'payments.paymentDate': -1 });

  if (lastPayment && lastPayment.payments.length > 0) {
    this.financialSummary.lastPaymentDate = lastPayment.payments[0].paymentDate;
    this.financialSummary.lastPaymentAmount = lastPayment.payments[0].amountReceived;
  }

  await this.save();
};

// Pre-save middleware to handle custom payment terms
clientSchema.pre('save', function(next) {
  if (this.paymentTerms === 'Custom' && !this.customPaymentTerms) {
    next(new Error('Custom payment terms are required when payment terms is set to Custom'));
  }
  next();
});

module.exports = mongoose.model('Client', clientSchema); 