import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import { supabase } from "../../supabaseClient";
import { API_BASE } from "../../api";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    adminId: "",
  });

  const [admins, setAdmins] = useState([]);        // Real admins from backend
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch real admins from backend when component loads
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoadingAdmins(true);
      try {
        const res = await fetch(`${API_BASE}/admins`);
        const data = await res.json();
        setAdmins(data);  // [{ id: "...", full_name: "..." }, ...]
      } catch (err) {
        console.error("Could not load admin list:", err);
      }
      setLoadingAdmins(false);
    };

    fetchAdmins();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "role" && value !== "volunteer" ? { adminId: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setLoading(true);

    try {
      // Step 1: Create user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        setSubmitError(authError.message);
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Step 2: Save profile info to our backend
      const profileRes = await fetch(`${API_BASE}/register-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          full_name: formData.name,
          phone: null,
          role: formData.role.toLowerCase(),       // backend expects lowercase: 'admin', 'volunteer'
          assigned_admin_id: formData.adminId || null,
        }),
      });

      const profileData = await profileRes.json();

      if (!profileRes.ok) {
        setSubmitError(profileData.detail || "Could not save your profile. Please try again.");
        setLoading(false);
        return;
      }

      // Step 3: Show success modal with correct message
      let message = "";
      if (formData.role === "Admin" || formData.role === "admin") {
        message = "Account created! Waiting for Owner's approval before you can log in.";
      } else if (formData.role === "Volunteer" || formData.role === "volunteer") {
        message = "Account created! Waiting for your Admin's approval before you can log in.";
      }

      setIsSuccess(true);
      setModalMessage(message);
      setShowModal(true);

    } catch (err) {
      setSubmitError("Server error. Please make sure the backend is running.");
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back
        </button>

        <h2 className="auth-title">Account Signup</h2>
        <p className="auth-subtitle">
          Be part of a safer, smarter crowd management system.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>

          {/* Full Name */}
          <div className="input-group">
            <label>Full Name</label>
            <input
              className="auth-input"
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="input-group">
            <label>Email Address</label>
            <input
              className="auth-input"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <label>Password</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Role Selection */}
          <div className="input-group">
            <label>Role</label>
            <select
              className="auth-select"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>

          {/* Volunteer → Select Admin (real data from backend) */}
          {formData.role === "volunteer" && (
            <div className="input-group">
              <label>Select Your Admin</label>
              <select
                className="auth-select"
                name="adminId"
                value={formData.adminId}
                onChange={handleChange}
                required
              >
                <option value="">
                  {loadingAdmins ? "Loading admins..." : "Select admin"}
                </option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error message */}
          {submitError && (
            <p style={{ color: "red", fontSize: "14px" }}>{submitError}</p>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating account..." : "Continue"}
          </button>

        </form>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Signup Status</h3>
            <p>{modalMessage}</p>
            <button
              className="auth-btn"
              onClick={() => {
                setShowModal(false);
                if (isSuccess) navigate("/");
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;