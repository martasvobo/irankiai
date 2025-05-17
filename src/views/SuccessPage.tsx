import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Result } from "antd";

const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  return (
    <Result
      status="success"
      title="Payment Successful!"
      subTitle={sessionId ? `Session ID: ${sessionId}` : undefined}
      extra={[
        <Button type="primary" key="home" onClick={() => navigate("/")}>
          Back to Home
        </Button>,
      ]}
    />
  );
};

export default SuccessPage;