import {
  Close,
  Done,
  DoneAll,
  HourglassEmpty,
  ZoomIn,
  ZoomOut,
} from "@mui/icons-material"; // Material UI Icons
import moment from "moment"; // Formatting timestamps
import { useEffect, useRef, useState } from "react";
import { useFriend } from "../context/FriendContext";
import AudioPlayer from "./AudioPlayer";

export default function ChatBubble({
  message,
  fileUrls,
  isSender,
  senderName,
  status,
  time,
  lastMessage,
}) {
  const { selectedFriend } = useFriend();
  const messageEndRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [scale, setScale] = useState(1); // Zoom level
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Drag position
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const formattedTime = moment(time);
  let displayTime;

  if (formattedTime.isSame(moment(), "day")) {
    displayTime = formattedTime.format("h:mm A");
  } else if (formattedTime.isSame(moment().subtract(1, "days"), "day")) {
    displayTime = `Yesterday, ${formattedTime.format("h:mm A")}`;
  } else {
    displayTime = formattedTime.format("MMM D, YYYY, h:mm A");
  }

  // Auto-scroll to the latest message
  useEffect(() => {
    if (messageEndRef.current && lastMessage) {
      const parent = messageEndRef.current.parentElement;
      if (parent) {
        parent.scrollTop = parent.scrollHeight; // Instantly move to bottom
      }
    }
  }, [lastMessage]);

  const closePreview = () => {
    setPreviewImage(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle drag/pan
  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <div
      ref={messageEndRef}
      className={`flex ${isSender ? "justify-end" : "justify-start"} mb-2`}
    >
      <div className="flex flex-col max-w-xs">
        {/* Show sender name for received messages */}
        {!isSender && senderName && selectedFriend?.type === "group" && (
          <span className="text-sm text-gray-500 font-medium mb-1">
            {senderName}
          </span>
        )}

        <div
          className={`relative p-3 rounded-lg shadow-md ${
            isSender ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
          }`}
        >
          {message}

          {/* Display attached files (Including Audio Files) */}
          {fileUrls && fileUrls.length > 0 && (
            <div className="flex gap-1 mt-2">
              {fileUrls.map((fileUrl, index) => {
                const fileExtension = fileUrl.split(".").pop().toLowerCase();
                const isAudio = [
                  "mp3",
                  "wav",
                  "ogg",
                  "m4a",
                  "webm",
                  "aac",
                ].includes(fileExtension);
                const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
                  fileExtension
                );

                return (
                  <div key={index} className="w-full">
                    {isImage ? (
                      <div className=" bg-white p-2 rounded-lg">
                        <img
                          src={fileUrl}
                          alt="Uploaded file"
                          className="w-full h-32 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                          onClick={() => setPreviewImage(fileUrl)}
                        />
                      </div>
                    ) : isAudio ? (
                      // Show audio player for audio files
                      <AudioPlayer audioSrc={fileUrl} />
                    ) : (
                      // Show file link for other file types
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 rounded-md border border-gray-300 bg-white text-blue-500 text-sm"
                      >
                        📄{fileUrl.split("/").pop()} {/* Show filename */}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Message Status Icon (Only for Sent Messages) */}
          {isSender && (
            <div className="absolute bottom-1 right-2 flex items-center">
              {status === "pending" ? (
                <HourglassEmpty fontSize="small" className="text-yellow-400" />
              ) : status === "sent" ? (
                <Done fontSize="small" className="text-gray-300" />
              ) : status === "seen" ? (
                <DoneAll fontSize="small" className="text-green-500" />
              ) : null}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-400 mt-1">{displayTime}</span>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="relative w-full h-full flex flex-col items-center ">
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-600 hover:text-black z-50 pointer-events-auto"
              onClick={closePreview}
            >
              <Close fontSize="medium" />
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-3 left-3 flex space-x-2 z-50 pointer-events-auto">
              <button
                className="bg-white p-2 rounded-full shadow-md text-gray-600 hover:text-black"
                onClick={() => setScale((prev) => Math.min(prev + 0.2, 3))}
              >
                <ZoomIn fontSize="medium" />
              </button>
              <button
                className="bg-white p-2 rounded-full shadow-md text-gray-600 hover:text-black"
                onClick={() => setScale((prev) => Math.max(prev - 0.2, 1))}
              >
                <ZoomOut fontSize="medium" />
              </button>
            </div>

            {/* Image (Draggable & Zoomable) */}
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={previewImage}
                alt="Preview"
                className="transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  cursor: dragging ? "grabbing" : "grab",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
