const express = require('express');
const { getAvailableDrivers } = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/available', authorize('admin'), getAvailableDrivers);

module.exports = router;
