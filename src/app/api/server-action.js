"use server";

import { signIn, signOut } from "@/auth";
import {
  apiRequestWithServer,
  fileUploadWithServer,
} from "./apiRequestWithServer";

export const doCredentialLogin = async (formData) => {
  try {
    const response = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });
    return response;
  } catch (err) {
    throw err;
  }
};

export const doLogout = async () => {
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/logout`
  );
  console.log(result);

  await signOut({
    redirectTo: `/login`,
  });
};

export const updateProfile = async (name, email, profilePicture) => {
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/update`,
    "PUT",
    { name, email, profilePicture }
  );
  return result;
};

export const getAllFriends = async () => {
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/friends`
  );
  return result;
};

export const getAllFriendsAndGroup = async () => {
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/friends-and-groups`
  );
  return result;
};

export const getMessageOfFriends = async (
  senderId,
  receiverId = "",
  groupId = ""
) => {
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/messages?receiverId=${receiverId}&senderId=${senderId}&groupId=${groupId}`
  );

  return result;
};

export const uploadFilesToServer = async (formData) => {
  const result = await fileUploadWithServer(
    `${process.env.BASE_URL}/users/upload`,
    "POST",
    formData
  );
  return result;
};

export const readMessage = async (readData) => {
  console.log(readData);
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/messages/mark-as-read`,
    "POST",
    readData
  );
  return result;
};

export const uploadSingleFilesToServer = async (formData) => {
  const result = await fileUploadWithServer(
    `${process.env.BASE_URL}/users/upload-single`,
    "POST",
    formData
  );
  return result;
};

export const getAllUsers = async () => {
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/get-all-users`
  );
  return result?.users;
};

export const getFriendRequests = async () => {
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/get-friend-requests`
  );
  return result?.friendRequests;
};

export const addFriend = async (friendId) => {
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/add-friend`,
    "POST",
    { friendId }
  );
  return result;
};

export const acceptFriend = async (friendId) => {
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/accept-friend`,
    "POST",
    { friendId }
  );
  return result;
};

export const addGroup = async (name, adminId, memberIds) => {
  console.log(name, adminId, memberIds);
  const result = await apiRequestWithServer(
    `${process.env.BASE_URL}/users/create-group`,
    "POST",
    { name, adminId, memberIds }
  );
  return result;
};
