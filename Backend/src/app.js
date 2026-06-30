const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Route files
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const tankerRoutes = require('./routes/tankerRoutes');
const driverRoutes = require('./routes/driverRoutes');

// Error middleware
const errorHandler = require('./middleware/errorMiddleware');

// Initialize express app
const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Water Tanker Booking Platform API is healthy and running',
    timestamp: new Date(),
  });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tankers', tankerRoutes);
app.use('/api/drivers', driverRoutes);

// Catch 404 Route Not Found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found - Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler middleware
app.use(errorHandler);

module.exports = app;
