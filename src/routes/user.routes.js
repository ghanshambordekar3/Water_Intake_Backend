const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateDailyGoal,
  deleteUser,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All user routes require login
router.use(protect);

// Admin-only: Get all users
router.get('/', authorize('admin'), getAllUsers);

// Admin or Self: Get single user profile
router.get('/:id', getUserById);

// Admin or Self: Update daily water goal
router.put('/:id/goal', updateDailyGoal);

// Admin-only: Delete user account (Admin cannot delete self)
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
