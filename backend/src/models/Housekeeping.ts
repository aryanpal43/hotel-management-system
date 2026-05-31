const mongoose = require('mongoose');

const housekeepingSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['Dirty', 'CleaningInProcess', 'Clean', 'Inspected'],
      default: 'Dirty',
    },
    notes: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

housekeepingSchema.index({ hotelId: 1, status: 1 });

module.exports = mongoose.model('Housekeeping', housekeepingSchema);
