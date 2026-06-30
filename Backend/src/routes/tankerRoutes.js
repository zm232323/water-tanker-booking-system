const express = require('express');
const {
  addTanker,
  getTankers,
  updateTanker,
  deleteTanker,
} = require('../controllers/tankerController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get tankers - Admin and Driver allowed
router.get('/', authorize('admin', 'driver'), getTankers);

// Modifying routes - Admin only
router.post('/', authorize('admin'), addTanker);
router.put('/:id', authorize('admin'), updateTanker);
router.delete('/:id', authorize('admin'), deleteTanker);

module.exports = router;
