import { Button, Layout, message } from "antd";
import { onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import LoginPage from "./views/LoginPage";
import MainPage from "./views/MainPage";
import MoviesPage from "./views/MoviesPage";
import "./tailwind.css";
import UsersPage from "./views/UsersPage";
import CinemasPage from "./views/CinemasPage";
import PersonalMoviesPage from "./views/PersonalMoviesPage";
import MovieScreeningPage from "./views/movieScreeningPage";

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

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
      messageApi.success("Logged out successfully!");
    } catch (error: any) {
      messageApi.error(error.message);
    }
  };

  return (
    <Layout>
      {contextHolder}
      <Header className="flex justify-between items-center bg-blue-500">
        <div className="text-white text-lg cursor-pointer" onClick={() => navigate("/")}>
          RomuvaMinus
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
          <Route path="/users" element={<UsersPage />} />
          <Route path="/cinemas" element={<CinemasPage />} />
          <Route path="/personal-movies" element={<PersonalMoviesPage />} />
          <Route path="/movie-screenings" element={<MovieScreeningPage />} />
        </Routes>
      </Content>
    </Layout>
  );
};

export default App;
