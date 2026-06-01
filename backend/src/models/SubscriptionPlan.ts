const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    limits: {
      rooms: {
        type: Number,
        required: true,
        default: 20,
      },
      users: {
        type: Number,
        required: true,
        default: 5,
      },
      storageGb: {
        type: Number,
        default: 5,
      },
      whatsappAlerts: {
        type: Number,
        default: 100,
      },
    },
    features: [
      {
        type: String,
      },
    ], // "POS", "INVENTORY", "MAINTENANCE", etc.
    isActive: {
      type: Boolean,
      default: true,
    },
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionPlanSchema.index({ name: 1, distributorId: 1 }, { unique: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
