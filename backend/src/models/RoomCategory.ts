const mongoose = require('mongoose');

const roomCategorySchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      adults: {
        type: Number,
        default: 2,
      },
      children: {
        type: Number,
        default: 0,
      },
    },
    description: {
      type: String,
      default: '',
    },
    amenities: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure uniqueness of category name per hotel
roomCategorySchema.index({ hotelId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('RoomCategory', roomCategorySchema);
