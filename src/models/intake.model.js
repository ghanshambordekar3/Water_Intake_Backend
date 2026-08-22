const mongoose = require('mongoose');

const intakeLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an intake amount in ml'],
      min: [1, 'Intake amount must be greater than 0 ml'],
    },
    note: {
      type: String,
      trim: true,
      default: 'Water',
      maxlength: [100, 'Note cannot exceed 100 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual index on user + date for fast range queries
intakeLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('IntakeLog', intakeLogSchema);
