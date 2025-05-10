"use client";
import { createContext, useContext, useState } from "react";

// Create context
const ScreenContext = createContext();

// Provide context
export const ScreenProvider = ({ children }) => {
  const [selectedScreen, setSelectedScreen] = useState("chat");
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [callType, setCallType] = useState("audio");

  return (
    <ScreenContext.Provider
      value={{
        selectedScreen,
        setSelectedScreen,
        incomingCall,
        setIncomingCall,
        callStatus,
        setCallStatus,
        callType,
        setCallType,
      }}
    >
      {children}
    </ScreenContext.Provider>
  );
};

// Custom hook for easy usage
export const useScreen = () => useContext(ScreenContext);
