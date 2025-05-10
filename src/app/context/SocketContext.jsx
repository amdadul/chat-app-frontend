"use client"; // Ensure this runs only on the client-side

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children, session }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("https://chatapi.motionsoft.com.bd/"); // Replace with your WebSocket server URL
    //const newSocket = io("http://localhost:3011/");
    //const newSocket = io("http://192.168.88.249:3011/");
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [session?.user?.id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
