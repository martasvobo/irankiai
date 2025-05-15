import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Divider } from "antd";

export default function MainPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to the Main Page</h1>
      <Button type="primary" size="large" onClick={() => navigate("/movies")}>
        Go to Movies Page
      </Button>
      <Divider />
      <Button type="primary" size="large" onClick={() => navigate("/users")}>
        Go to Users Page
      </Button>
    </div>
  );
}
