const express = require('express');
const {
  createBooking,
  getBookings,
  getBookingById,
  assignBooking,
  updateBookingStatus,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', authorize('customer'), createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);

router.put('/:id/assign', authorize('admin'), assignBooking);
router.put('/:id/status', authorize('admin', 'driver'), updateBookingStatus);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
