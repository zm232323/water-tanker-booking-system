const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a customer'],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tanker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tanker',
      default: null,
    },
    deliveryAddress: {
      street: {
        type: String,
        required: [true, 'Please provide delivery street address'],
      },
      city: {
        type: String,
        required: [true, 'Please provide delivery city'],
      },
      coordinates: {
        lat: {
          type: Number,
          required: [true, 'Please provide delivery latitude'],
        },
        lng: {
          type: Number,
          required: [true, 'Please provide delivery longitude'],
        },
      },
    },
    capacityRequired: {
      type: Number,
      required: [true, 'Please specify the capacity needed in liters'],
      min: [500, 'Minimum required capacity is 500 liters'],
    },
    deliveryDate: {
      type: Date,
      required: [true, 'Please provide a scheduled delivery date'],
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'dispatched', 'delivered', 'cancelled'],
      default: 'pending',
    },
    price: {
      type: Number,
      required: [true, 'Please specify the booking price'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
