import CallIcon from "@mui/icons-material/Call";
import VideoCallIcon from "@mui/icons-material/Videocam";

export default function CallScreen({ session }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Calls</h2>
      <div className="mt-4">
        {["John Doe", "Jane Smith"].map((contact, idx) => (
          <div
            key={idx}
            className="p-2 border-b flex justify-between items-center"
          >
            <div>
              <h3 className="font-medium">{contact}</h3>
              <p className="text-sm text-gray-600">Yesterday</p>
            </div>
            <button className="text-blue-500">
              <CallIcon />
            </button>
            <button className="text-blue-500">
              <VideoCallIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
