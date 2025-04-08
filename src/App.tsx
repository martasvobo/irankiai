import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Button, Layout, Menu, message } from "antd";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";
import "./tailwind.css";

const { Header, Content } = Layout;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const MainPage: React.FC = () => (
  <h1 className="text-center mt-10">Welcome to the Main Page</h1>
);

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

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserEmail(null);
      message.success("Logged out successfully!");
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <Layout>
      <Header className="flex justify-between items-center bg-blue-500">
        <div className="text-white text-lg">My App</div>
        {userEmail ? (
          <div className="flex items-center">
            <span className="text-white mr-4">{userEmail}</span>
            <Button type="default" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        ) : (
          <Button type="default" onClick={() => navigate("/login")}>
            Login
          </Button>
        )}
      </Header>
      <Content>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route
            path="/login"
            element={
              <LoginPage
                onLoginSuccess={(email) => {
                  setUserEmail(email);
                  navigate("/");
                }}
              />
            }
          />
        </Routes>
      </Content>
    </Layout>
  );
};

export default App;
