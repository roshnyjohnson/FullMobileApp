import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { API_BASE } from "../api";
import { supabase } from "../supabaseClient";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Read logged-in user from localStorage (set during login)
  const ownerId = localStorage.getItem("user_id");

  // Data State
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedAdmins, setApprovedAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending and approved admins from backend on load
  useEffect(() => {
    const fetchData = async () => {
      if (!ownerId) return;
      setLoading(true);
      try {
        // Fetch pending admins (Owner sees unapproved admins)
        const pendingRes = await fetch(
          `${API_BASE}/pending-users?approver_id=${ownerId}&approver_role=owner`
        );
        const pendingData = await pendingRes.json();

        // Fetch approved admins
        const approvedRes = await fetch(`${API_BASE}/admins`);
        const approvedData = await approvedRes.json();

        setPendingRequests(pendingData);
        setApprovedAdmins(approvedData);
      } catch (err) {
        console.error("Could not load owner dashboard data:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [ownerId]);

  const togglePanel = () => setIsPanelOpen(!isPanelOpen);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/");
  };

  const handleApprove = async (admin) => {
    try {
      const res = await fetch(`${API_BASE}/approve-user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approver_id: ownerId,
          user_id: admin.id,
        }),
      });

      if (res.ok) {
        // Move from pending to approved in UI
        setPendingRequests(pendingRequests.filter(item => item.id !== admin.id));
        setApprovedAdmins([...approvedAdmins, { id: admin.id, full_name: admin.full_name }]);
        alert(`${admin.full_name} has been approved!`);
      } else {
        const err = await res.json();
        alert(`Approval failed: ${err.detail}`);
      }
    } catch (err) {
      alert("Server error. Could not approve admin.");
    }
  };

  return (
    <div className="dashboard-container">

      {/* --- SIDE PANEL (HAMBURGER MENU) --- */}
      <div className={`side-panel ${isPanelOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={togglePanel}>×</button>
        <div className="panel-content">
          <h2 className="panel-logo">WatchTower</h2>
          <hr className="divider" />
          <nav className="panel-nav">
            <button className="panel-link" onClick={handleLogout}>Logout</button>
          </nav>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className={`main-content ${isPanelOpen ? "shifted" : ""}`}>
        <header className="dashboard-header">
          <div className="header-left">
            <button className="menu-icon" onClick={togglePanel}>
              ☰
            </button>
            <h1 className="app-name">WatchTower <span className="role-tag">Owner</span></h1>
          </div>
          <button className="logout-header-btn" onClick={handleLogout}>Logout</button>
        </header>

        {/* Pending Requests Table */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Pending Admin Requests</h2>
            <span className="badge">{pendingRequests.length}</span>
          </div>
          <div className="glass-table-container">
            {loading ? (
              <p style={{ padding: "20px" }}>Loading pending requests...</p>
            ) : pendingRequests.length === 0 ? (
              <p style={{ padding: "20px" }}>No pending admin requests.</p>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((admin) => (
                    <tr key={admin.id}>
                      <td>{admin.full_name}</td>
                      <td>{admin.role}</td>
                      <td>
                        <button className="approve-btn" onClick={() => handleApprove(admin)}>Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Approved List */}
        <section className="dashboard-section" style={{ marginTop: "30px" }}>
          <div className="section-header">
            <h2>Approved Admins</h2>
            <span className="badge">{approvedAdmins.length}</span>
          </div>
          <div className="glass-table-container">
            {loading ? (
              <p style={{ padding: "20px" }}>Loading approved admins...</p>
            ) : approvedAdmins.length === 0 ? (
              <p style={{ padding: "20px" }}>No approved admins yet.</p>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedAdmins.map((admin) => (
                    <tr key={admin.id}>
                      <td>{admin.full_name}</td>
                      <td><span className="status-pill">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default OwnerDashboard;