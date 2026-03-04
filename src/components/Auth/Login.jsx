import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../components/Auth/Auth.css";
import crowdImage from "../../assets/loginImage.jpg";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      const { token, role, status } = response.data;

      // If not approved
      if (status !== "approved") {
        setErrorMessage("Your account is not approved yet.");
        return;
      }

      // Save token (for protected routes later)
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      // Role Based Redirect
      if (role === "Admin") {
        navigate("/admin-dashboard");
      } else if (role === "Volunteer") {
        navigate("/volunteer-dashboard");
      } else if (role === "Owner") {
        navigate("/owner-dashboard");
      }

    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Login failed"
      );
    }
  };

  return (
    <div className="login-container">
      
      {/* LEFT SIDE IMAGE */}
      <div className="login-left">
        <img src={crowdImage} alt="Crowd" />
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="login-right">
        <div className="login-card">

          <h2>Account Login</h2>
          <p className="subtitle">
            Login Using your Registered UserID and Password
          </p>

          <form onSubmit={handleLogin}>
            <label>User Name</label>
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

            <div className="remember">
              <input type="checkbox" />
              <span>Remember me</span>
            </div>

            <button type="submit">Login</button>
          </form>

          {/* Error Message */}
          {errorMessage && (
            <p style={{ color: "red", marginTop: "10px" }}>
              {errorMessage}
            </p>
          )}

          <p className="forgot">Forgot Password?</p>

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