"use client";
import { createContext, useContext, useState } from "react";

// Create context
const FriendContext = createContext();

// Provide context
export const FriendProvider = ({ children }) => {
  const [selectedFriend, setSelectedFriend] = useState(null);

  return (
    <FriendContext.Provider value={{ selectedFriend, setSelectedFriend }}>
      {children}
    </FriendContext.Provider>
  );
};

// Custom hook for easy usage
export const useFriend = () => useContext(FriendContext);
