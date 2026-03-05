import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    adminId: "",
  });

  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Mock Admin List (Later fetch from backend)
  const admins = [
    { id: "admin1", name: "Admin One" },
    { id: "admin2", name: "Admin Two" },
    { id: "admin3", name: "Admin Three" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "role" && value !== "Volunteer"
        ? { adminId: "" }
        : {}),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Signup Data Submitted:", formData);

    // 🔴 Change this later when backend connected
    const isApproved = true;

    let message = "";

    if (formData.role === "Admin") {
      message = isApproved
        ? "Your Admin account has been approved successfully!"
        : "Waiting for Owner's approval.";
    }

    if (formData.role === "Volunteer") {
      message = isApproved
        ? "Your Volunteer account has been approved successfully!"
        : "Waiting for Admin's approval.";
    }

    setModalMessage(message);
    setShowModal(true);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Back Button */}
        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
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
              <option value="Admin">Admin</option>
              <option value="Volunteer">Volunteer</option>
            </select>
          </div>

          {/* Volunteer → Select Admin */}
          {formData.role === "Volunteer" && (
            <div className="input-group">
              <label>Select Your Admin</label>
              <select
                className="auth-select"
                name="adminId"
                value={formData.adminId}
                onChange={handleChange}
                required
              >
                <option value="">Select admin</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="auth-btn">
            Continue
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

                if (modalMessage.includes("approved")) {
                  navigate("/");
                }
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