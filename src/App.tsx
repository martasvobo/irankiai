import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Button, Layout, Menu, message } from "antd";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";
import LoginPage from "./LoginPage";
import "./tailwind.css";
import MainPage from "./MainPage";
import MoviesPage from "./MoviesPage";

const { Header, Content } = Layout;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

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
        <div
          className="text-white text-lg cursor-pointer"
          onClick={() => navigate("/")}
        >
          My App
        </div>
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
          <Route path="/movies" element={<MoviesPage />} />
        </Routes>
      </Content>
    </Layout>
  );
};

export default App;
