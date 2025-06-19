import { useState } from "react";
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

function AddStudentModal({ open, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    codeforcesHandle: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const newStudent = await api.addStudent(formData);
      onAdd(newStudent);
      onClose();
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        codeforcesHandle: "",
      });
    } catch (error) {
      // Get the most specific error message available
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to add student. Please try again.";
      setError(errorMessage);

      // Log the error for debugging
      console.error(
        "Error adding student:",
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
      <DialogTitle>Add New Student</DialogTitle>{" "}
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
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default AddStudentModal;
