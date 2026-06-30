const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketHandler = require('./sockets/socketHandler');

// Set port
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for testing / development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Store io instance in express application so it can be accessed in controllers
app.set('socketio', io);

// Load Socket.io event handler
socketHandler(io);

// Start server
const activeServer = server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  activeServer.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception Error: ${err.message}`);
  // Close server & exit process
  activeServer.close(() => process.exit(1));
});
