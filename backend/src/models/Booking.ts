const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Razorpay', 'PhonePe', 'Paytm'],
      required: true,
    },
    transactionId: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: true,
      index: true,
    },
    rooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
      },
    ],
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    actualCheckIn: {
      type: Date,
    },
    actualCheckOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Booked', 'CheckedIn', 'CheckedOut', 'Cancelled'],
      default: 'Booked',
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'PartiallyPaid', 'Paid', 'Refunded'],
      default: 'Pending',
    },
    payments: [paymentLogSchema],
    source: {
      type: String,
      enum: ['WalkIn', 'Online', 'OTA'],
      default: 'WalkIn',
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ hotelId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
