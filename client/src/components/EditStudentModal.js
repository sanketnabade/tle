import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
} from "@mui/material";
import api from "../services/api";

function EditStudentModal({ open, onClose, onEdit, student }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    codeforcesHandle: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        email: student.email || "",
        phoneNumber: student.phoneNumber || "",
        codeforcesHandle: student.codeforcesHandle || "",
      });
    }
  }, [student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const updatedStudent = await api.updateStudent(student._id, formData);
      onEdit(updatedStudent);
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to update student. Please try again."
      );
      // Log the error for debugging
      console.error(
        "Error updating student:",
        error.response?.data || error.message
      );
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Student</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Codeforces Handle"
              name="codeforcesHandle"
              value={formData.codeforcesHandle}
              onChange={handleChange}
              required
              fullWidth
              helperText="Enter a valid Codeforces handle"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Update
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EditStudentModal;
