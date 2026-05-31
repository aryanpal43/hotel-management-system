import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to the Express server
      const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const newSocket = io(socketUrl, {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        console.log('[Socket] Connected to server.');
        
        // Scope communication
        if (user.roles.includes('SUPER_ADMIN')) {
          newSocket.emit('join_admin_channel');
        } else if (user.hotelId) {
          newSocket.emit('join_hotel_channel', user.hotelId);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        console.log('[Socket] Disconnected.');
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
