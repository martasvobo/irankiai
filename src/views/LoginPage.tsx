import { Button, message } from "antd";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, functions } from "../firebaseConfig";
import { httpsCallable } from "firebase/functions";

const LoginPage: React.FC<{ onLoginSuccess: (email: string) => void }> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const createUser = httpsCallable(functions, "createUser");
  const handleRegister = async () => {
    try {
      await createUser({
        username: email.split("@")[0],
        email,
        description: "",
        type: "user",
      });
      onLoginSuccess(email);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        message.error("This email is already registered.");
      } else {
        message.error("Registration failed. Please check your credentials and try again.");
      }
      console.error("Registration error:", error);
    }
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess(email);
      navigate("/");
    } catch (error: any) {
      message.error("Provided credentials are incorrect.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        <Button type="primary" onClick={handleLogin} className="w-full mb-2">
          Login
        </Button>
        <Button type="default" onClick={handleRegister} className="w-full">
          Register
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
