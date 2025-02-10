"use client";
import { createContext, useContext, useState } from "react";

// Create context
const ScreenContext = createContext();

// Provide context
export const ScreenProvider = ({ children }) => {
  const [selectedScreen, setSelectedScreen] = useState("chat");

  return (
    <ScreenContext.Provider value={{ selectedScreen, setSelectedScreen }}>
      {children}
    </ScreenContext.Provider>
  );
};

// Custom hook for easy usage
export const useScreen = () => useContext(ScreenContext);
