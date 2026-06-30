const User = require('../models/User');

// @desc    Get all active drivers
// @route   GET /api/drivers/available
// @access  Private/Admin
exports.getAvailableDrivers = async (req, res, next) => {
  try {
    // Find all users with role 'driver' that are active
    const drivers = await User.find({ role: 'driver', isActive: true }).select('-password');

    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    next(error);
  }
};
