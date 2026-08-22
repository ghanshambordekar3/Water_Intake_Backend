const User = require('../models/user.model');
const IntakeLog = require('../models/intake.model');

// @desc    Get list of all registered users (with intake summary)
// @route   GET /api/users
// @access  Private / Admin only
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Enhance users with today's intake stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const userObj = u.toObject();
        
        // Compute total water logged today
        const todayLogs = await IntakeLog.aggregate([
          {
            $match: {
              user: u._id,
              date: { $gte: todayStart },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              logCount: { $sum: 1 },
            },
          },
        ]);

        userObj.todayIntake = todayLogs.length > 0 ? todayLogs[0].totalAmount : 0;
        userObj.todayLogCount = todayLogs.length > 0 ? todayLogs[0].logCount : 0;
        userObj.dailyGoal = userObj.dailyGoal || 2000; // Fallback default goal
        return userObj;
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithStats.length,
      users: usersWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private (Admin or Self)
exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check permissions: Admin or requested user's own profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied. You can only view your own profile.',
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        dailyGoal: user.dailyGoal || 2000,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update daily water intake goal
// @route   PUT /api/users/:id/goal
// @access  Private (Admin or Self)
exports.updateDailyGoal = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { dailyGoal } = req.body;

    // Permissions check: Only Admin or the User themselves can update daily goal
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot update another user\'s daily goal',
      });
    }

    if (!dailyGoal || isNaN(dailyGoal) || Number(dailyGoal) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive daily goal in ml (e.g. 2000)',
      });
    }

    const goalValue = Number(dailyGoal);
    if (goalValue < 100 || goalValue > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Daily goal must be between 100 ml and 10000 ml',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { dailyGoal: goalValue },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Daily goal updated to ${goalValue} ml`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user account
// @route   DELETE /api/users/:id
// @access  Private / Admin only
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Edge case check: Admin cannot delete their own account
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Action rejected: Admin cannot delete their own account.',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete all intake logs associated with this user
    await IntakeLog.deleteMany({ user: userId });

    // Delete user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' and all associated water intake logs deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
