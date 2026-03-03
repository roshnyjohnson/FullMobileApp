import React, { useState } from "react";
import "./VolunteerDashboard.css";

function VolunteerDashboard() {
  const [deployments, setDeployments] = useState([
    {
      id: 1,
      zone: "Zone A - Coastal Region",
      date: "02 March 2026",
      status: "Pending",
    },
    {
      id: 2,
      zone: "Zone B - Hill Area",
      date: "01 March 2026",
      status: "Pending",
    },
  ]);

  const notifications = [
    {
      id: 1,
      title: "Flood Alert",
      message: "Heavy rainfall expected in Zone A.",
      time: "10 mins ago",
    },
    {
      id: 2,
      title: "High Wind Warning",
      message: "Strong winds predicted in Zone C.",
      time: "30 mins ago",
    },
  ];

  const handleResponse = (id, response) => {
    const updated = deployments.map((item) =>
      item.id === id ? { ...item, status: response } : item
    );
    setDeployments(updated);
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

        <button className="logout-btn">Logout</button>
      </aside>

      {/* Main */}
      <main className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <h1>Dashboard</h1>

          <div className="notification-icon">
            🔔
            <span className="badge">{notifications.length}</span>
          </div>
        </div>

        {/* Notifications */}
        <section className="notifications">
          <h3>Recent Alerts</h3>
          {notifications.map((note) => (
            <div key={note.id} className="notification-card">
              <div>
                <strong>{note.title}</strong>
                <p>{note.message}</p>
              </div>
              <span className="time">{note.time}</span>
            </div>
          ))}
        </section>

        {/* Deployments */}
        <section className="deployments">
          <h3>Deployment Requests</h3>
          {deployments.map((deploy) => (
            <div key={deploy.id} className="deployment-card">
              <div className="deployment-info">
                <h4>{deploy.zone}</h4>
                <p>Date: {deploy.date}</p>
              </div>

              <div className="deployment-action">
                <span className={`status ${deploy.status.toLowerCase()}`}>
                  {deploy.status}
                </span>

                {deploy.status === "Pending" && (
                  <>
                    <button
                      className="accept-btn"
                      onClick={() =>
                        handleResponse(deploy.id, "Accepted")
                      }
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() =>
                        handleResponse(deploy.id, "Rejected")
                      }
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>

      </main>
    </div>
  );
}

export default VolunteerDashboard;