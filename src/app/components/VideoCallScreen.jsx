import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CallEndIcon from "@mui/icons-material/CallEnd";
import FlipCameraAndroidIcon from "@mui/icons-material/FlipCameraAndroid";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import { useScreen } from "../context/ScreenContext";

export default function VideoCallScreen({ onBack }) {
  const { setSelectedScreen } = useScreen();
  const endCall = () => {
    console.log("Ending video call...");
    onBack();
    setSelectedScreen("chat");
  };

  const toggleVideo = () => {
    console.log("Toggling video...");
  };

  const switchCamera = () => {
    console.log("Switching camera...");
  };

  return (
    <div className="w-3/4 h-screen flex flex-col items-center justify-center h-screen bg-black relative">
      {/* Back Button */}
      <button
        className="absolute top-4 left-4 z-50 bg-gray-300 rounded-full p-2 hover:bg-gray-400"
        onClick={onBack}
        title="Back to Chat"
      >
        <ArrowBackIcon />
      </button>

      {/* Video Stream */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        <p className="text-gray-500 text-center">Video stream placeholder</p>
      </div>

      {/* Self View */}
      <div className="absolute bottom-4 right-4 w-24 h-32 bg-gray-700 rounded-md overflow-hidden">
        <p className="text-gray-400 text-center">Self-view placeholder</p>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-8 w-full flex justify-center space-x-8">
        <button
          className="p-4 bg-gray-300 rounded-full text-gray-700 hover:bg-gray-400"
          onClick={toggleVideo}
          title="Toggle Video"
        >
          <VideocamOffIcon />
        </button>
        <button
          className="p-4 bg-red-500 rounded-full text-white hover:bg-red-600"
          onClick={endCall}
          title="End Call"
        >
          <CallEndIcon />
        </button>
        <button
          className="p-4 bg-gray-300 rounded-full text-gray-700 hover:bg-gray-400"
          onClick={switchCamera}
          title="Switch Camera"
        >
          <FlipCameraAndroidIcon />
        </button>
      </div>
    </div>
  );
}
