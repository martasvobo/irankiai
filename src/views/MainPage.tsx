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
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to the Main Page</h1>
      {userType === "admin" && (
        <>
          <Button type="primary" size="large" onClick={() => navigate("/movies")}>
            Go to Movies Page
          </Button>
          <Divider />
          <Button type="primary" size="large" onClick={() => navigate("/users")}>
            Go to Users Page
          </Button>
          <Divider />
          <Button type="primary" size="large" onClick={() => navigate("/cinemas")}>
            Go to Cinemas Page
          </Button>
          <Divider />
        </>
      )}
      {userType === "user" && (
        <>
          <Button type="primary" size="large" onClick={() => navigate("/personal-movies")}>
            Go to Personal Movies Page
          </Button>
          <Divider />
        </>
      )}
      {userType === "cinemaWorker" && (
        <>
          <Button type="primary" size="large" onClick={() => navigate("/movie-screenings")}>
            Go to Movie Screenings Page
          </Button>
          <Divider />
        </>
      )}
      {userType === "cinemaWorker" && (
        <>
          <Button type="primary" size="large" onClick={() => navigate("/available-screenings")}>
            See Available Screenings
          </Button>
        </>
      )}
    </div>
  );
}
