import { useState } from "react";
import { Link } from "react-router-dom";
import "../../components/Auth/Auth.css";
import crowdImage from "../../assets/loginImage.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    console.log(email, password);
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