const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    floorNumber: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure floor number is unique per hotel
floorSchema.index({ hotelId: 1, floorNumber: 1 }, { unique: true });

module.exports = mongoose.model('Floor', floorSchema);
