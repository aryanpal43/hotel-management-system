const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
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
    issueType: {
      type: String,
      enum: ['AC Repair', 'TV Repair', 'Furniture Repair', 'Plumbing', 'Electrical', 'Other'],
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    assignedTo: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Completed'],
      default: 'Open',
    },
    cost: {
      type: Number,
      default: 0,
    },
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
