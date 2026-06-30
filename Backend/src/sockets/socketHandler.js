const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Middleware for Socket.io authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication error: Token is required'));
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user profile
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (!user.isActive) {
        return next(new Error('Authentication error: User is inactive'));
      }

      // Attach user details to socket instance
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication failed:', error.message);
      return next(new Error('Authentication error: Token is invalid or expired'));
    }
  });

  io.on('connection', (socket) => {
    const { name, role, id } = socket.user;
    console.log(`Connected client: ${name} (${role}) | Socket ID: ${socket.id}`);

    // 1. Join a personal room based on user ID for direct targeting (e.g. sending driver alerts)
    socket.join(`user_${id}`);

    // 2. Join role-based rooms
    if (role === 'admin') {
      socket.join('admin');
      console.log(`Socket ${socket.id} joined 'admin' room`);
    } else if (role === 'driver') {
      socket.join('drivers');
      console.log(`Socket ${socket.id} joined 'drivers' room`);
    }

    // 3. Client requests to join a booking room for real-time tracking (e.g., customer, driver, or admin)
    socket.on('join_booking', ({ bookingId }) => {
      if (!bookingId) return;
      socket.join(`booking_${bookingId}`);
      console.log(`Socket ${socket.id} joined room: booking_${bookingId}`);
      
      // Notify other members of the room that someone joined (optional)
      socket.to(`booking_${bookingId}`).emit('user_joined_tracking', {
        userId: id,
        name: name,
        role: role,
      });
    });

    // 4. Client requests to leave a booking room
    socket.on('leave_booking', ({ bookingId }) => {
      if (!bookingId) return;
      socket.leave(`booking_${bookingId}`);
      console.log(`Socket ${socket.id} left room: booking_${bookingId}`);
    });

    // 5. Driver updates live location for a specific active booking
    socket.on('update_location', ({ bookingId, coordinates }) => {
      if (!bookingId || !coordinates || !coordinates.lat || !coordinates.lng) {
        return socket.emit('error_message', { message: 'Invalid bookingId or coordinates' });
      }

      // Check if the sender is indeed a driver
      if (role !== 'driver') {
        return socket.emit('error_message', { message: 'Only drivers can broadcast location' });
      }

      console.log(`Driver ${name} location update for booking ${bookingId}: [Lat: ${coordinates.lat}, Lng: ${coordinates.lng}]`);

      // Broadcast the coordinates to all sockets listening in the specific booking room (customer + admin)
      socket.to(`booking_${bookingId}`).emit('location_updated', {
        bookingId,
        driverId: id,
        driverName: name,
        coordinates,
        updatedAt: new Date(),
      });
    });

    // 6. Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Disconnected client: ${name} (${role}) | Socket ID: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
