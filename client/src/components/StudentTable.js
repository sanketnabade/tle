import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Edit,
  Delete,
  Visibility,
  CloudDownload,
  Add,
  Sync,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import AddStudentModal from "./AddStudentModal";
import EditStudentModal from "./EditStudentModal";
import CodeforcesRating from "./CodeforcesRating";
import api from "../services/api";

function StudentTable() {
  const [students, setStudents] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await api.getAllStudents();
      setStudents(data);
    } catch (error) {
      showSnackbar("Failed to fetch students", "error");
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await api.exportStudentsCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "students.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showSnackbar("CSV exported successfully", "success");
    } catch (error) {
      showSnackbar("Export failed", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteStudent(selectedStudent._id);
      setStudents(students.filter((s) => s._id !== selectedStudent._id));
      setDeleteDialogOpen(false);
      showSnackbar("Student deleted successfully", "success");
    } catch (error) {
      showSnackbar("Failed to delete student", "error");
    }
  };

  const handleSync = async (studentId) => {
    try {
      const updatedStudent = await api.syncStudent(studentId);
      setStudents(
        students.map((s) => (s._id === studentId ? updatedStudent : s))
      );
      showSnackbar("Student data synced successfully", "success");
    } catch (error) {
      showSnackbar("Failed to sync student data", "error");
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Students</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CloudDownload />}
            onClick={handleExportCSV}
            sx={{ mr: 2 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Student
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>CF Handle</TableCell>
              <TableCell>Current Rating</TableCell>
              <TableCell>Max Rating</TableCell>
              <TableCell>Last Synced</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.phoneNumber}</TableCell>                <TableCell>
                  <Typography
                    component="a"
                    href={`https://codeforces.com/profile/${student.codeforcesHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {student.codeforcesHandle}
                  </Typography>
                </TableCell>
                <TableCell>
                  <CodeforcesRating rating={student.currentRating} />
                </TableCell>
                <TableCell>
                  <CodeforcesRating rating={student.maxRating} />
                </TableCell>
                <TableCell>{formatDate(student.lastSync)}</TableCell>
                <TableCell>
                  <Tooltip title="View Profile">
                    <IconButton
                      onClick={() => navigate(`/student/${student._id}`)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => {
                        setSelectedStudent(student);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => {
                        setSelectedStudent(student);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sync CF Data">
                    <IconButton onClick={() => handleSync(student._id)}>
                      <Sync />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>{" "}
      <AddStudentModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(newStudent) => {
          setStudents([...students, newStudent]);
          showSnackbar("Student added successfully");
        }}
      />
      <EditStudentModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
        }}
        onEdit={(updatedStudent) => {
          setStudents(
            students.map((s) =>
              s._id === updatedStudent._id ? updatedStudent : s
            )
          );
          showSnackbar("Student updated successfully");
        }}
        student={selectedStudent}
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedStudent?.name}? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default StudentTable;
