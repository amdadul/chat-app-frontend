export default function AddFriendModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-1/3">
        <h2 className="text-xl font-bold mb-4">Add Friend</h2>
        <input
          type="text"
          placeholder="Enter email or phone number"
          className="w-full p-2 border rounded-lg mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            className="bg-gray-500 text-white p-2 rounded-lg"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="bg-blue-500 text-white p-2 rounded-lg">Add</button>
        </div>
      </div>
    </div>
  );
}
