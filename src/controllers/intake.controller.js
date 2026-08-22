const IntakeLog = require('../models/intake.model');
const User = require('../models/user.model');

// @desc    Log water intake
// @route   POST /api/intake
// @access  Private (User or Admin)
exports.logIntake = async (req, res, next) => {
  try {
    const { amount, note, date } = req.body;

    // Edge Case Handling: 0 or negative amount check
    if (amount === undefined || amount === null || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid intake amount in ml.',
      });
    }

    const parsedAmount = Number(amount);
    if (parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Water intake amount must be greater than 0 ml.',
      });
    }

    if (parsedAmount > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Single log amount cannot exceed 5000 ml.',
      });
    }

    const intakeDate = date ? new Date(date) : new Date();

    const log = await IntakeLog.create({
      user: req.user._id,
      amount: parsedAmount,
      note: note ? note.trim() : 'Water',
      date: intakeDate,
    });

    res.status(201).json({
      success: true,
      message: `Successfully logged ${parsedAmount} ml of water!`,
      log,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's total intake vs daily goal for logged-in user
// @route   GET /api/intake/today
// @access  Private
exports.getTodaySummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get current user to read dailyGoal with default fallback
    const user = await User.findById(userId);
    const dailyGoal = user && user.dailyGoal ? user.dailyGoal : 2000; // Default goal: 2000 ml

    // Calculate start and end of today in local time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayLogs = await IntakeLog.find({
      user: userId,
      date: { $gte: startOfToday, $lte: endOfToday },
    }).sort({ date: -1 });

    const totalConsumed = todayLogs.reduce((acc, curr) => acc + curr.amount, 0);
    const remaining = Math.max(0, dailyGoal - totalConsumed);
    const percentage = Math.min(100, Math.round((totalConsumed / dailyGoal) * 100));
    const glasses = Math.round((totalConsumed / 250) * 10) / 10; // Standard 250ml glass

    res.status(200).json({
      success: true,
      summary: {
        totalConsumed,
        dailyGoal,
        remaining,
        percentage,
        glasses,
        logCount: todayLogs.length,
      },
      logs: todayLogs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's intake history (grouped by date)
// @route   GET /api/intake/history
// @access  Private
exports.getIntakeHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch user's daily goal with default fallback
    const user = await User.findById(userId);
    const dailyGoal = user && user.dailyGoal ? user.dailyGoal : 2000;

    const allLogs = await IntakeLog.find({ user: userId }).sort({ date: -1 });

    // Group logs by YYYY-MM-DD
    const historyMap = {};

    allLogs.forEach((log) => {
      const dateKey = new Date(log.date).toISOString().split('T')[0];
      if (!historyMap[dateKey]) {
        historyMap[dateKey] = {
          date: dateKey,
          totalAmount: 0,
          dailyGoal: dailyGoal,
          logs: [],
        };
      }
      historyMap[dateKey].totalAmount += log.amount;
      historyMap[dateKey].logs.push(log);
    });

    const historyArray = Object.values(historyMap).map((day) => ({
      ...day,
      percentage: Math.min(100, Math.round((day.totalAmount / day.dailyGoal) * 100)),
      achieved: day.totalAmount >= day.dailyGoal,
    }));

    res.status(200).json({
      success: true,
      count: historyArray.length,
      history: historyArray,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get any specific user's intake history (Admin view)
// @route   GET /api/intake/user/:userId
// @access  Private / Admin only
exports.getUserIntakeByAdmin = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    const targetUser = await User.findById(targetUserId).select('-password');
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found',
      });
    }

    const dailyGoal = targetUser.dailyGoal || 2000;
    const logs = await IntakeLog.find({ user: targetUserId }).sort({ date: -1 });

    // Group logs by date
    const historyMap = {};
    let totalAllTime = 0;

    logs.forEach((log) => {
      totalAllTime += log.amount;
      const dateKey = new Date(log.date).toISOString().split('T')[0];
      if (!historyMap[dateKey]) {
        historyMap[dateKey] = {
          date: dateKey,
          totalAmount: 0,
          dailyGoal: dailyGoal,
          logs: [],
        };
      }
      historyMap[dateKey].totalAmount += log.amount;
      historyMap[dateKey].logs.push(log);
    });

    const historyArray = Object.values(historyMap).map((day) => ({
      ...day,
      percentage: Math.min(100, Math.round((day.totalAmount / day.dailyGoal) * 100)),
      achieved: day.totalAmount >= day.dailyGoal,
    }));

    res.status(200).json({
      success: true,
      user: targetUser,
      totalAllTime,
      totalLogs: logs.length,
      history: historyArray,
      allLogs: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a logged entry
// @route   DELETE /api/intake/:id
// @access  Private (User can delete own; Admin can delete any)
exports.deleteIntakeLog = async (req, res, next) => {
  try {
    const logId = req.params.id;

    const log = await IntakeLog.findById(logId);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Intake log entry not found.',
      });
    }

    // Edge Case Check: Ensure user owns the log entry or is an Admin
    if (
      req.user.role !== 'admin' &&
      log.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to delete an intake entry that belongs to another user.',
      });
    }

    await log.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Water intake log entry deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
