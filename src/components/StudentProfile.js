import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [contestFilter, setContestFilter] = useState("30");
  const [problemFilter, setProblemFilter] = useState("7");
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const data = await api.getStudent(id);
        setStudent(data);
      } catch (error) {
        console.error("Error fetching student:", error);
      }
    };
    fetchStudent();
  }, [id]);

  const filterContestsByDays = (contests, days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    return contests.filter((contest) => new Date(contest.date) >= cutoff);
  };

  const filterProblemsByDays = (submissions, days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    return submissions.filter((date) => new Date(date) >= cutoff);
  };

  const getRatingData = (contests) => {
    return {
      labels: contests.map((c) => c.contestName),
      datasets: [
        {
          label: "Rating",
          data: contests.map((c) => c.newRating),
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };
  };  const getProblemRatingData = () => {
    if (!student?.problemSolvingStats?.ratingWiseSolved) return null;

    // Convert the ratingWiseSolved object to sorted array of entries
    const ratingData = Object.entries(student.problemSolvingStats.ratingWiseSolved)
      .map(([rating, count]) => ({ 
        rating: parseInt(rating), 
        count: parseInt(count) // ensure count is a number
      }))
      .sort((a, b) => a.rating - b.rating);

    return {
      labels: ratingData.map(data => `${data.rating}-${data.rating + 99}`),
      datasets: [
        {
          label: "Problems Solved",
          data: ratingData.map(data => data.count),
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgb(75, 192, 192)",
          borderWidth: 1,
          barThickness: 'flex',
          maxBarThickness: 50
        }
      ],
    };
  };

  if (!student) return <Typography>Loading...</Typography>;

  const filteredContests = filterContestsByDays(
    student.contestHistory || [],
    contestFilter
  );
  const filteredSubmissions = filterProblemsByDays(
    student.problemSolvingStats?.submissionDates || [],
    problemFilter
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {student.name}'s Profile
      </Typography>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
        <Tab label="Contest History" />
        <Tab label="Problem Solving Data" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={contestFilter}
              label="Time Period"
              onChange={(e) => setContestFilter(e.target.value)}
            >
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
              <MenuItem value="365">Last 365 days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Line data={getRatingData(filteredContests)} />
        </Paper>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Contest Stats
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Current Rating</Typography>
            <Typography variant="h6">{student.currentRating}</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Max Rating</Typography>
            <Typography variant="h6">{student.maxRating}</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Total Contests</Typography>
            <Typography variant="h6">
              {student.contestHistory?.length || 0}
            </Typography>
          </Paper>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={problemFilter}
              label="Time Period"
              onChange={(e) => setProblemFilter(e.target.value)}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
            mb: 3,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Total Problems Solved</Typography>
            <Typography variant="h6">{filteredSubmissions.length}</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Average Problems/Day</Typography>
            <Typography variant="h6">
              {(filteredSubmissions.length / parseInt(problemFilter)).toFixed(
                2
              )}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Average Problem Rating</Typography>
            <Typography variant="h6">
              {student.problemSolvingStats?.averageRating?.toFixed(0) || 0}
            </Typography>
          </Paper>
        </Box>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Problems by Rating
          </Typography>
          <Bar data={getProblemRatingData()} />
        </Paper>
      </TabPanel>
    </Box>
  );
}

export default StudentProfile;
