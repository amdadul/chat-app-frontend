"use client";
import CallIcon from "@mui/icons-material/Call";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import { useEffect, useState } from "react";
import { getMessageOfFriends, uploadFilesToServer } from "../api/server-action";
import { useFriend } from "../context/FriendContext";
import { useScreen } from "../context/ScreenContext";
import { useSocket } from "../context/SocketContext";
import AudioCallScreen from "./AudioCallScreen";
import ChatBubble from "./ChatBubble";
import MessageInput from "./MessageInput";
import OnlineStatus from "./OnlineStatus";
import UserProfile from "./UserProfile";
import VideoCallScreen from "./VideoCallScreen";

export default function ChatWindow({ session }) {
  const socket = useSocket();
  const { selectedFriend } = useFriend();
  const { selectedScreen, setSelectedScreen } = useScreen();
  const [messages, setMessages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleSend = async (message) => {
    let fileUrls = [];
    if (selectedFiles.length > 0) {
      fileUrls = await uploadFiles(selectedFiles);
      setSelectedFiles([]); // Reset file state after upload
    }

    if (selectedFriend?.type == "group") {
      setMessages([
        ...messages,
        {
          text: message,
          fileUrls,
          sender: true,
          senderName: session?.user?.name,
          groupId: selectedFriend?.id,
          timestamp: new Date(),
          isRead: 0,
        },
      ]);
    } else {
      setMessages([
        ...messages,
        {
          text: message,
          fileUrls,
          sender: true,
          senderName: session?.user?.name,
          timestamp: new Date(),
          isRead: 0,
        },
      ]);
    }

    if (socket && selectedFriend) {
      const payload = {
        senderId: session?.user?.id,
        message, // The message content
        fileUrls,
      };

      if (selectedFriend?.type == "group") {
        // If it's a group message, include the groupId
        payload.groupId = selectedFriend?.id;
      } else {
        // If it's a private message, include the receiverId
        payload.receiverId = selectedFriend?.id;
      }

      socket.emit("sendP2PMessage", payload);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files); // Convert FileList to an array
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const uploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    try {
      const result = await uploadFilesToServer(formData);
      return result.fileUrls;
    } catch (error) {
      console.error("File upload failed:", error);
      return [];
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await getMessageOfFriends(
        session?.user?.id,
        selectedFriend?.type == "friend" ? selectedFriend?.id : "",
        selectedFriend?.type == "group" ? selectedFriend?.id : ""
      );

      const readData = {
        friendId: selectedFriend?.type === "friend" ? selectedFriend?.id : null,
        groupId: selectedFriend?.type === "group" ? selectedFriend?.id : null,
        readerId: session?.user?.id,
      };

      socket.emit("mark-as-read", readData);
      //const read = await readMessage(readData);

      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Call fetchMessages only when the selectedFriend or session changes
  useEffect(() => {
    if (selectedFriend && session?.user?.id) {
      fetchMessages();
    }
  }, [session?.user?.id, selectedFriend]);

  useEffect(() => {
    if (!socket || !selectedFriend) return;
    // Listen for the incoming message

    const readData = {
      friendId: selectedFriend?.type === "friend" ? selectedFriend?.id : null,
      groupId: selectedFriend?.type === "group" ? selectedFriend?.id : null,
      readerId: session?.user?.id,
    };

    const handlePrivateMessage = ({
      message,
      fileUrls,
      senderId,
      senderName,
      timestamp,
    }) => {
      const isSender = senderId === session?.user?._id;
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: message, fileUrls, sender: isSender, senderName, timestamp },
      ]);
      socket.emit("mark-as-read", readData);
    };

    const handleGroupMessage = ({
      message,
      fileUrls,
      senderId,
      senderName,
      groupId,
      timestamp,
      isRead,
    }) => {
      if (groupId !== selectedFriend?.id) return; // Ignore messages from other groups
      const isSender = senderId === session?.user?._id;
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: message,
          fileUrls,
          sender: isSender,
          senderName,
          groupId,
          timestamp,
          isRead,
        },
      ]);
      socket.emit("mark-as-read", readData);
    };

    const handleReadMessageUpdate = () => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          const isUnread = msg.isRead === 0;

          if (isUnread) {
            return { ...msg, isRead: true };
          }
          return msg;
        })
      );
    };

    socket.on("readMessageUpdate", (data) => {
      handleReadMessageUpdate();
    });
    socket.on("receiveMessage", handlePrivateMessage);
    socket.on("receiveGroupMessage", handleGroupMessage);

    return () => {
      socket.off("readMessageUpdate", handleReadMessageUpdate);
      socket.off("receiveMessage", handlePrivateMessage);
      socket.off("receiveGroupMessage", handleGroupMessage);
    };
  }, [socket, session, selectedFriend]);

  if (selectedScreen === "audio") {
    return (
      <AudioCallScreen
        onBack={() => setSelectedScreen("chat")}
        session={session}
        socket={socket}
      />
    );
  }

  if (selectedScreen === "video") {
    return (
      <VideoCallScreen
        onBack={() => setSelectedScreen("chat")}
        session={session}
        socket={socket}
      />
    );
  }

  if (selectedScreen === "profile") {
    return (
      <UserProfile session={session} onBack={() => setSelectedScreen("chat")} />
    );
  }

  return selectedFriend ? (
    <div className="w-3/4 h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={selectedFriend?.profilePicture} // Replace with actual contact image
            alt="Contact"
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <h1 className="font-semibold">{selectedFriend?.name}</h1>
            <OnlineStatus
              userId={selectedFriend?.id}
              session={session}
            ></OnlineStatus>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="hover:text-gray-200"
            onClick={() => setSelectedScreen("audio")}
            title="Start Audio Call"
          >
            <CallIcon />
          </button>
          <button
            className="hover:text-gray-200"
            onClick={() => setSelectedScreen("video")}
            title="Start Video Call"
          >
            <VideoCallIcon />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto">
        {messages && messages.length > 0 ? (
          messages.map((msg, idx) => (
            <ChatBubble
              key={idx}
              message={msg.text}
              fileUrls={msg.fileUrls}
              isSender={msg.sender}
              senderName={msg.senderName}
              status={msg.isRead == 1 ? "seen" : "sent"} // Options: "pending", "sent", "seen"
              time={msg.timestamp}
              lastMessage={idx === messages.length - 1}
            />
          ))
        ) : (
          <p>No messages yet.</p>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        onSend={handleSend}
      />
    </div>
  ) : (
    <div className="w-3/4 h-screen flex flex-col items-center justify-center space-y-4 relative z-10">
      {/* Glowing animated profile skeleton */}
      <div className="w-20 h-20 bg-gray-300 rounded-full shadow-lg border-2 border-gray-200 animate-pulse"></div>

      {/* Animated text skeletons */}
      <div className="w-36 h-5 bg-gray-300 rounded-md animate-pulse"></div>
      <div className="w-28 h-4 bg-gray-300 rounded-md animate-pulse"></div>

      {/* Fancy text */}
      <p className="text-gray-600 text-sm italic opacity-80">
        Select a friend to start chatting...
      </p>

      {/* Glowing dots animation */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-300"></div>
      </div>
    </div>
  );
}
