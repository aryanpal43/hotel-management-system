const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Income', 'Expense'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Room Revenue',
        'Restaurant Revenue',
        'Laundry Revenue',
        'Extra Services',
        'Salary',
        'Maintenance',
        'Electricity',
        'Water',
        'Supplies',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Razorpay', 'PhonePe', 'Paytm'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ hotelId: 1, type: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
