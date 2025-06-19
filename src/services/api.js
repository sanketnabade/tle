import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = {
  // Student endpoints
  getAllStudents: async () => {
    const response = await axios.get(`${API_BASE_URL}/students`);
    return response.data;
  },

  getStudent: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/students/${id}`);
    return response.data;
  },

  addStudent: async (studentData) => {
    const response = await axios.post(`${API_BASE_URL}/students`, studentData);
    return response.data;
  },

  updateStudent: async (id, studentData) => {
    const response = await axios.patch(`${API_BASE_URL}/students/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/students/${id}`);
    return response.data;
  },

  exportStudentsCSV: async () => {
    const response = await axios.get(`${API_BASE_URL}/students/export/csv`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Codeforces endpoints
  syncAllStudents: async () => {
    const response = await axios.get(`${API_BASE_URL}/codeforces/sync-all`);
    return response.data;
  },

  syncStudent: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/codeforces/sync/${id}`);
    return response.data;
  }
};

export default api;
