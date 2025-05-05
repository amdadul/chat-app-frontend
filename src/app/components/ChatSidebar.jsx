"use client";

import CallIcon from "@mui/icons-material/Call";
import ChatIcon from "@mui/icons-material/Chat";
import ContactsIcon from "@mui/icons-material/Contacts";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsIcon from "@mui/icons-material/Settings";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllFriendsAndGroup } from "../api/server-action";
import { useFriend } from "../context/FriendContext";
import { useScreen } from "../context/ScreenContext";
import { useSocket } from "../context/SocketContext";
import CallScreen from "./CallScreen";
import ContactScreen from "./ContactScreen";
import CreateGroupPopup from "./CreateGroupPopup";
import OnlineStatus from "./OnlineStatus";
import SettingsScreen from "./SettingsScreen";

export default function ChatSidebar({ onSelect, session }) {
  const socket = useSocket();
  const { selectedFriend, setSelectedFriend } = useFriend();
  const { setSelectedScreen } = useScreen();
  const [activeTab, setActiveTab] = useState("Chats");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const handleOpenPopup = () => setOpen(true);
  const handleClosePopup = () => setOpen(false);

  const playNotificationSound = () => {
    const audio = new Audio("/sounds/notification4.wav"); // Adjust path as needed
    audio.play().catch((err) => {
      console.warn("Autoplay failed:", err);
    });
  };

  useEffect(() => {
    if (!socket || !session?.user?.id) return;
    socket.emit("userOnline", session?.user?.id);

    const fetchFriends = async () => {
      try {
        const data = await getAllFriendsAndGroup();
        setFriends(data?.conversations);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const handleMessageUpdate = () => {
      fetchFriends(); // Refresh chat list with updated lastMessage and unread status
    };

    const playNotification = () => {
      playNotificationSound();
    };

    socket.on("messageUpdate", handleMessageUpdate);
    socket.on("playNotification", playNotification);

    fetchFriends();

    return () => {
      socket.off("messageUpdate", handleMessageUpdate);
      socket.off("playNotification", playNotification);
    };
  }, [session?.user?.id, socket]); // Empty dependency array = runs once on mount

  const renderContent = () => {
    switch (activeTab) {
      case "Calls":
        return <CallScreen session={session} />;
      case "Contacts":
        return <ContactScreen session={session} />;
      case "Settings":
        return <SettingsScreen session={session} />;
      default:
        return (
          <div className="p-2 space-y-2">
            {friends && friends.length > 0
              ? friends.map((friend, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all duration-300 
            ${
              selectedFriend?.id === friend?.id
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md scale-100"
                : "bg-white hover:bg-blue-100"
            }`}
                    onClick={() => {
                      setSelectedFriend(friend);
                      setSelectedScreen("chat");
                    }}
                  >
                    {/* Left Side: Friend Name & Last Message */}
                    <div>
                      <h2 className="font-medium text-sm">
                        {friend?.name}

                        {friend?.unreadCount > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {friend?.unreadCount}
                          </span>
                        )}
                        {friend?.type === "group" && (
                          <span className="ml-2 text-xs bg-green-500 text-white font-bold px-2 py-0.5 rounded-full">
                            Group
                          </span>
                        )}
                      </h2>
                      <p
                        className={`text-xs transition-all duration-200 
                ${
                  selectedFriend?.id === friend?.id
                    ? "text-gray-200"
                    : "text-gray-600"
                }`}
                      >
                        {friend?.lastMessage == ""
                          ? "File attached..."
                          : friend?.lastMessage}
                      </p>
                    </div>

                    {/* Right Side: Online Status */}
                    <OnlineStatus
                      userId={friend?.id}
                      type={friend?.type}
                      session={session}
                    />
                  </div>
                ))
              : ""}
          </div>
        );
    }
  };

  return (
    <div className="w-1/4 bg-gray-100 border-r h-screen flex flex-col">
      {/* Profile Section */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={session?.user?.profilePicture} // Replace with actual profile image
            alt="Profile"
            className="w-10 h-10 rounded-full mr-3"
          />
          <span className="font-semibold">{session?.user?.name}</span>
        </div>
        <div className="relative">
          <button
            className="text-gray-600 hover:text-black"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <MoreVertIcon />
          </button>

          {dropdownOpen && (
            <div className="absolute top-8 right-1 w-40 bg-white shadow-lg rounded-md">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                onClick={() => {
                  handleOpenPopup();
                  setDropdownOpen(false);
                }}
              >
                Create Group
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                onClick={() => {
                  setSelectedScreen("profile");
                  setDropdownOpen(false);
                }}
              >
                Profile
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateGroupPopup
        open={open}
        onClose={handleClosePopup}
        session={session}
      />

      <div className="flex justify-around border-b bg-white p-2">
        <button
          className={`p-2 rounded-lg ${
            activeTab === "Chats" ? "bg-blue-500 text-white" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("Chats")}
        >
          <ChatIcon />
        </button>
        <button
          className={`p-2 rounded-lg ${
            activeTab === "Calls" ? "bg-blue-500 text-white" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("Calls")}
        >
          <CallIcon />
        </button>
        <button
          className={`p-2 rounded-lg ${
            activeTab === "Contacts"
              ? "bg-blue-500 text-white"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("Contacts")}
        >
          <ContactsIcon />
        </button>
        <button
          className={`p-2 rounded-lg ${
            activeTab === "Settings"
              ? "bg-blue-500 text-white"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("Settings")}
        >
          <SettingsIcon />
        </button>
      </div>
      <div className="overflow-y-auto">{renderContent()}</div>
    </div>
  );
}
