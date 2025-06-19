const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const studentRoutes = require("./routes/students");
const { router: codeforcesRoutes } = require("./routes/codeforces");

app.use("/api/students", studentRoutes);
app.use("/api/codeforces", codeforcesRoutes);

// Email Configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const Student = require("./models/Student");
const { getCodeforcesUserInfo } = require("./routes/codeforces");

// Cron job for daily Codeforces data sync (2 AM)
cron.schedule("0 2 * * *", async () => {
  try {
    const students = await Student.find();
    for (const student of students) {
      try {
        const userInfo = await getCodeforcesUserInfo(student.codeforcesHandle);
        student.currentRating = userInfo.rating || 0;
        student.maxRating = userInfo.maxRating || 0;
        await student.save();
      } catch (error) {
        console.error(
          `Failed to sync data for ${student.codeforcesHandle}:`,
          error
        );
      }
    }
    console.log("Daily sync completed");
  } catch (error) {
    console.error("Daily sync failed:", error);
  }
});

// Cron job for inactivity check (3 AM)
cron.schedule("0 3 * * *", async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inactiveStudents = await Student.find({
      "problemSolvingStats.submissionDates": {
        $not: { $gte: sevenDaysAgo },
      },
      disableEmailReminders: false,
    });

    for (const student of inactiveStudents) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: "Reminder: Stay Active on Codeforces",
          text: `Hi ${student.name},\n\nWe noticed you haven't solved any problems on Codeforces in the past week. Keep practicing to improve your skills!\n\nBest regards,\nStudent Progress Management System`,
        };

        await transporter.sendMail(mailOptions);
        student.reminderEmailsSent += 1;
        await student.save();
      } catch (error) {
        console.error(
          `Failed to process inactive student ${student._id}:`,
          error
        );
      }
    }
    console.log("Inactivity check completed");
  } catch (error) {
    console.error("Inactivity check failed:", error);
  }
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
