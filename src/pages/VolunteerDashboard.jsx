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

  // Fetch volunteer's own deployments
  const fetchDeployments = async () => {
    if (!volunteerId) return;
    try {
      const res = await fetch(`${API_BASE}/my-deployments/${volunteerId}`);
      const data = await res.json();
      setDeployments(Array.isArray(data) ? data : []);
    } catch {
      console.error("Could not load deployments");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 15000);
    return () => clearInterval(interval);
  }, [volunteerId]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-wrapper">
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <h2>Volunteer Panel</h2>
          <ul>
            <li className="active">Dashboard</li>
            <li>Deployment Requests</li>
            <li>My Profile</li>
          </ul>
        </div>

        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </aside>

      {/* Main */}
      <main className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <h1>My Deployments</h1>
        </div>

        {/* Deployments */}
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

      </main>
    </div>
  );
}

export default VolunteerDashboard;