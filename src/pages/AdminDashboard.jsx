import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import { API_BASE } from "../api";
import { supabase } from "../supabaseClient";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("deployment");
  const navigate = useNavigate();

  // Read logged-in user from localStorage (set during login)
  const adminId = localStorage.getItem("user_id");

  /* ---------------- VOLUNTEER STATE ---------------- */
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);

  // Fetch pending volunteers from backend on load
  useEffect(() => {
    const fetchPending = async () => {
      if (!adminId) return;
      setLoadingApprovals(true);
      try {
        const res = await fetch(
          `${API_BASE}/pending-users?approver_id=${adminId}&approver_role=admin`
        );
        const data = await res.json();
        setPendingApprovals(data); // [{ id, full_name, role, updated_at }, ...]
      } catch (err) {
        console.error("Could not load pending users:", err);
      }
      setLoadingApprovals(false);
    };

    fetchPending();
  }, [adminId]);

  /* ---------------- VOLUNTEER FUNCTIONS ---------------- */

  const approveVolunteer = async (volunteer) => {
    try {
      const res = await fetch(`${API_BASE}/approve-user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approver_id: adminId,
          user_id: volunteer.id,
        }),
      });

      if (res.ok) {
        // Remove from pending list on success
        setPendingApprovals((prev) => prev.filter((v) => v.id !== volunteer.id));
        alert(`${volunteer.full_name} has been approved!`);
      } else {
        const err = await res.json();
        alert(`Approval failed: ${err.detail}`);
      }
    } catch (err) {
      alert("Server error. Could not approve volunteer.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/");
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
              loadingApprovals={loadingApprovals}
              approveVolunteer={approveVolunteer}
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

const DeploymentTab = ({ pendingApprovals, loadingApprovals, approveVolunteer }) => (
  <div className="tab-view">
    <header className="view-header">
      <h1 className="text-black">Volunteer Deployment</h1>
    </header>

    <section className="dashboard-card shadow-sm">
      <div className="section-header-row">
        <h3>Volunteer Approvals</h3>
        <span className="badge-count">{pendingApprovals.length} Pending</span>
      </div>

      {loadingApprovals ? (
        <div className="empty-state">Loading pending volunteers...</div>
      ) : pendingApprovals.length === 0 ? (
        <div className="empty-state">All registration requests cleared.</div>
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingApprovals.map((v) => (
              <tr key={v.id}>
                <td>{v.full_name}</td>
                <td>{v.role}</td>
                <td>
                  <button
                    className="btn-approve-action"
                    onClick={() => approveVolunteer(v)}
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  </div>
);

/* ---------------- ANALYSIS TAB (Real Data) ---------------- */

const AnalysisTab = () => {
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [zonesRes, alertsRes] = await Promise.all([
          fetch(`${API_BASE}/zones`),
          fetch(`${API_BASE}/alerts`),
        ]);
        const zonesData = await zonesRes.json();
        const alertsData = await alertsRes.json();
        setZones(zonesData);
        setAlerts(alertsData);
      } catch (err) {
        console.error("Could not load analysis data:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const getRiskClass = (riskLevel) => {
    if (!riskLevel) return "risk-low";
    const r = riskLevel.toUpperCase();
    if (r.includes("STAMPEDE") || r.includes("RESTRICT")) return "risk-high";
    if (r.includes("CONTROL")) return "risk-medium";
    return "risk-low";
  };

  if (loading) {
    return <div className="empty-state" style={{ padding: "40px" }}>Loading live data...</div>;
  }

  return (
    <div className="analysis-container">

      {/* ZONE RISK SECTION */}
      <div className="analysis-grid">
        <div className="zone-section">
          <h2>Zone Risk Analysis</h2>
          {zones.length === 0 ? (
            <div className="empty-state">No zones found. Add zones to an event first.</div>
          ) : (
            <div className="zone-grid">
              {zones.map((zone) => (
                <div key={zone.zone_id} className={`zone-card ${getRiskClass(null)}`}>
                  <h3>Zone {zone.zone_id}</h3>
                  <p>{zone.zone_name}</p>
                  <p><strong>Type:</strong> {zone.zone_type}</p>
                  <p><strong>Capacity:</strong> {zone.max_capacity} people</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT ALERTS */}
        <div className="alerts-section">
          <h2>Recent Alerts</h2>
          {alerts.length === 0 ? (
            <div className="empty-state">No alerts yet.</div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`alert-card ${getRiskClass(alert.risk_level) === "risk-high" ? "warning" : "info"}`}
              >
                <strong>{alert.risk_level}</strong>
                <p>{alert.recommended_action}</p>
                <small>{new Date(alert.timestamp).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- REPORTS TAB (unchanged UI) ---------------- */

const ReportsTab = () => (
  <div className="reports-container">
    <h1 className="reports-title">Generate Reports</h1>

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

    <div className="quick-export">
      <h3>Quick Export</h3>
      <div className="export-buttons">
        <button className="btn-outline">Export as PDF</button>
        <button className="btn-outline">Export as Excel</button>
        <button className="btn-outline">Export as CSV</button>
      </div>
    </div>
  </div>
);

/* ---------------- LIVE MONITORING TAB (unchanged UI) ---------------- */

const MonitoringTab = () => {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [readings, setReadings] = useState([]);

  // Load zones from backend
  useEffect(() => {
    fetch(`${API_BASE}/zones`)
      .then((r) => r.json())
      .then(setZones)
      .catch(console.error);
  }, []);

  // Poll readings for selected zone every 5 seconds
  useEffect(() => {
    if (!selectedZone) return;

    const fetchReadings = () => {
      fetch(`${API_BASE}/readings/${selectedZone}?limit=12`)
        .then((r) => r.json())
        .then((data) => setReadings(data.reverse()))  // oldest first for chart
        .catch(console.error);
    };

    fetchReadings();
    const interval = setInterval(fetchReadings, 5000);
    return () => clearInterval(interval);
  }, [selectedZone]);

  const latestCount = readings.length > 0 ? readings[readings.length - 1].people_count : 0;
  const maxCount = Math.max(...readings.map((r) => r.people_count), 1);

  return (
    <div>
      <h1>Live Zone Monitoring</h1>

      <select onChange={(e) => setSelectedZone(e.target.value || null)}>
        <option value="">Select Zone</option>
        {zones.map((z) => (
          <option key={z.zone_id} value={z.zone_id}>
            {z.zone_name}
          </option>
        ))}
      </select>

      {selectedZone && (
        <>
          <h2 style={{ marginTop: "20px" }}>Current Count</h2>
          <h1 style={{ fontSize: "4rem", color: "#4f46e5" }}>{latestCount}</h1>
          <p>People Detected (updates every 5s)</p>

          {/* Simple bar chart */}
          <div style={{ display: "flex", gap: "5px", height: "150px", alignItems: "flex-end", marginTop: "20px" }}>
            {readings.map((r, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: `${(r.people_count / maxCount) * 150}px`,
                  background: "#4f46e5",
                  borderRadius: "4px 4px 0 0",
                  minHeight: "4px",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;