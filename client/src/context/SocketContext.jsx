import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Determine backend URL (default to localhost:5000 in dev)
    const backendUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_EXPRESS_URL || 'http://localhost:5000';
    
    // Initialize socket connection
    const newSocket = io(backendUrl, {
      withCredentials: true,
      autoConnect: true
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
