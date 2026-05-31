const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomCategory',
      required: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'Maintenance', 'Cleaning'],
      default: 'Available',
    },
    housekeepingStatus: {
      type: String,
      enum: ['Dirty', 'Clean', 'Inspected'],
      default: 'Clean',
    },
  },
  {
    timestamps: true,
  }
);

// Room number unique per hotel
roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
