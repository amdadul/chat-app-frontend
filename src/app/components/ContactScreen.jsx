import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import {
  acceptFriend,
  addFriend,
  getAllUsers,
  getFriendRequests,
} from "../api/server-action";
import { useFriend } from "../context/FriendContext";
import Toast from "./Toast";

export default function ContactScreen({ session }) {
  const { selectedFriend, setSelectedFriend } = useFriend();
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (type, message) => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFriendRequest = async () => {
      try {
        const data = await getFriendRequests();
        setFriendRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
    fetchFriendRequest();
  }, [session?.user?.id]);

  const handleAddFriend = async (friendId) => {
    setLoading((prev) => ({ ...prev, [friendId]: true }));
    try {
      const result = await addFriend(friendId);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === friendId ? { ...user, isFriend: true } : user
        )
      );
      showToast("success", result.message);
    } catch (error) {
      showToast("error", `Error accepting friend request: ${error}`);
    }
    setLoading((prev) => ({ ...prev, [friendId]: false }));
  };

  const handleAcceptRequest = async (friendId) => {
    setLoading((prev) => ({ ...prev, [friendId]: true }));
    try {
      const res = await acceptFriend(friendId);
      setFriendRequests((prevRequests) =>
        prevRequests.filter((request) => request?.friendId?._id !== friendId)
      );
      showToast("success", res.message);
    } catch (error) {
      showToast("error", `Error accepting friend request: ${error}`);
    }
    setLoading((prev) => ({ ...prev, [friendId]: false }));
  };

  const handleFriendSelect = (user) => {
    setSelectedFriend({
      type: "friend",
      id: user?._id,
      name: user?.name,
      lastMessage: "",
      lastMessageTime: "",
    });
  };

  return (
    <>
      {friendRequests.length > 0 ? (
        <div className="p-4">
          <h2 className="text-xl font-bold">Friend Requests</h2>
          <div className="mt-4">
            {friendRequests.map((rFriend, idx) => (
              <div
                key={idx}
                className="p-2 border-b flex justify-between items-center"
              >
                <h3 className="font-medium">{rFriend?.friendId?.name}</h3>
                <button
                  className="text-blue-500"
                  onClick={() => handleAcceptRequest(rFriend?.friendId?._id)}
                  disabled={loading[rFriend?.friendId?._id]}
                >
                  {loading[rFriend?.friendId?._id] ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Accept"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        ""
      )}
      <div className="p-4">
        <h2 className="text-xl font-bold">Contacts</h2>
        <div className="mt-4">
          {users.map((user, idx) => (
            <div
              key={idx}
              className={`p-2 border-b flex justify-between items-center cursor-pointer ${
                selectedFriend?.id === user?._id ? "bg-blue-100" : ""
              }`}
              onClick={
                user?.isFriend ? () => handleFriendSelect(user) : undefined
              }
            >
              <h3 className="font-medium">{user?.name}</h3>
              {!user?.isFriend ? (
                <button
                  className="text-blue-500"
                  onClick={() => handleAddFriend(user._id)}
                  disabled={loading[user._id]}
                >
                  {loading[user._id] ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PersonAddIcon />
                  )}
                </button>
              ) : (
                ""
              )}
            </div>
          ))}
        </div>
      </div>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false })}
        />
      )}
    </>
  );
}
