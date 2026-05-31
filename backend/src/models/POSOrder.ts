const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const posOrderSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true,
    },
    roomNumber: {
      type: String,
      default: '',
    },
    orderType: {
      type: String,
      enum: ['Room Service', 'Restaurant DineIn', 'Bar'],
      default: 'Room Service',
    },
    items: [orderItemSchema],
    subTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'PostedToRoom'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'RoomFolio'],
      default: 'Cash',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('POSOrder', posOrderSchema);
