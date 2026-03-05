import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Data State
  const [pendingRequests, setPendingRequests] = useState([
    { id: 1, name: "Rahul Sharma", email: "rahul@admin.com", date: "2026-03-01" },
    { id: 2, name: "Anita Varma", email: "anita@admin.com", date: "2026-03-02" },
  ]);

  const [approvedAdmins, setApprovedAdmins] = useState([
    { id: 101, name: "Vikram Singh", email: "vikram@admin.com", status: "Active" },
  ]);

  const togglePanel = () => setIsPanelOpen(!isPanelOpen);

  const handleLogout = () => {
    // Clear auth data here if needed
    navigate("/login");
  };

  const handleApprove = (admin) => {
    setPendingRequests(pendingRequests.filter(item => item.id !== admin.id));
    setApprovedAdmins([...approvedAdmins, { ...admin, status: "Active" }]);
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
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>
                      <button className="approve-btn" onClick={() => handleApprove(admin)}>Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Approved List */}
        <section className="dashboard-section" style={{ marginTop: "30px" }}>
          <div className="section-header">
            <h2>Approved Admins</h2>
          </div>
          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {approvedAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td><span className="status-pill">{admin.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OwnerDashboard;