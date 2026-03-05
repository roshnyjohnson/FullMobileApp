import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("deployment");

  /* ---------------- VOLUNTEER STATE ---------------- */

  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 1, name: "Suresh Das", email: "suresh@v.com", experience: "Crowd Control" },
    { id: 2, name: "Meera Nair", email: "meera@v.com", experience: "First Aid" },
  ]);

  const [availablePool, setAvailablePool] = useState([]);

  const [teams, setTeams] = useState([
    { id: "T1", name: "Team Alpha", location: "Zone 1", volunteer: "Rahul K.", status: "Accepted" },
    { id: "T2", name: "Team Bravo", location: "Zone 4", volunteer: "Anjali M.", status: "Rejected" }
  ]);

  /* ---------------- VOLUNTEER FUNCTIONS ---------------- */

  const approveVolunteer = (volunteer) => {
    setPendingApprovals(prev => prev.filter(v => v.id !== volunteer.id));
    setAvailablePool(prev => [...prev, volunteer]);
    alert(`${volunteer.name} added to the available pool!`);
  };

  const reassignVolunteer = (teamId) => {
    if (availablePool.length === 0) {
      alert("No volunteers available in the pool!");
      return;
    }

    const newVolunteer = availablePool[0];

    setTeams(prev =>
      prev.map(t =>
        t.id === teamId
          ? { ...t, volunteer: newVolunteer.name, status: "Pending" }
          : t
      )
    );

    setAvailablePool(prev => prev.slice(1));
  };

  const handleLogout = () => {
    alert("Logged out successfully");
    // later: clear token + navigate to login
  };

  return (
    <div className="admin-app-root">
      <div className="admin-layout">

        {/* SIDEBAR */}
        <aside className="admin-sidebar">
          <div className="sidebar-brand">WatchTower</div>

          <nav className="sidebar-menu">

            <button
              className={activeTab === "deployment" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab("deployment")}
            >
              Volunteer Deployment
            </button>

            <button
              className={activeTab === "analysis" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab("analysis")}
            >
              Data Analysis
            </button>

            <button
              className={activeTab === "reports" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab("reports")}
            >
              Report Generation
            </button>

            <button
              className={activeTab === "monitoring" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab("monitoring")}
            >
              Live Monitoring
            </button>

          </nav>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <main className="admin-content">

          {activeTab === "deployment" && (
            <DeploymentTab
              pendingApprovals={pendingApprovals}
              approveVolunteer={approveVolunteer}
              teams={teams}
              reassignVolunteer={reassignVolunteer}
              poolCount={availablePool.length}
            />
          )}

          {activeTab === "analysis" && <AnalysisTab />}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "monitoring" && <MonitoringTab />}

        </main>
      </div>
    </div>
  );
};

/* ---------------- DEPLOYMENT TAB ---------------- */

const DeploymentTab = ({
  pendingApprovals,
  approveVolunteer,
  teams,
  reassignVolunteer,
  poolCount
}) => (
  <div className="tab-view">

    <header className="view-header">
      <h1 className="text-black">Volunteer Deployment</h1>
      <div className="header-actions">
        <span className="pool-badge">Pool: {poolCount}</span>
      </div>
    </header>

    <section className="dashboard-card shadow-sm">
      <div className="section-header-row">
        <h3>Volunteer Approvals</h3>
        <span className="badge-count">{pendingApprovals.length} Pending</span>
      </div>

      {pendingApprovals.length === 0 ? (
        <div className="empty-state">All registration requests cleared.</div>
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingApprovals.map(v => (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td>{v.experience}</td>
                <td>
                  <button
                    className="btn-approve-action"
                    onClick={() => approveVolunteer(v)}
                  >
                    Approve & Add to Pool
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>

    <section className="teams-section">
      <h3>Active Teams</h3>

      <div className="team-grid">
        {teams.map(team => (
          <div key={team.id} className="team-card shadow-sm">

            <div className={`team-status ${team.status.toLowerCase()}`}>
              {team.status}
            </div>

            <h4>{team.name}</h4>
            <p><strong>Location:</strong> {team.location}</p>
            <p><strong>Assigned:</strong> {team.volunteer}</p>

            {team.status === "Rejected" && (
              <button
                className="btn-danger"
                onClick={() => reassignVolunteer(team.id)}
              >
                Reassign from Pool
              </button>
            )}

          </div>
        ))}
      </div>
    </section>
  </div>
);

/* ---------------- ANALYSIS TAB ---------------- */

const AnalysisTab = () => {

  const zones = [
    { id: 1, name: "Main Entrance", people: 85, risk: "medium" },
    { id: 2, name: "Stage Area", people: 45, risk: "low" },
    { id: 3, name: "Food Court", people: 35, risk: "low" },
    { id: 4, name: "Exit Gate", people: 50, risk: "medium" },
    { id: 5, name: "Parking Area", people: 30, risk: "low" },
  ];

  const alerts = [
    { id: 1, message: "Zone 1 - Main Entrance reaching moderate capacity", type: "warning", time: "2 min ago" },
    { id: 2, message: "Zone 4 - Exit Gate requires monitoring", type: "warning", time: "5 min ago" },
    { id: 3, message: "Zone 2 - Stage Area crowd levels normal", type: "info", time: "12 min ago" },
    { id: 4, message: "Team Bravo deployed to Zone 1", type: "info", time: "18 min ago" },
    { id: 5, message: "Emergency exit routes cleared", type: "info", time: "32 min ago" },
  ];

  const totalCrowd = zones.reduce((acc, z) => acc + z.people, 0);

  const getRiskClass = (risk) => {
    if (risk === "medium") return "risk-medium";
    if (risk === "high") return "risk-high";
    return "risk-low";
  };

  return (
    <div className="analysis-container">

      {/* LIVE CROWD OVERVIEW */}
      <div className="overview-card">
        <div>
          <h3>Total Crowd Count</h3>
          <h1>{totalCrowd}</h1>
        </div>

        <div className="overall-risk risk-medium">
          MEDIUM RISK
        </div>
      </div>

      <div className="analysis-grid">

        {/* ZONE RISK SECTION */}
        <div className="zone-section">
          <h2>Zone Risk Analysis</h2>

          <div className="zone-grid">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className={`zone-card ${getRiskClass(zone.risk)}`}
              >
                <h3>Zone {zone.id}</h3>
                <p>{zone.name}</p>
                <h2>
                  {zone.people} <span>people</span>
                </h2>

                <div className="zone-risk-label">
                  {zone.risk.toUpperCase()} RISK
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ALERTS */}
        <div className="alerts-section">
          <h2>Recent Alerts</h2>

          {alerts.map((alert) => (
            <div key={alert.id} className={`alert-card ${alert.type}`}>
              <p>{alert.message}</p>
              <small>{alert.time}</small>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

/* ---------------- REPORTS TAB ---------------- */

const ReportsTab = () => {

  const previousEvents = [
    {
      id: 1,
      title: "Annual Music Festival 2026",
      date: "January 28, 2026",
      duration: "8 hours",
      status: "Successful",
      peakCrowd: 385,
      incidents: 2,
      responseTime: "2.5 min",
      teams: 3
    }
  ];

  return (
    <div className="reports-container">

      <h1 className="reports-title">Generate Reports</h1>

      {/* REPORT CARDS */}
      <div className="reports-card-grid">

        <div className="report-card">
          <div className="report-icon blue"></div>
          <h3>Daily Report</h3>
          <p>Today's crowd statistics and incident summary</p>
          <button className="btn-gradient-blue">Generate</button>
        </div>

        <div className="report-card">
          <div className="report-icon purple"></div>
          <h3>Weekly Report</h3>
          <p>7-day trend analysis and performance metrics</p>
          <button className="btn-gradient-purple">Generate</button>
        </div>

        <div className="report-card">
          <div className="report-icon green"></div>
          <h3>Custom Report</h3>
          <p>Select date range and custom parameters</p>
          <button className="btn-green">Configure</button>
        </div>

      </div>

      {/* QUICK EXPORT */}
      <div className="quick-export">
        <h3>Quick Export</h3>
        <div className="export-buttons">
          <button className="btn-outline">Export as PDF</button>
          <button className="btn-outline">Export as Excel</button>
          <button className="btn-outline">Export as CSV</button>
        </div>
      </div>

      {/* PREVIOUS EVENTS */}
      <div className="previous-events">

        <div className="events-header">
          <h2>Previous Events History</h2>
          <div className="search-filter">
            <input type="text" placeholder="Search events..." />
            <button className="btn-outline">Filter</button>
          </div>
        </div>

        {previousEvents.map(event => (
          <div key={event.id} className="event-card">

            <div className="event-top">
              <div>
                <h3>{event.title}</h3>
                <span className="status-badge success">
                  {event.status}
                </span>
                <p>{event.date} • {event.duration}</p>
              </div>

              <button className="btn-view">View Details</button>
            </div>

            <div className="event-metrics">

              <div className="metric-box">
                <p>Peak Crowd</p>
                <h4>{event.peakCrowd}</h4>
              </div>

              <div className="metric-box">
                <p>Incidents</p>
                <h4>{event.incidents}</h4>
              </div>

              <div className="metric-box">
                <p>Response Time</p>
                <h4>{event.responseTime}</h4>
              </div>

              <div className="metric-box">
                <p>Teams Deployed</p>
                <h4>{event.teams}</h4>
              </div>

            </div>
          </div>
        ))}

      </div>

    </div>
  );
};

/* ---------------- LIVE MONITORING TAB ---------------- */

const MonitoringTab = () => {
  const cameras = [
    { id: 1, name: "Entrance Camera" },
    { id: 2, name: "Food Court Camera" },
    { id: 3, name: "Parking Camera" }
  ];

  const [selectedCamera, setSelectedCamera] = useState(null);
  const [currentCount, setCurrentCount] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!selectedCamera) return;

    const interval = setInterval(() => {
      const newCount = Math.floor(Math.random() * 120);

      setCurrentCount(newCount);
      setHistory(prev => {
        const updated = [...prev, newCount];
        return updated.length > 12 ? updated.slice(1) : updated;
      });

    }, 2000);

    return () => clearInterval(interval);
  }, [selectedCamera]);

  return (
    <div>
      <h1>Live Camera Monitoring</h1>

      <select
        onChange={(e) =>
          setSelectedCamera(
            cameras.find(c => c.id === parseInt(e.target.value))
          )
        }
      >
        <option value="">Select Camera</option>
        {cameras.map(cam => (
          <option key={cam.id} value={cam.id}>
            {cam.name}
          </option>
        ))}
      </select>

      {selectedCamera && (
        <>
          <h2>{selectedCamera.name}</h2>
          <h1>{currentCount}</h1>
          <p>People Detected</p>

          <div style={{ display: "flex", gap: "5px", height: "150px", alignItems: "flex-end" }}>
            {history.map((value, index) => (
              <div
                key={index}
                style={{
                  width: "20px",
                  height: `${value}px`,
                  background: "#4f46e5"
                }}
              ></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;