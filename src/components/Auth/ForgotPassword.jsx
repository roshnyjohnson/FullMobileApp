import { useState } from "react";
import { Link } from "react-router-dom";
import "../../components/Auth/Auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Password reset link sent! Check your email.");
      } else {
        setError(data.detail || "Something went wrong.");
      }

    } catch (err) {
      setError("Server error. Try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-right" style={{ width: "100%" }}>
        <div className="login-card">

          <h2>Forgot Password</h2>
          <p className="subtitle">
            Enter your registered email to receive reset link.
          </p>

          <form onSubmit={handleForgotPassword}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {message && <p style={{ color: "green", marginTop: "10px" }}>{message}</p>}
          {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

          <p className="signup-text">
            Remember your password? <Link to="/login">Login here</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;