// app/login/LoginPage.js (Client Component)
"use client";

import { doCredentialLogin } from "@/app/api/server-action";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import { Button, TextField } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Toast from "../Toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (type, message) => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = { email, password };

    try {
      const response = await doCredentialLogin(payload);

      if (response.error) {
        showToast("error", response.message);
      } else {
        showToast("success", "logged in successfully!");
        router.push("/");
      }
    } catch (error) {
      showToast("error", "Something went wrong!");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: <EmailIcon className="mr-2" />,
              }}
            />
          </div>
          <div className="mb-4">
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: <LockIcon className="mr-2" />,
              }}
            />
          </div>
          <div className="mb-4">
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Login
            </Button>
          </div>
          <div className="text-center">
            <p>
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600">
                Register
              </Link>
            </p>
          </div>
        </form>
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false })}
          />
        )}
      </div>
    </div>
  );
}
