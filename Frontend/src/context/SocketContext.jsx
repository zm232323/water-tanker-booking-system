import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let activeSocket = null;
    const token = localStorage.getItem('water_tanker_token');

    if (user && token) {
      // Connect to Socket.io backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      activeSocket = io(backendUrl, {
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      activeSocket.on('connect', () => {
        console.log('Socket.io connected successfully. User room established.');
      });

      activeSocket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error.message);
      });

      setSocket(activeSocket);
    } else {
      // If user logs out, disconnect socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      if (activeSocket) {
        activeSocket.disconnect();
      }
    };
  }, [user]);

  // Join a booking room for tracking
  const joinBookingRoom = (bookingId) => {
    if (socket) {
      socket.emit('join_booking', { bookingId });
    }
  };

  // Leave a booking room
  const leaveBookingRoom = (bookingId) => {
    if (socket) {
      socket.emit('leave_booking', { bookingId });
    }
  };

  // Driver sends live location coordinates update
  const emitLocationUpdate = (bookingId, coordinates) => {
    if (socket) {
      socket.emit('update_location', { bookingId, coordinates });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        joinBookingRoom,
        leaveBookingRoom,
        emitLocationUpdate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
