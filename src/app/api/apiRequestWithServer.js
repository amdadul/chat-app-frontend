"use server";

import { auth } from "@/auth";

export const apiRequestWithServer = async (
  url,
  method = "GET",
  body = null,
  nextOptions = {}
) => {
  const session = await auth();
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user?.token}`,
      },
      ...nextOptions,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);

    if (!res.ok) {
      return "Failed to fetched!";
    }

    const result = await res.json();
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error.message || "Server error");
  }
};

export const fileUploadWithServer = async (
  url,
  method = "POST",
  body = null,
  nextOptions = {}
) => {
  const session = await auth();
  try {
    const options = {
      method,
      headers: {
        //"Content-Type": "multipart/form-data",
        Authorization: `Bearer ${session?.user?.token}`,
      },
      ...nextOptions,
    };

    if (body) {
      options.body = body;
    }

    const res = await fetch(url, options);

    if (!res.ok) {
      return "Failed to fetched!";
    }

    const result = await res.json();
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error.message || "Server error");
  }
};
