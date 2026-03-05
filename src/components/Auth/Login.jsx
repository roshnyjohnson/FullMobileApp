import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../components/Auth/Auth.css";
import crowdImage from "../../assets/loginImage.jpg";
import { supabase } from "../../supabaseClient";
import { API_BASE } from "../../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Step 2: Fetch the user's profile from our backend to get their role
      const response = await fetch(`${API_BASE}/profile/${userId}`);

      if (!response.ok) {
        setError("Account found but profile is missing. Please contact support.");
        setLoading(false);
        return;
      }

      const profile = await response.json();

      // Step 3: Store user info in localStorage for use across the app
      localStorage.setItem("user_id", userId);
      localStorage.setItem("user_role", profile.role);
      localStorage.setItem("user_name", profile.full_name);
      localStorage.setItem("is_approved", profile.is_approved);

      // Step 4: Redirect based on role and approval status
      if (!profile.is_approved) {
        setError("Your account is pending approval. Please wait for your admin/owner to approve you.");
        await supabase.auth.signOut();
        localStorage.clear();
        setLoading(false);
        return;
      }

      if (profile.role === "owner") navigate("/owner");
      else if (profile.role === "admin") navigate("/admin");
      else if (profile.role === "volunteer") navigate("/volunteer");
      else setError("Unknown role. Please contact support.");

    } catch (err) {
      setError("Server error. Please make sure the backend is running.");
    }

    setLoading(false);
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

            {/* Error message */}
            {error && (
              <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="forgot">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>

          <p className="signup-text">
            Don't have an Account?{" "}
            <Link to="/signup">Sign Up here</Link>
          </p>

        </div>
      </div>

    </div>
  );
}

export default Login;