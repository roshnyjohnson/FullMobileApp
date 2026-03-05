import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../../components/Auth/Auth.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const handleReset = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:8000/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: password }),
    });

    if (response.ok) {
      setMessage("✅ Password reset successful! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setMessage("❌ Reset failed. Link may have expired.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-right" style={{ width: "100%" }}>
        <div className="login-card">

          <h2>Reset Password</h2>

          <form onSubmit={handleReset}>
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">Reset Password</button>
          </form>

          {message && <p style={{ marginTop: "10px" }}>{message}</p>}

        </div>
      </div>
    </div>
  );
}

export default ResetPassword;