const express = require('express');
const router = express.Router();
const {
  logIntake,
  getTodaySummary,
  getIntakeHistory,
  getUserIntakeByAdmin,
  deleteIntakeLog,
} = require('../controllers/intake.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All intake routes require JWT authentication
router.use(protect);

// Log water intake
router.post('/', logIntake);

// Get today's total intake vs daily goal
router.get('/today', getTodaySummary);

// Get logged-in user's history
router.get('/history', getIntakeHistory);

// Admin-only: View any user's intake history
router.get('/user/:userId', authorize('admin'), getUserIntakeByAdmin);

// Delete intake log (Owner or Admin)
router.delete('/:id', deleteIntakeLog);

module.exports = router;
