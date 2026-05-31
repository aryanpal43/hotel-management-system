const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Add', 'Deduct', 'Assigned To Housekeeping'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
);

const inventorySchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Linen', 'Toiletries', 'F&B Stock', 'Cleaning Supplies', 'Other'],
      required: true,
    },
    stockLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    minStockLevel: {
      type: Number,
      default: 5,
    },
    unit: {
      type: String,
      default: 'pcs',
    },
    movements: [stockMovementSchema],
  },
  {
    timestamps: true,
  }
);

inventorySchema.index({ hotelId: 1, itemName: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
