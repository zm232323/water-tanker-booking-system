const Tanker = require('../models/Tanker');
const User = require('../models/User');

// @desc    Add a new tanker to fleet
// @route   POST /api/tankers
// @access  Private/Admin
exports.addTanker = async (req, res, next) => {
  try {
    const { tankerNumber, capacity, status, assignedDriver } = req.body;

    if (!tankerNumber || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide tankerNumber and capacity',
      });
    }

    // Verify driver if assigned
    if (assignedDriver) {
      const driver = await User.findById(assignedDriver);
      if (!driver || driver.role !== 'driver') {
        return res.status(400).json({
          success: false,
          message: 'Assigned user must exist and have the role of driver',
        });
      }
    }

    const tanker = await Tanker.create({
      tankerNumber,
      capacity,
      status: status || 'active',
      assignedDriver: assignedDriver || null,
    });

    res.status(201).json({
      success: true,
      data: tanker,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tankers
// @route   GET /api/tankers
// @access  Private/Admin/Driver
exports.getTankers = async (req, res, next) => {
  try {
    const tankers = await Tanker.find().populate('assignedDriver', 'name email phone');
    res.status(200).json({
      success: true,
      count: tankers.length,
      data: tankers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tanker details
// @route   PUT /api/tankers/:id
// @access  Private/Admin
exports.updateTanker = async (req, res, next) => {
  try {
    const { tankerNumber, capacity, status, assignedDriver } = req.body;
    let tanker = await Tanker.findById(req.params.id);

    if (!tanker) {
      return res.status(404).json({
        success: false,
        message: `Tanker not found with id of ${req.params.id}`,
      });
    }

    // If driver is being updated
    if (assignedDriver !== undefined) {
      if (assignedDriver !== null) {
        const driver = await User.findById(assignedDriver);
        if (!driver || driver.role !== 'driver') {
          return res.status(400).json({
            success: false,
            message: 'Assigned user must exist and have the role of driver',
          });
        }
      }
    }

    tanker = await Tanker.findByIdAndUpdate(
      req.params.id,
      { tankerNumber, capacity, status, assignedDriver },
      { new: true, runValidators: true }
    ).populate('assignedDriver', 'name email phone');

    res.status(200).json({
      success: true,
      data: tanker,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tanker
// @route   DELETE /api/tankers/:id
// @access  Private/Admin
exports.deleteTanker = async (req, res, next) => {
  try {
    const tanker = await Tanker.findById(req.params.id);

    if (!tanker) {
      return res.status(404).json({
        success: false,
        message: `Tanker not found with id of ${req.params.id}`,
      });
    }

    await Tanker.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Tanker deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
