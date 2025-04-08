import React, { useState } from "react";
import { Button, message } from "antd";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const LoginPage: React.FC<{ onLoginSuccess: (email: string) => void }> = ({
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      message.success("Registration successful!");
      onLoginSuccess(email);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      message.success("Login successful!");
      onLoginSuccess(email);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-2xl mb-4">Login or Register</h1>
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
      <div>
        <Button type="primary" onClick={handleRegister} className="mr-2">
          Register
        </Button>
        <Button type="default" onClick={handleLogin}>
          Login
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
