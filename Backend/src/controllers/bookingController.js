const Booking = require('../models/Booking');
const Tanker = require('../models/Tanker');
const User = require('../models/User');

// @desc    Create a new water tanker booking
// @route   POST /api/bookings
// @access  Private/Customer
exports.createBooking = async (req, res, next) => {
  try {
    const { deliveryAddress, capacityRequired, deliveryDate, price } = req.body;

    if (!deliveryAddress || !capacityRequired || !deliveryDate || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (deliveryAddress, capacityRequired, deliveryDate, price)',
      });
    }

    const booking = await Booking.create({
      customer: req.user.id,
      deliveryAddress,
      capacityRequired,
      deliveryDate,
      price,
    });

    // Notify Admins about new booking via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.to('admin').emit('new_booking_created', booking);
    }

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings based on user role
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    let query = {};

    // Filter by role
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'driver') {
      query.driver = req.user.id;
    }
    // If admin, query is empty (sees all bookings)

    const bookings = await Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('driver', 'name email phone')
      .populate('tanker', 'tankerNumber capacity status')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('driver', 'name email phone')
      .populate('tanker', 'tankerNumber capacity status');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking not found with id of ${req.params.id}`,
      });
    }

    // Authorization check: Customer can only view their own, Driver can only view assigned, Admin can view all
    if (req.user.role === 'customer' && booking.customer.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    if (req.user.role === 'driver' && booking.driver && booking.driver.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign driver and tanker to a booking
// @route   PUT /api/bookings/:id/assign
// @access  Private/Admin
exports.assignBooking = async (req, res, next) => {
  try {
    const { driverId, tankerId } = req.body;

    if (!driverId || !tankerId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide driverId and tankerId',
      });
    }

    let booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking not found with id of ${req.params.id}`,
      });
    }

    if (booking.status === 'cancelled' || booking.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign driver to a ${booking.status} booking`,
      });
    }

    // Verify driver exists and is a driver
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(400).json({
        success: false,
        message: 'Selected user must be a registered driver',
      });
    }

    // Verify tanker exists and is active
    const tanker = await Tanker.findById(tankerId);
    if (!tanker || tanker.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Selected tanker must exist and be active',
      });
    }

    // Update booking
    booking.driver = driverId;
    booking.tanker = tankerId;
    booking.status = 'assigned';
    await booking.save();

    // Auto-update tanker assignment (soft linkage)
    tanker.assignedDriver = driverId;
    await tanker.save();

    const updatedBooking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('driver', 'name email phone')
      .populate('tanker', 'tankerNumber capacity status');

    // Notify parties via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      // 1. Notify specific booking channel (Customer monitoring page)
      io.to(`booking_${booking._id}`).emit('booking_updated', updatedBooking);
      // 2. Notify driver room directly (Driver mobile app / dashboard)
      io.to(`user_${driverId}`).emit('new_booking_assignment', updatedBooking);
    }

    res.status(200).json({
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (Dispatched / Delivered)
// @route   PUT /api/bookings/:id/status
// @access  Private/Driver/Admin
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['assigned', 'dispatched', 'delivered'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (assigned, dispatched, or delivered)',
      });
    }

    let booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking not found with id of ${req.params.id}`,
      });
    }

    // Driver can only update if assigned to this booking
    if (req.user.role === 'driver' && booking.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update status of this booking',
      });
    }

    // Update status
    booking.status = status;
    
    // If delivered, auto mark paymentStatus as paid (or mock it)
    if (status === 'delivered') {
      booking.paymentStatus = 'paid';
    }

    await booking.save();

    const updatedBooking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('driver', 'name email phone')
      .populate('tanker', 'tankerNumber capacity status');

    // Broadcast update via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.to(`booking_${booking._id}`).emit('booking_updated', updatedBooking);
      io.to('admin').emit('booking_status_update_admin', updatedBooking);
    }

    res.status(200).json({
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking not found with id of ${req.params.id}`,
      });
    }

    // Customer can only cancel their own, and only if status is pending or assigned
    if (req.user.role === 'customer') {
      if (booking.customer.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this booking',
        });
      }

      if (['dispatched', 'delivered', 'cancelled'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel booking when status is already ${booking.status}`,
        });
      }
    }

    // Admin can cancel anything that isn't delivered/cancelled yet
    if (req.user.role === 'admin' && ['delivered', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking that is already ${booking.status}`,
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    const updatedBooking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('driver', 'name email phone')
      .populate('tanker', 'tankerNumber capacity status');

    // Broadcast update
    const io = req.app.get('socketio');
    if (io) {
      io.to(`booking_${booking._id}`).emit('booking_updated', updatedBooking);
      io.to('admin').emit('booking_cancelled_admin', updatedBooking);
      if (booking.driver) {
        io.to(`user_${booking.driver}`).emit('booking_cancelled_driver', updatedBooking);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};
