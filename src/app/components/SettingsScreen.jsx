import DarkModeIcon from "@mui/icons-material/DarkMode";
import ExitToAppIcon from "@mui/icons-material/ExitToApp"; // For logout icon
import LockIcon from "@mui/icons-material/Lock";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { doLogout } from "../api/server-action";
import { useSocket } from "../context/SocketContext";

export default function SettingsScreen({ session }) {
  const socket = useSocket();

  const handleLogout = async () => {
    try {
      socket.disconnect();
      await doLogout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Settings</h2>
      <div className="mt-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Notifications</span>
          <NotificationsIcon className="text-blue-500" />
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Privacy</span>
          <LockIcon className="text-blue-500" />
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Theme</span>
          <DarkModeIcon className="text-blue-500" />
        </div>
        {/* Logout Option */}
        <div className="flex justify-between items-center mt-4">
          <span className="font-medium text-red-500">Logout</span>
          <ExitToAppIcon
            className="text-red-500 cursor-pointer"
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
}
