const express = require("express");
const router = express.Router();
const axios = require("axios");
const Student = require("../models/Student");
const nodemailer = require("nodemailer");

// Get all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new student
router.post("/", async (req, res) => {
  //   console.log(req);
  try {
    // Trim all string inputs
    const sanitizedData = {
      name: req.body.name?.trim(),
      email: req.body.email?.trim().toLowerCase(),
      phoneNumber: req.body.phoneNumber?.trim(),
      codeforcesHandle: req.body.codeforcesHandle?.trim(),
    };

    // Validate required fields
    const requiredFields = ["name", "email", "phoneNumber", "codeforcesHandle"];
    const missingFields = requiredFields.filter(
      (field) => !sanitizedData[field]
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate phone number format
    if (!/^[0-9+\-.()\s]{10,20}$/.test(sanitizedData.phoneNumber)) {
      return res.status(400).json({
        message:
          "Invalid phone number format. It should be between 10-20 characters and may contain digits, spaces, dashes, dots, parentheses, and plus sign.",
      });
    } // Check if email or CF handle already exists
    const existingStudent = await Student.findOne({
      $or: [
        { email: sanitizedData.email },
        { codeforcesHandle: sanitizedData.codeforcesHandle },
      ],
    });

    if (existingStudent) {
      return res.status(400).json({
        message:
          existingStudent.email === sanitizedData.email
            ? "Email already registered"
            : "Codeforces handle already registered",
      });
    }

    // Validate Codeforces handle
    try {
      const { getCodeforcesUserInfo } = require("./codeforces");
      await getCodeforcesUserInfo(sanitizedData.codeforcesHandle);
    } catch (error) {
      return res.status(400).json({
        message:
          "Invalid Codeforces handle. Please check if the handle exists and try again.",
      });
    }
    const student = new Student(sanitizedData);
    const newStudent = await student.save();

    try {
      // Make a direct request to sync the student
      const response = await axios.get(
        `${
          process.env.BASE_URL || "http://localhost:5000"
        }/api/codeforces/sync/${newStudent._id}`
      );
      res.status(201).json(response.data);
    } catch (error) {
      // If sync fails, still return the created student
      console.error("Error syncing student data:", error.message);
      res.status(201).json(newStudent);
    }
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(400).json({
      message: error.message || "Failed to add student",
      details: error.response?.data?.message,
    });
  }
});

// Get a specific student
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a student
router.patch("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if Codeforces handle was updated
    const handleUpdated =
      req.body.codeforcesHandle &&
      req.body.codeforcesHandle !== student.codeforcesHandle;

    Object.keys(req.body).forEach((key) => {
      student[key] = req.body[key];
    });

    const updatedStudent = await student.save();

    // If Codeforces handle was updated, fetch new data
    if (handleUpdated) {
      await fetch(`/api/codeforces/sync/${updatedStudent._id}`);
    }

    res.json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a student
router.delete("/:id", async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const result = await Student.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      message: "Failed to delete student",
      error: error.message,
    });
  }
});

// Export student data as CSV
router.get("/export/csv", async (req, res) => {
  try {
    const students = await Student.find();
    const fields = [
      "name",
      "email",
      "phoneNumber",
      "codeforcesHandle",
      "currentRating",
      "maxRating",
      "lastSync",
    ];

    let csv = fields.join(",") + "\n";
    students.forEach((student) => {
      csv += fields.map((field) => student[field]).join(",") + "\n";
    });

    res.header("Content-Type", "text/csv");
    res.attachment("students.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check student inactivity
router.get("/check-inactivity", async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inactiveStudents = await Student.find({
      "problemSolvingStats.submissionDates": {
        $not: { $gte: sevenDaysAgo },
      },
      disableEmailReminders: false,
    });

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    for (const student of inactiveStudents) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: "Reminder: Stay Active on Codeforces",
        text: `Hi ${student.name},\n\nWe noticed you haven't solved any problems on Codeforces in the past week. Keep practicing to improve your skills!\n\nBest regards,\nStudent Progress Management System`,
      };

      await transporter.sendMail(mailOptions);
      student.reminderEmailsSent += 1;
      await student.save();
    }

    res.json({
      message: `Sent reminders to ${inactiveStudents.length} students`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
