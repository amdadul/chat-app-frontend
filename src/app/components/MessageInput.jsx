"use client";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import { useEffect, useRef, useState } from "react";
import EmojiPickerComponent from "./EmojiPicker";

export default function MessageInput({
  selectedFiles,
  setSelectedFiles,
  onSend,
}) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const mediaStream = useRef(null);

  const audioContext = useRef(null);
  const analyserNode = useRef(null);
  const dataArray = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (audioContext.current) return; // Avoid reinitializing

    audioContext.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    analyserNode.current = audioContext.current.createAnalyser();
    analyserNode.current.fftSize = 256; // Increase for finer detail in the waveform
    dataArray.current = new Uint8Array(analyserNode.current.frequencyBinCount);

    console.log("AudioContext and AnalyserNode initialized.");
  }, []);

  useEffect(() => {
    if (isRecording) {
      drawWaveform(); // Start drawing when recording begins
    } else {
      // Stop drawing if recording is stopped
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isRecording]);

  const handleSend = () => {
    if (message.trim() || selectedFiles.length > 0) {
      onSend(message, selectedFiles); // Send both message and files
      setMessage(""); // Clear the message input after sending
      //setSelectedFiles([]); // Clear selected files after sending
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files); // Convert FileList to an array
    if (files.length > 0) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
    }
  };

  const handleFileRemove = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);

      // Connect audio stream to analyser node
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyserNode.current);

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const audioFile = new File(
          [audioBlob],
          `recording-${Date.now()}.webm`,
          {
            type: "audio/webm",
          }
        );
        addFile(audioFile);
        audioChunks.current = [];
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }

    // Stop media stream tracks
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
    }

    // Set the recording state to false
    setIsRecording(false);
    mediaStream.current = null;

    // Stop the waveform drawing
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas after stopping recording
    }
  };

  const addFile = (file) => {
    setSelectedFiles((prevFiles) => [...prevFiles, file]);
  };

  const drawWaveform = () => {
    console.log(isRecording);
    if (isRecording) {
      analyserNode.current.getByteFrequencyData(dataArray.current);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth =
        (canvas.width / analyserNode.current.frequencyBinCount) * 2.5;
      let x = 0;

      for (let i = 0; i < analyserNode.current.frequencyBinCount; i++) {
        const barHeight = dataArray.current[i];
        ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
      }

      requestAnimationFrame(drawWaveform); // Keep drawing
    }
  };

  return (
    <div className="p-4 border-t bg-white flex flex-col relative">
      {/* Show selected files at the top */}
      {selectedFiles.length > 0 && (
        <div className="flex space-x-2 mb-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="bg-gray-200 p-2 rounded flex items-center"
            >
              <span className="text-sm">{file.name}</span>
              <button
                className="ml-2 text-red-500"
                onClick={() => handleFileRemove(index)}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input area: emoji picker, file attachment, input field, voice recording, send button */}
      <div className="flex items-center space-x-2 w-full">
        {/* Emoji picker toggle */}
        {showEmojiPicker && (
          <EmojiPickerComponent onEmojiClick={handleEmojiClick} />
        )}
        <button
          className="text-gray-600 hover:text-black"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        >
          <EmojiEmotionsIcon />
        </button>

        {/* File attachment */}
        <label className="text-gray-600 hover:text-black cursor-pointer">
          <AttachFileIcon />
          <input
            type="file"
            className="hidden"
            multiple
            onChange={handleFileSelect}
          />
        </label>

        {/* Message input */}
        {/* Canvas inside the input */}
        {isRecording ? (
          <canvas
            ref={canvasRef}
            height="13"
            className="flex-grow border rounded-lg pointer-events-none"
          ></canvas>
        ) : (
          <input
            type="text"
            className="flex-grow border rounded-lg p-2 focus:outline-none"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        )}

        {/* Voice recording */}
        <button
          className="text-gray-600 hover:text-black"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? <StopCircleIcon /> : <MicIcon />}
        </button>

        {/* Send button */}
        <button
          className="bg-blue-500 text-white p-2 rounded-lg"
          onClick={handleSend}
          disabled={!message.trim() && selectedFiles.length === 0} // Disable if no message or files
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
