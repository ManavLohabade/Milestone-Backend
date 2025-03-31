const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
  {
    customerName: { 
      type: String, 
      required: true 
    },
    quotationNumber: {
      type: String,
      unique: true
    },
    date: {
      type: Date,
      default: Date.now,
    },
    items: [
      {
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unit: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        total: {
          type: Number,
          required: true,
        }
      },
    ],
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentReceived: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved"],
      default: "Pending",
    }
  },
  { 
    timestamps: true 
  }
);

// Generate unique quotation number
quotationSchema.pre("save", async function(next) {
  try {
    if (!this.quotationNumber) {
      // Find the last quotation with the highest number
      const lastQuotation = await this.constructor
        .findOne()
        .sort({ quotationNumber: -1 })
        .select('quotationNumber');

      let nextNumber = 1;

      if (lastQuotation && lastQuotation.quotationNumber) {
        // Extract the number from the quotation number (remove the '#' and convert to integer)
        const lastNumber = parseInt(lastQuotation.quotationNumber.replace(/\D/g, ''));
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }

      // Pad the number with zeros to maintain 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.quotationNumber = `#${paddedNumber}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Calculate grand total before saving
quotationSchema.pre("save", function(next) {
  try {
    // Calculate item totals and grand total
    this.grandTotal = 0;
    if (Array.isArray(this.items)) {
      this.items.forEach(item => {
        if (item.quantity && item.price) {
          item.total = item.quantity * item.price;
          this.grandTotal += item.total;
        }
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Quotation", quotationSchema);
