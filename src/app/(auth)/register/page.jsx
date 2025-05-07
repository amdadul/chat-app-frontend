"use client";

import { signUp } from "@/app/api/server-action";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import { Button, TextField } from "@mui/material";
import Link from "next/link"; // Or your preferred routing solution
import { useRouter } from "next/navigation";
import { useState } from "react";
import Toast from "../../components/Toast";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const router = useRouter();

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (type, message) => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const validate = () => {
    let valid = true;
    const newErrors = {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    };

    if (!username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    if (validate()) {
      try {
        const userData = {
          name: username,
          email: email,
          password: password,
        };

        const data = await signUp(userData);

        if (data.error) {
          showToast("error", data.message);
        } else {
          showToast("success", "Successfully Registered!");
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-4">Register</h2>

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Username */}
          <div className="mb-4">
            <TextField
              label="Name"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={Boolean(errors.username)}
              helperText={errors.username}
              InputProps={{
                startAdornment: <PersonIcon className="mr-2" />,
              }}
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={Boolean(errors.email)}
              helperText={errors.email}
              InputProps={{
                startAdornment: <EmailIcon className="mr-2" />,
              }}
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(errors.password)}
              helperText={errors.password}
              InputProps={{
                startAdornment: <LockIcon className="mr-2" />,
              }}
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <TextField
              label="Confirm Password"
              type="password"
              variant="outlined"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword}
              InputProps={{
                startAdornment: <LockIcon className="mr-2" />,
              }}
            />
          </div>

          {/* Register Button */}
          <div className="mb-4">
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleRegister}
            >
              Register
            </Button>
          </div>

          {/* Link to Login Page */}
          <div className="text-center">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600">
                Login
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
