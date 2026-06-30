const mongoose = require('mongoose');

const tankerSchema = new mongoose.Schema(
  {
    tankerNumber: {
      type: String,
      required: [true, 'Please provide tanker license plate / number'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify tanker capacity in liters'],
      min: [500, 'Minimum capacity is 500 liters'],
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive'],
      default: 'active',
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Tanker = mongoose.model('Tanker', tankerSchema);
module.exports = Tanker;
