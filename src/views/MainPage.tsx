import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Divider } from "antd";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export default function MainPage() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setUserType(userDoc.exists() ? userDoc.data().type : null);
      } else {
        setUserType(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">Main Page</h1>
        <Divider className="mb-4" />
        {userType === "admin" && (
          <div className="w-full flex flex-col gap-3">
            <Button type="primary" className="w-full" onClick={() => navigate("/movies")}>
              Movies
            </Button>
            <Button type="primary" className="w-full" onClick={() => navigate("/users")}>
              Users
            </Button>
            <Button type="primary" className="w-full" onClick={() => navigate("/cinemas")}>
              Cinemas
            </Button>
          </div>
        )}
        {userType === "user" && (
          <div className="w-full flex flex-col gap-3">
            <Button type="primary" className="w-full" onClick={() => navigate("/personal-movies")}>
              Personal Movies
            </Button>
            <Button type="primary" className="w-full" onClick={() => navigate("/available-screenings")}>
              Available Screenings
            </Button>
            <Button type="primary" className="w-full" onClick={() => navigate("/movie-list")}>
              Movie List
            </Button>
          </div>
        )}
        {userType === "cinemaWorker" && (
          <div className="w-full flex flex-col gap-3">
            <Button type="primary" className="w-full" onClick={() => navigate("/movie-screenings")}>
              Movie Screenings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
