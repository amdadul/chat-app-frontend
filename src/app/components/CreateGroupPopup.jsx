import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { addGroup, getAllUsers } from "../api/server-action";
import Toast from "./Toast";

export default function CreateGroupPopup({ open, onClose, session }) {
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (type, message) => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const data = await getAllUsers();
        const acceptedFriends = data.filter((user) => user.isFriend);
        setFriends(acceptedFriends);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  const handleCheckboxChange = (event, friendId) => {
    if (event.target.checked) {
      setSelectedFriends((prev) => [...prev, friendId]);
    } else {
      setSelectedFriends((prev) => prev.filter((id) => id !== friendId));
    }
  };

  const handleCreateGroup = async () => {
    setLoading(true);
    try {
      const res = await addGroup(groupName, session?.user?.id, selectedFriends);
      showToast("success", res.message);
      onClose(); // Close the popup on success
    } catch (err) {
      setError(err.message);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New Group</DialogTitle>
      <DialogContent>
        <TextField
          label="Group Name"
          fullWidth
          variant="outlined"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <div className="mt-4">
          <h3>Pick Friends</h3>
          {loading ? (
            <CircularProgress />
          ) : (
            <div>
              {friends.map((friend) => (
                <FormControlLabel
                  key={friend._id}
                  control={
                    <Checkbox
                      checked={selectedFriends.includes(friend._id)}
                      onChange={(e) => handleCheckboxChange(e, friend._id)}
                      name={friend.name}
                    />
                  }
                  label={friend.name}
                />
              ))}
            </div>
          )}
        </div>
        {error && <div className="text-red-500">{error}</div>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleCreateGroup}
          color="primary"
          disabled={loading || !groupName || selectedFriends.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : "Create"}
        </Button>
      </DialogActions>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false })}
        />
      )}
    </Dialog>
  );
}
