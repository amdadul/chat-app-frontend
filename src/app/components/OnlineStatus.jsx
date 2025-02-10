"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function OnlineStatus({ userId, type, session }) {
  const socket = useSocket();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineGroups, setOnlineGroups] = useState([]);

  useEffect(() => {
    // Listen for the updated online users list
    socket.emit("userOnline", session?.user?.id);
    socket.on("allOnlineUsers", (users) => {
      setOnlineUsers(users); // Set the full list of online users
    });
    socket.on("allOnlineGroups", (users) => {
      setOnlineGroups(users); // Set the full list of online users
    });

    // Listen for status updates
    socket.on("updateOnlineStatus", ({ userId: updatedUserId, status }) => {
      if (status) {
        setOnlineUsers((prev) =>
          status
            ? [...new Set([...prev, updatedUserId])] // Ensure no duplicates
            : prev.filter((user) => user !== updatedUserId)
        ); // Add user to online list
      } else {
        setOnlineUsers((prev) => prev.filter((user) => user !== updatedUserId)); // Remove user from online list
      }
    });

    socket.on(
      "updateGroupOnlineStatus",
      ({ groupId: updatedGroupId, status }) => {
        if (status) {
          setOnlineGroups((prev) =>
            status
              ? [...new Set([...prev, updatedGroupId])] // Ensure no duplicates
              : prev.filter((user) => user !== updatedGroupId)
          ); // Add user to online list
        } else {
          setOnlineGroups((prev) =>
            prev.filter((user) => user !== updatedGroupId)
          ); // Remove user from online list
        }
      }
    );

    // Cleanup on unmount
    return () => {
      //socket.off("allOnlineUsers");
      //socket.off("updateOnlineStatus");
    };
  }, [userId, socket, session]);

  return (
    <div
      className={`w-2 h-2 rounded-full ${
        (
          type == "group"
            ? onlineGroups.includes(userId)
            : onlineUsers.includes(userId)
        )
          ? "bg-green-500 animate-pulse"
          : "bg-gray-400"
      }`}
    ></div>
  );
}
