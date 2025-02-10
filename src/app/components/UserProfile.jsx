"use client";

import { useState } from "react";
import { updateProfile, uploadSingleFilesToServer } from "../api/server-action";

export default function UserProfile({ session, onBack }) {
  const [name, setName] = useState(session?.user?.name ?? "");
  const [profilePic, setProfilePic] = useState(
    session?.user?.profilePicture ?? null
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [email, setEmail] = useState(session?.user?.email ?? "");

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
    }
  };

  const handleSave = async () => {
    let profilePicture = "";
    if (selectedFile) {
      profilePicture = await uploadFiles(selectedFile);
      setSelectedFile(null); // Reset file state after upload
    }
    const result = await updateProfile(name, email, profilePicture);

    if (result?.success) {
      // Update session with new user data if needed
    }

    console.log("Saving profile:", { result });
  };

  const uploadFiles = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await uploadSingleFilesToServer(formData);
      return result.fileUrl;
    } catch (error) {
      console.error("File upload failed:", error);
      return "";
    }
  };

  return (
    <div className="w-3/4 h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={session?.user?.profilePicture} // Replace with actual contact image
            alt="Contact"
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <h1 className="font-semibold">
              {session?.user?.name} Edit Profile
            </h1>
          </div>
        </div>
      </div>

      <div className=" flex flex-col justify-center items-center w-1/2">
        <div className="flex justify-center mb-6">
          <img
            src={profilePic || session?.user?.profilePicture}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
        </div>

        {/* File Upload */}
        <div className="flex justify-center mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="text-sm text-gray-500 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:cursor-pointer"
          />
        </div>

        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email Input */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Save Button */}
        <button
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          onClick={handleSave}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
