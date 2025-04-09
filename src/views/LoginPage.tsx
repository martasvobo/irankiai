import { Button } from "antd";
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firebaseConfig } from "../firebaseConfig";

const LoginPage: React.FC<{ onLoginSuccess: (email: string) => void }> = ({
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      onLoginSuccess(email);
    } catch (error: any) {}
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("kek");
      onLoginSuccess(email);
      navigate("/");
    } catch (error: any) {}
  };

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-2xl mb-4">Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2 p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-2 p-2 border rounded"
      />
      <Button type="default" onClick={handleLogin}>
        Login
      </Button>
      <Button type="default" onClick={handleRegister} className="mt-2">
        Register
      </Button>
    </div>
  );
};

export default LoginPage;
