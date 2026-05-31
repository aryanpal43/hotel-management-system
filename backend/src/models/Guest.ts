const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
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
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: '',
    },
    idProof: {
      type: {
        type: String, // e.g. Aadhaar, Passport, Driving License
        default: 'Aadhaar',
      },
      number: {
        type: String,
        default: '',
      },
    },
    nationality: {
      type: String,
      default: 'Indian',
    },
    history: {
      totalVisits: {
        type: Number,
        default: 0,
      },
      totalSpend: {
        type: Number,
        default: 0,
      },
      previousRooms: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Room',
        },
      ],
      outstandingDues: {
        type: Number,
        default: 0,
      },
      vipTag: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Search optimization indices
guestSchema.index({ hotelId: 1, mobileNumber: 1 });
guestSchema.index({ hotelId: 1, name: 1 });

module.exports = mongoose.model('Guest', guestSchema);
