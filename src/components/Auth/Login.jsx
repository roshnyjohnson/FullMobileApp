import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../components/Auth/Auth.css";
import crowdImage from "../../assets/loginImage.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.detail || "Login failed");
        return;
      }

      const { role, status, token } = data;

      if (status !== "approved") {
        setErrorMessage("Your account is not approved yet.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      if (role === "Admin") navigate("/admin-dashboard");
      else if (role === "Volunteer") navigate("/volunteer-dashboard");
      else if (role === "Owner") navigate("/owner-dashboard");

    } catch (err) {
      setErrorMessage("Server error. Try again.");
    }
  };

  return (
    <div className="login-container">

      <div className="login-left">
        <img src={crowdImage} alt="Crowd" />
      </div>

      <div className="login-right">
        <div className="login-card">

          <h2>Account Login</h2>
          <p className="subtitle">
            Login Using your Registered UserID and Password
          </p>

          <form onSubmit={handleLogin}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">Login</button>
          </form>

          {errorMessage && (
            <p style={{ color: "red", marginTop: "10px" }}>
              {errorMessage}
            </p>
          )}

          <Link to="/forgot-password" className="forgot">
            Forgot Password?
          </Link>

          <p className="signup-text">
            Don’t have an Account?{" "}
            <Link to="/signup">Sign Up here</Link>
          </p>

        </div>
      </div>

    </div>
  );
}

export default Login;