const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const granularPermissionSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
      enum: ['dashboard', 'rooms', 'bookings', 'housekeeping', 'maintenance', 'inventory', 'accounting', 'pos', 'users', 'reports', 'settings'],
    },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    roles: [
      {
        type: String,
        required: true,
        enum: ['SUPER_ADMIN', 'DISTRIBUTOR', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'HOUSEKEEPING', 'CUSTOM_USER'],
      },
    ],
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      default: null,
    },
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    granularPermissions: [granularPermissionSchema],
    allowedModules: {
      type: [String],
      default: ['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING', 'MAINTENANCE', 'INVENTORY', 'POS'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: '',
    },
    lastLogin: {
      type: Date,
    },
    loginHistory: [
      {
        ip: String,
        device: String,
        browser: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexing for multi-tenancy searches
userSchema.index({ email: 1 });
userSchema.index({ hotelId: 1 });
userSchema.index({ distributorId: 1 });

module.exports = mongoose.model('User', userSchema);
