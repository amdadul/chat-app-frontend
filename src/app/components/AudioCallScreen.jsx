import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { useScreen } from "../context/ScreenContext";

export default function AudioCallScreen({ onBack }) {
  const { setSelectedScreen } = useScreen();
  const endCall = () => {
    console.log("Ending call...");
    onBack();
    setSelectedScreen("chat");
  };

  const toggleMute = () => {
    console.log("Toggling mute...");
  };

  const toggleSpeaker = () => {
    console.log("Toggling speaker...");
  };

  return (
    <div className="w-3/4 h-screen flex flex-col items-center justify-center h-screen bg-blue-100 relative">
      {/* Back Button */}
      <button
        className="absolute top-4 left-4 bg-gray-300 rounded-full p-2 hover:bg-gray-400"
        onClick={onBack}
        title="Back to Chat"
      >
        <ArrowBackIcon />
      </button>

      {/* Profile and Call Info */}
      <div className="text-center mb-8">
        <img
          src="https://via.placeholder.com/150"
          alt="Contact"
          className="w-36 h-36 rounded-full mb-4 mx-auto"
        />
        <h2 className="text-2xl font-bold text-gray-800">John Doe</h2>
        <p className="text-gray-500">Calling...</p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-8 mt-12">
        <button
          className="p-4 bg-gray-300 rounded-full text-gray-700 hover:bg-gray-400"
          onClick={toggleMute}
          title="Mute/Unmute"
        >
          <MicOffIcon />
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
          onClick={toggleSpeaker}
          title="Speaker"
        >
          <VolumeUpIcon />
        </button>
      </div>
    </div>
  );
}
