import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./VolunteerDashboard.css";
import { API_BASE } from "../api";
import { supabase } from "../supabaseClient";

function VolunteerDashboard() {
  const navigate = useNavigate();
  const volunteerId = localStorage.getItem("user_id");

  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Alert State
  const loadVolDismissedAlerts = () => {
    try {
      const stored = localStorage.getItem("volDismissedAlerts");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  };

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(loadVolDismissedAlerts());
  
  // Tab State
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard', 'history', 'profile'
  const [allRecentAlerts, setAllRecentAlerts] = useState([]);
  
  // Profile State
  const [userProfile, setUserProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Fetch volunteer's own deployments
  const fetchDeployments = async () => {
    if (!volunteerId) return;
    try {
      const res = await fetch(`${API_BASE}/my-deployments/${volunteerId}`);
      if (res.ok) {
        const data = await res.json();
        setDeployments(data || []);
      }
    } catch (err) {}
    setLoading(false);
  };

  const fetchAlerts = async () => {
    if (!volunteerId) return;
    try {
      const res = await fetch(`${API_BASE}/alerts/volunteer/${volunteerId}`);
      if (res.ok) {
        const data = await res.json();
        setAllRecentAlerts(data || []); // Store all alerts for History
        
        // Filter out alerts the user has already dismissed
        const newAlerts = (data || []).filter(a => !dismissedAlerts.has(a.id || a.timestamp));
        setActiveAlerts(newAlerts);
      }
    } catch (err) {
        console.error("Failed to fetch alerts", err);
    }
  };

  // Fetch full user profile
  const fetchProfile = async () => {
    if (!volunteerId) return;
    try {
      const res = await fetch(`${API_BASE}/profile/${volunteerId}`);
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        setEditName(data.full_name || "");
        setEditPhone(data.phone || "");
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  useEffect(() => {
    fetchDeployments();
    fetchProfile();
  }, [volunteerId]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [volunteerId, dismissedAlerts]);

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => {
      const updated = new Set(prev).add(alertId);
      localStorage.setItem("volDismissedAlerts", JSON.stringify([...updated]));
      return updated;
    });
    setActiveAlerts(prev => prev.filter(a => (a.id || a.timestamp) !== alertId));
  };

  const dismissAllAlerts = () => {
    setDismissedAlerts(prev => {
      const updated = new Set(prev);
      activeAlerts.forEach(a => updated.add(a.id || a.timestamp));
      localStorage.setItem("volDismissedAlerts", JSON.stringify([...updated]));
      return updated;
    });
    setActiveAlerts([]);
  };

  // Accept or Reject a deployment invite
  const handleResponse = async (deploymentId, response) => {
    try {
      const res = await fetch(`${API_BASE}/respond-deployment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployment_id: deploymentId,
          volunteer_id: volunteerId,
          response: response
        })
      });

      if (res.ok) {
        alert(response === "accepted" ? "Deployment accepted!" : "Deployment rejected. Another volunteer will be assigned.");
        fetchDeployments();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to respond");
      }
    } catch {
      alert("Network error");
    }
  };

  const saveProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile/${volunteerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editName,
          phone: editPhone
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.profile);
        setIsEditingProfile(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      alert("Network error updating profile");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-wrapper">
      
      {/* ALERT POPUP OVERLAY */}
      {activeAlerts.length > 0 && (
        <div className="alert-overlay" style={alertOverlayStyle} onClick={dismissAllAlerts}>
          {activeAlerts.map(alert => (
            <div key={alert.id || alert.timestamp} className="alert-toast" style={alertToastStyle} onClick={(e) => e.stopPropagation()}>
              <div style={alertHeaderStyle}>
                <h2>⚠️ {alert.risk_level}</h2>
                <button 
                  onClick={() => dismissAlert(alert.id || alert.timestamp)}
                  style={dismissButtonStyle}
                >
                  X
                </button>
              </div>
              <p style={{ fontSize: "1.1rem", marginBottom: "10px" }}>
                <strong>Time:</strong> {new Date(alert.timestamp).toLocaleTimeString()}
              </p>
              <div style={alertActionStyle}>
                <strong>ACTION REQUIRED:</strong><br/>
                {alert.recommended_action}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Sidebar */}
      <aside className="sidebar" style={{ display: "flex", flexDirection: "column" }}>
        <div>
          <div className="sidebar-top">
            <h2>Volunteer Panel</h2>
            <ul>
              <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
                Dashboard
              </li>
              <li className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")} style={activeTab === "history" ? { color: "#f87171", fontWeight: "bold" } : {}}>
                🔔 Alert History
              </li>
              <li className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
                My Profile
              </li>
            </ul>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout} style={{ marginTop: "auto", marginBottom: "20px" }}>Logout</button>
      </aside>

      {/* Main */}
      <main className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <h1>
            {activeTab === "history" && "Alert History"}
            {activeTab === "dashboard" && "My Deployments"}
            {activeTab === "profile" && "My Profile"}
          </h1>
        </div>

        {/* CONTENT */}
        {activeTab === "history" && (
          <section className="alert-history" style={{ padding: "20px", maxWidth: "800px" }}>
            <h3>Recent Alert History (Past 15 Minutes)</h3>
            <div style={{ marginTop: "20px" }}>
              {allRecentAlerts.map(alert => (
                <div key={alert.id} style={{
                  padding: "15px", marginBottom: "15px", borderRadius: "8px",
                  borderLeft: `4px solid ${alert.risk_level?.includes('STAMPEDE') || alert.risk_level?.includes('RESTRICT') ? '#ef4444' : '#f59e0b'}`,
                  backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <strong style={{ color: "#374151", fontSize: "1.1rem" }}>{alert.risk_level}</strong>
                    <span style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: "1.05rem", color: "#4b5563", marginTop: "8px", fontStyle: "italic" }}>
                    {alert.recommended_action}
                  </div>
                </div>
              ))}
              {allRecentAlerts.length === 0 && (
                <div className="notification-card">
                  <p>No recent alerts dispatched to your deployment zone.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "profile" && userProfile && (
          <section className="profile-section" style={{ padding: "20px", maxWidth: "600px" }}>
            <div className="dashboard-card" style={{ padding: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
                <h2 style={{ margin: 0 }}>Volunteer Details</h2>
                {!isEditingProfile && (
                  <button className="accept-btn" onClick={() => setIsEditingProfile(true)}>
                    Edit Profile
                  </button>
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", color: "#666", fontSize: "0.9rem", marginBottom: "5px" }}>Full Name</label>
                  {isEditingProfile ? (
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="styled-input" style={{ width: "100%", padding: "10px" }} />
                  ) : (
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{userProfile.full_name}</div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", color: "#666", fontSize: "0.9rem", marginBottom: "5px" }}>Phone Number</label>
                  {isEditingProfile ? (
                    <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="styled-input" style={{ width: "100%", padding: "10px" }} />
                  ) : (
                    <div style={{ fontSize: "1.1rem" }}>{userProfile.phone || "Not provided"}</div>
                  )}
                </div>

                <div style={{ marginTop: "10px", padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                  <label style={{ display: "block", color: "#666", fontSize: "0.9rem", marginBottom: "5px" }}>Account Role</label>
                  <div style={{ fontWeight: "bold", color: "#374151", textTransform: "capitalize" }}>{userProfile.role}</div>
                </div>

                <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                  <label style={{ display: "block", color: "#666", fontSize: "0.9rem", marginBottom: "5px" }}>System Assignments</label>
                  <div style={{ fontSize: "0.95rem" }}>
                    <div><strong>Assigned Admin ID:</strong> {userProfile.assigned_admin_id}</div>
                    <div><strong>Static Zone DB ID:</strong> {userProfile.assigned_zone_id || "None globally bound"}</div>
                  </div>
                </div>

                {isEditingProfile && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button className="accept-btn" style={{ flex: 1 }} onClick={saveProfile}>Save Changes</button>
                    <button className="reject-btn" style={{ flex: 1 }} onClick={() => {
                      setIsEditingProfile(false);
                      setEditName(userProfile.full_name);
                      setEditPhone(userProfile.phone || "");
                    }}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "dashboard" && (
          <section className="deployments">
            <h3>Deployment Invites</h3>

            {loading ? (
              <div className="notification-card">
                <p>Loading your deployment invites...</p>
              </div>
            ) : deployments.length === 0 ? (
              <div className="notification-card">
                <p>No deployment invites yet. You will be auto-assigned 24 hours before an event.</p>
              </div>
            ) : (
              deployments.map((deploy) => (
                <div key={deploy.deployment_id} className="deployment-card">
                  <div className="deployment-info">
                    <h4>{deploy.events?.event_name || "Event"}</h4>
                    <p>Zone: {deploy.zones?.zone_name || "General Backup (Floating)"}</p>
                    <p>Location: {deploy.events?.location || "—"}</p>
                    <p>
                      When: {deploy.events?.start_datetime
                        ? new Date(deploy.events.start_datetime).toLocaleString()
                        : "—"}
                      {" → "}
                      {deploy.events?.end_datetime
                        ? new Date(deploy.events.end_datetime).toLocaleString()
                        : "—"}
                    </p>
                  </div>

                  <div className="deployment-action">
                    <span className={`status ${deploy.deployment_status.toLowerCase()}`}>
                      {deploy.deployment_status}
                    </span>

                    {deploy.deployment_status === "pending" && (
                      <>
                        <button
                          className="accept-btn"
                          onClick={() => handleResponse(deploy.deployment_id, "accepted")}
                        >
                          Accept
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleResponse(deploy.deployment_id, "rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

      </main>
    </div>
  );
}

// --- Inline Styles for Alerts ---
const alertOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "20px",
  padding: "20px"
};

const alertToastStyle = {
  backgroundColor: "#fff0f0",
  border: "3px solid #ff4444",
  borderRadius: "12px",
  padding: "20px 30px",
  width: "100%",
  maxWidth: "600px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  animation: "popIn 0.3s ease-out"
};

const alertHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "#d32f2f",
  marginBottom: "15px"
};

const dismissButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  fontWeight: "bold",
  cursor: "pointer",
  color: "#999"
};

const alertActionStyle = {
  backgroundColor: "#d32f2f",
  color: "white",
  padding: "15px",
  borderRadius: "8px",
  fontSize: "1.2rem",
  fontWeight: "bold"
};

export default VolunteerDashboard;