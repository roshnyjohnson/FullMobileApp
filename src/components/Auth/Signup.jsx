import { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

function Signup() {
  const [role, setRole] = useState("ADMIN");

  const handleSignup = (e) => {
    e.preventDefault();
    alert("Signup successful. Waiting for approval.");
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>

      <form onSubmit={handleSignup}>
        <input type="text" placeholder="Full Name" required />
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />

        <select onChange={(e) => setRole(e.target.value)}>
          <option value="ADMIN">Admin</option>
          <option value="VOLUNTEER">Volunteer</option>
        </select>

        <button type="submit">Register</button>
      </form>

      <p>
        Already registered? <Link to="/">Login</Link>
      </p>
    </div>
  );
}

export default Signup;   // ✅ THIS LINE IS MANDATORY