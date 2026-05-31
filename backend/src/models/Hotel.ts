const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      zip: String,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    license: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
      },
      planName: {
        type: String,
        default: 'Starter',
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      expiryDate: {
        type: Date,
      },
      roomLimit: {
        type: Number,
        default: 20,
      },
      userLimit: {
        type: Number,
        default: 5,
      },
      whatsappLimit: {
        type: Number,
        default: 100,
      },
      whatsappUsed: {
        type: Number,
        default: 0,
      },
      isExpired: {
        type: Boolean,
        default: false,
      },
      features: {
        type: [String],
        default: ['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING'],
      },
    },
    settings: {
      currency: {
        type: String,
        default: 'INR',
      },
      timezone: {
        type: String,
        default: 'Asia/Kolkata',
      },
      checkInTime: {
        type: String,
        default: '12:00',
      },
      checkOutTime: {
        type: String,
        default: '11:00',
      },
      invoicePrefix: {
        type: String,
        default: 'INV-',
      },
      receiptPrefix: {
        type: String,
        default: 'REC-',
      },
      taxSettings: {
        cgstPercent: {
          type: Number,
          default: 6,
        },
        sgstPercent: {
          type: Number,
          default: 6,
        },
        gstThresholdPrice: {
          type: Number,
          default: 1000,
        },
      },
      whatsappConfig: {
        apiUrl: { type: String, default: '' },
        apiToken: { type: String, default: '' },
        senderNumber: { type: String, default: '' },
      },
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

// Enforce indexes for multi-tenant query speed and uniqueness
hotelSchema.index({ email: 1 });
hotelSchema.index({ distributorId: 1 });

module.exports = mongoose.model('Hotel', hotelSchema);
