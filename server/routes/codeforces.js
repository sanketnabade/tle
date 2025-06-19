const express = require("express");
const router = express.Router();
const axios = require("axios");
const Student = require("../models/Student");

// Export helper functions
module.exports.getCodeforcesUserInfo = getCodeforcesUserInfo;

// Helper function to fetch Codeforces user info
async function getCodeforcesUserInfo(handle) {
  try {
    const response = await axios.get(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );
    if (response.data.status === "OK") {
      return response.data.result[0];
    }
    throw new Error("Failed to fetch user info");
  } catch (error) {
    throw new Error(
      `Failed to fetch user info: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

// Helper function to fetch user's contest history
async function getContestHistory(handle) {
  try {
    const response = await axios.get(
      `https://codeforces.com/api/user.rating?handle=${handle}`
    );
    // console.log(response);
    if (response.data.status === "OK") {
      return response.data.result;
    }
    throw new Error("Failed to fetch contest history");
  } catch (error) {
    throw new Error(
      `Failed to fetch contest history: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

// Helper function to fetch user's submissions
async function getUserSubmissions(handle) {
  try {
    const response = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}`
    );
    if (response.data.status === "OK") {
      return response.data.result;
    }
    throw new Error("Failed to fetch submissions");
  } catch (error) {
    throw new Error(
      `Failed to fetch submissions: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

// Sync data for all students
router.get("/sync-all", async (req, res) => {
  try {
    const students = await Student.find();
    for (const student of students) {
      try {
        // Fetch user info
        const userInfo = await getCodeforcesUserInfo(student.codeforcesHandle);
        student.currentRating = userInfo.rating || 0;
        student.maxRating = userInfo.maxRating || 0;

        // Fetch contest history
        const contestHistory = await getContestHistory(
          student.codeforcesHandle
        );
        student.contestHistory = contestHistory.map((contest) => ({
          contestId: contest.contestId,
          contestName: contest.contestName,
          rank: contest.rank,
          ratingChange: contest.newRating - (contest.oldRating || 0),
          newRating: contest.newRating,
          date: new Date(contest.ratingUpdateTimeSeconds * 1000),
        }));

        // Fetch submissions
        const submissions = await getUserSubmissions(student.codeforcesHandle);
        const acceptedSubmissions = submissions.filter(
          (sub) => sub.verdict === "OK"
        );        // Update problem solving stats
        const ratingWiseSolved = {};
        
        // Create a map of unique problems to avoid counting duplicates
        const uniqueProblems = new Map();
        acceptedSubmissions.forEach(sub => {
          const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
          if (!uniqueProblems.has(problemKey)) {
            uniqueProblems.set(problemKey, sub);
            const rating = sub.problem.rating || 0;
            // Group problems by rating bands (e.g., 800-899, 900-999, etc.)
            const ratingBand = Math.floor(rating/100) * 100;
            const ratingKey = ratingBand.toString();
            ratingWiseSolved[ratingKey] = (ratingWiseSolved[ratingKey] || 0) + 1;
          }
        });

        // Calculate average rating only from unique problems
        const uniqueProblemList = Array.from(uniqueProblems.values());
        const totalProblems = uniqueProblemList.length;
        
        student.problemSolvingStats = {
          totalSolved: totalProblems,
          averageRating: totalProblems > 0
            ? uniqueProblemList.reduce(
                (sum, sub) => sum + (sub.problem.rating || 0),
                0
              ) / totalProblems
            : 0,
          ratingWiseSolved,
          submissionDates: acceptedSubmissions.map(
            (sub) => new Date(sub.creationTimeSeconds * 1000)
          ),
        };

        student.lastSync = new Date();
        await student.save();
      } catch (error) {
        console.error(
          `Failed to sync data for ${student.codeforcesHandle}:`,
          error
        );
      }
    }
    res.json({ message: "Sync completed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync data for a specific student
router.get("/sync/:id", async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.codeforcesHandle) {
      return res
        .status(400)
        .json({ message: "Student has no Codeforces handle" });
    }

    // Fetch and update data (reusing the same logic as sync-all)
    const userInfo = await getCodeforcesUserInfo(student.codeforcesHandle);
    student.currentRating = userInfo.rating || 0;
    student.maxRating = userInfo.maxRating || 0;

    const contestHistory = await getContestHistory(student.codeforcesHandle);
    student.contestHistory = contestHistory.map((contest) => ({
      contestId: contest.contestId,
      contestName: contest.contestName,
      rank: contest.rank,
      ratingChange: contest.newRating - (contest.oldRating || 0),
      newRating: contest.newRating,
      date: new Date(contest.ratingUpdateTimeSeconds * 1000),
    }));
    const submissions = await getUserSubmissions(student.codeforcesHandle);
    const acceptedSubmissions = submissions.filter(
      (sub) => sub.verdict === "OK"
    );

    // Create a Map to store rating counts with string keys
    const ratingWiseSolved = {};
    acceptedSubmissions.forEach((sub) => {
      const rating = sub.problem.rating || 0;
      const ratingKey = rating.toString();
      ratingWiseSolved[ratingKey] = (ratingWiseSolved[ratingKey] || 0) + 1;
    });

    student.problemSolvingStats = {
      totalSolved: acceptedSubmissions.length,
      averageRating:
        acceptedSubmissions.length > 0
          ? acceptedSubmissions.reduce(
              (sum, sub) => sum + (sub.problem.rating || 0),
              0
            ) / acceptedSubmissions.length
          : 0,
      ratingWiseSolved,
      submissionDates: acceptedSubmissions.map(
        (sub) => new Date(sub.creationTimeSeconds * 1000)
      ),
    };

    student.lastSync = new Date();
    const updatedStudent = await student.save();
    res.json(updatedStudent);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Function to sync a single student's data
async function syncStudent(studentId) {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error("Student not found");
  }

  // Fetch user info
  const userInfo = await getCodeforcesUserInfo(student.codeforcesHandle);
  student.currentRating = userInfo.rating || 0;
  student.maxRating = userInfo.maxRating || 0;

  // Fetch contest history
  const contestHistory = await getContestHistory(student.codeforcesHandle);
  student.contestHistory = contestHistory.map((contest) => ({
    contestId: contest.contestId,
    contestName: contest.contestName,
    rank: contest.rank,
    ratingChange: contest.newRating - (contest.oldRating || 0),
    newRating: contest.newRating,
    date: new Date(contest.ratingUpdateTimeSeconds * 1000),
  }));

  // Fetch submissions
  const submissions = await getUserSubmissions(student.codeforcesHandle);
  const acceptedSubmissions = submissions.filter((sub) => sub.verdict === "OK");

  const ratingWiseSolved = new Map();
  acceptedSubmissions.forEach((sub) => {
    const rating = sub.problem.rating || 0;
    ratingWiseSolved.set(rating, (ratingWiseSolved.get(rating) || 0) + 1);
  });

  student.problemSolvingStats = {
    totalSolved: acceptedSubmissions.length,
    averageRating:
      acceptedSubmissions.reduce(
        (sum, sub) => sum + (sub.problem.rating || 0),
        0
      ) / acceptedSubmissions.length,
    ratingWiseSolved,
    submissionDates: acceptedSubmissions.map(
      (sub) => new Date(sub.creationTimeSeconds * 1000)
    ),
  };

  student.lastSync = new Date();
  return student.save();
}

module.exports = {
  router,
  getCodeforcesUserInfo,
  getContestHistory,
  getUserSubmissions,
  syncStudent,
};
