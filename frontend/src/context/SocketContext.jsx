import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // If no user is logged in, disconnect any existing socket
    if (!user) {
      setSocket((prev) => {
        if (prev) {
          prev.disconnect();
        }
        return null;
      });
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      // Join user-specific private room for targeted notifications
      newSocket.emit('join_room', user.id || user._id);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('⚠️  Socket connection error:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempt(s)`);
      // Re-join room on reconnect
      newSocket.emit('join_room', user.id || user._id);
    });

    setSocket(newSocket);

    // Cleanup: disconnect socket on user logout or component unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]); // Re-run only when user ID changes (not entire user object)

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
