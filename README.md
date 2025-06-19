# Student Progress Management System

A comprehensive web application for tracking and managing student progress in competitive programming, specifically focusing on Codeforces performance.

demo-<video controls src="https://drive.google.com/file/d/1uFmkaRyB8U73-x_cJC0gp9Cj-9TqBnzs/view?usp=sharing" title="Title"></video>

## Features

- **Student Management**: Add, edit, and manage student profiles
- **Codeforces Integration**: Automatically track students' Codeforces ratings and contest performance
- **Performance Analytics**: Monitor problem-solving statistics and rating progression
- **Automated Notifications**: Email reminders for inactive students
- **Real-time Updates**: Daily synchronization with Codeforces data

## Tech Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Additional Tools**: 
  - Node-cron for scheduled tasks
  - Nodemailer for email notifications
  - Chart.js for data visualization

## Project Structure

In the project directory, you can run:

```
client/          # React frontend application
├── public/      # Static files
└── src/         # Source files
    ├── components/  # React components
    └── services/   # API services

server/         # Node.js backend application
├── config/     # Database configuration
├── middleware/ # Express middleware
├── models/     # Mongoose models
└── routes/     # API routes
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail account (for email notifications)

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd student-progress-management
   ```

2. Install dependencies:
   ```bash
   npm run install-all
   ```

## Usage

1. Start the application:
   ```bash
   npm start
   ```
   This will start both the frontend and backend servers concurrently.

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Endpoints

### Students

- `GET /api/students` - Get all students
- `POST /api/students` - Create a new student
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Codeforces

- `GET /api/codeforces/user/:handle` - Get Codeforces user info
- `GET /api/codeforces/contests/:handle` - Get user's contest history

## Automated Tasks

The system includes two automated cron jobs:

1. **Daily Codeforces Data Sync** (Runs at 2 AM)
   - Updates students' current and maximum ratings
   - Synchronizes with Codeforces API

2. **Inactivity Check** (Runs at 3 AM)
   - Checks for students inactive for 7+ days
   - Sends email reminders to inactive students

## Data Models

### Student Schema

```javascript
{
  name: String,               // Student's full name
  email: String,             // Unique email address
  phoneNumber: String,       // Contact number
  codeforcesHandle: String,  // Unique Codeforces username
  currentRating: Number,     // Current Codeforces rating
  maxRating: Number,         // Maximum rating achieved
  lastSync: Date,           // Last data sync timestamp
  disableEmailReminders: Boolean,  // Email notification preference
  reminderEmailsSent: Number,      // Count of reminders sent
  contestHistory: [{               // Contest participation details
    contestId: String,
    contestName: String,
    rank: Number,
    ratingChange: Number,
    newRating: Number,
    date: Date
  }],
  problemSolvingStats: {          // Problem-solving statistics
    totalSolved: Number,
    averageRating: Number,
    ratingWiseSolved: Map,        // Problems solved by difficulty
    submissionDates: [Date]
  }
}
```

