export default function ProfileView() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Profile</h2>
      <img
        src="/profile.jpg"
        alt="Profile"
        className="w-32 h-32 rounded-full mx-auto mb-4"
      />
      <div className="text-center">
        <h3 className="text-lg font-medium">Your Name</h3>
        <p className="text-gray-600">your.email@example.com</p>
      </div>
      <button className="mt-4 bg-blue-500 text-white p-2 rounded-lg w-full">
        Add Friend
      </button>
    </div>
  );
}
