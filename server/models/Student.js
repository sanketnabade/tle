const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minLength: [2, "Name must be at least 2 characters long"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
    validate: {
      validator: function (v) {
        // Allow digits, spaces, dashes, dots, parentheses, and plus sign
        return /^[0-9+\-.()\s]{10,20}$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid phone number. It should be between 10-20 characters and may contain digits, spaces, dashes, dots, parentheses, and plus sign.`,
    },
  },
  codeforcesHandle: {
    type: String,
    required: [true, "Codeforces handle is required"],
    unique: true,
    trim: true,
  },
  currentRating: {
    type: Number,
    default: 0,
  },
  maxRating: {
    type: Number,
    default: 0,
  },
  lastSync: {
    type: Date,
    default: Date.now,
  },
  disableEmailReminders: {
    type: Boolean,
    default: false,
  },
  reminderEmailsSent: {
    type: Number,
    default: 0,
  },
  contestHistory: [
    {
      contestId: String,
      contestName: String,
      rank: Number,
      ratingChange: Number,
      newRating: Number,
      date: Date,
    },
  ],
  problemSolvingStats: {
    totalSolved: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingWiseSolved: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    submissionDates: [Date],
  },
});

module.exports = mongoose.model("Student", studentSchema);
