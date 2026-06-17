const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// Rate limiting — general API
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
}));

// Stricter limit for auth routes (prevent brute-force)
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' },
}));

app.use(cors({
  origin: [
    /^http:\/\/localhost(:\d+)?$/,
    'https://careerdock-eight.vercel.app',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/rounds',       require('./routes/roundRoutes'));
app.use('/api/tracker',      require('./routes/trackerRoutes'));
app.use('/api/resumes',      require('./routes/resumeRoutes'));
app.use('/api/tasks',        require('./routes/taskRoutes'));
app.use('/api/planner',      require('./routes/plannerRoutes'));
app.use('/api/dashboard',    require('./routes/dashboardRoutes'));
app.use('/api/chat',         require('./routes/chatRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong. Please try again.' });
});

module.exports = app;
