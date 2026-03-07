import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import { API_BASE } from "../api";
import { supabase } from "../supabaseClient";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("event");
  const navigate = useNavigate();

  const adminId = localStorage.getItem("user_id");

  /* ---------------- EVENT STATE ---------------- */

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [zones, setZones] = useState([]);

  const [newEventName, setNewEventName] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");

  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneType, setNewZoneType] = useState("");
  const [newZoneCapacity, setNewZoneCapacity] = useState("");
  const [newZoneDoors, setNewZoneDoors] = useState("");
  const [newZoneCamera, setNewZoneCamera] = useState("");

  /* ---------------- VOLUNTEER STATE ---------------- */

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);

  /* ---------------- LOAD EVENTS ---------------- */

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/events`);
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Could not load events", err);
      }
    };

    fetchEvents();
  }, []);

  /* ---------------- LOAD ZONES ---------------- */

  useEffect(() => {
    if (!selectedEvent) return;

    const fetchZones = async () => {
      try {
        const res = await fetch(`${API_BASE}/zones/${selectedEvent}`);
        const data = await res.json();
        setZones(data);
      } catch {
        console.error("Could not load zones");
      }
    };

    fetchZones();
  }, [selectedEvent]);

  /* ---------------- LOAD VOLUNTEERS ---------------- */

  useEffect(() => {
    const fetchPending = async () => {
      if (!adminId) return;

      setLoadingApprovals(true);

      try {
        const res = await fetch(
          `${API_BASE}/pending-users?approver_id=${adminId}&approver_role=admin`
        );
        const data = await res.json();
        setPendingApprovals(data);
      } catch {
        console.error("Could not load pending users");
      }

      setLoadingApprovals(false);
    };

    fetchPending();
  }, [adminId]);

  /* ---------------- CREATE EVENT ---------------- */

  const createEvent = async () => {
    try {
      const res = await fetch(`${API_BASE}/create-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event_name: newEventName,
          location: newEventLocation,
          created_by: adminId
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Event created");
        setEvents((prev) => [...prev, data]);
        setNewEventName("");
        setNewEventLocation("");
      }
    } catch {
      alert("Event creation failed");
    }
  };

  /* ---------------- CREATE ZONE ---------------- */

  const createZone = async () => {
    if (!selectedEvent) return alert("Select event first");

    try {
      const res = await fetch(`${API_BASE}/create-zone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event_id: selectedEvent,
          zone_name: newZoneName,
          zone_type: newZoneType,
          max_capacity: newZoneCapacity,
          num_doors: newZoneDoors,
          camera_id: newZoneCamera
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Zone created");
        setZones((prev) => [...prev, data]);
      }
    } catch {
      alert("Zone creation failed");
    }
  };

  /* ---------------- APPROVE VOLUNTEER ---------------- */

  const approveVolunteer = async (volunteer) => {
    try {
      const res = await fetch(`${API_BASE}/approve-user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approver_id: adminId,
          user_id: volunteer.id
        })
      });

      if (res.ok) {
        setPendingApprovals((prev) =>
          prev.filter((v) => v.id !== volunteer.id)
        );
      }
    } catch {
      alert("Approval failed");
    }
  };

  /* ---------------- MONITORING CONTROLS ---------------- */

  const blockGate = async (zoneId) => {
    await fetch(`${API_BASE}/block-exit/${zoneId}`, { method: "PUT" });
  };

  const unblockGate = async (zoneId) => {
    await fetch(`${API_BASE}/unblock-exit/${zoneId}`, { method: "PUT" });
  };

  const triggerExitPlan = async (zoneId) => {
    await fetch(`${API_BASE}/exit-strategy/${zoneId}`, { method: "POST" });
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
              className={activeTab === "event" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab("event")}
            >
              Event Control
            </button>

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

        {/* MAIN */}

        <main className="admin-content">

          {activeTab === "event" && (
            <EventControlTab
              events={events}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
              newEventName={newEventName}
              setNewEventName={setNewEventName}
              newEventLocation={newEventLocation}
              setNewEventLocation={setNewEventLocation}
              createEvent={createEvent}
              createZone={createZone}
              setNewZoneName={setNewZoneName}
              setNewZoneType={setNewZoneType}
              setNewZoneCapacity={setNewZoneCapacity}
              setNewZoneDoors={setNewZoneDoors}
              setNewZoneCamera={setNewZoneCamera}
            />
          )}

          {activeTab === "deployment" && (
            <DeploymentTab
              pendingApprovals={pendingApprovals}
              loadingApprovals={loadingApprovals}
              approveVolunteer={approveVolunteer}
            />
          )}

          {activeTab === "analysis" && <AnalysisTab />}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "monitoring" && (
            <MonitoringTab
              zones={zones}
              blockGate={blockGate}
              unblockGate={unblockGate}
              triggerExitPlan={triggerExitPlan}
            />
          )}

        </main>
      </div>
    </div>
  );
};

/* ---------------- EVENT CONTROL TAB ---------------- */

const EventControlTab = ({
  events,
  selectedEvent,
  setSelectedEvent,
  newEventName,
  setNewEventName,
  newEventLocation,
  setNewEventLocation,
  createEvent,
  createZone,
  setNewZoneName,
  setNewZoneType,
  setNewZoneCapacity,
  setNewZoneDoors,
  setNewZoneCamera
}) => {

  return (
    <div className="event-control-container">

      <h1 className="page-title">Event Control</h1>

      {/* CREATE EVENT */}
      <div className="dashboard-card">

        <h3>Create Event</h3>

        <div className="form-row">

          <input
            placeholder="Event Name"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
          />

          <input
            placeholder="Location"
            value={newEventLocation}
            onChange={(e) => setNewEventLocation(e.target.value)}
          />

          <button className="btn-primary" onClick={createEvent}>
            Create Event
          </button>

        </div>

      </div>


      {/* SELECT EVENT */}
      <div className="dashboard-card">

        <h3>Select Event</h3>

        <select
          className="styled-select"
          value={selectedEvent || ""}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          <option value="">Select Event</option>

          {events.map((event) => (
            <option key={event.event_id} value={event.event_id}>
              {event.event_name}
            </option>
          ))}

        </select>

      </div>


      {/* ZONE CREATION */}

      {selectedEvent && (
        <div className="dashboard-card">

          <h3>Create Zone</h3>

          <div className="zone-form-grid">

            <input placeholder="Zone Name" onChange={(e)=>setNewZoneName(e.target.value)} />

            <input placeholder="Zone Type (Entry / Stage / Exit)" onChange={(e)=>setNewZoneType(e.target.value)} />

            <input placeholder="Max Capacity" onChange={(e)=>setNewZoneCapacity(e.target.value)} />

            <input placeholder="Number of Doors" onChange={(e)=>setNewZoneDoors(e.target.value)} />

            <input placeholder="Camera ID" onChange={(e)=>setNewZoneCamera(e.target.value)} />

          </div>

          <button className="btn-primary zone-btn" onClick={createZone}>
            Add Zone
          </button>

        </div>
      )}

    </div>
  );
};

/* ---------------- DEPLOYMENT TAB ---------------- */

const DeploymentTab = ({ pendingApprovals, loadingApprovals, approveVolunteer }) => {

  return (
    <div className="tab-view">

      <header className="view-header">
        <h1 className="text-black">Volunteer Deployment</h1>
      </header>

      <section className="dashboard-card shadow-sm">

        <div className="section-header-row">
          <h3>Volunteer Approvals</h3>
          <span className="badge-count">
            {pendingApprovals.length} Pending
          </span>
        </div>

        {loadingApprovals ? (

          <div className="empty-state">
            Loading pending volunteers...
          </div>

        ) : pendingApprovals.length === 0 ? (

          <div className="empty-state">
            All registration requests cleared.
          </div>

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

                  <td>
                    <span className="role-badge">
                      {v.role}
                    </span>
                  </td>

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
};

/* ---------------- ANALYSIS TAB ---------------- */

const AnalysisTab = () => {

  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch zones + alerts
  const fetchData = async () => {

    try {

      const [zonesRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/zones`),
        fetch(`${API_BASE}/alerts`)
      ]);

      const zonesData = await zonesRes.json();
      const alertsData = await alertsRes.json();

      setZones(zonesData || []);
      setAlerts(alertsData || []);

    } catch (err) {

      console.error("Could not load analysis data:", err);

    } finally {

      setLoading(false);

    }
  };

  // Load once
  useEffect(() => {
    fetchData();
  }, []);

  // Auto refresh every 10 seconds
  useEffect(() => {

    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);

  }, []);


  // Risk style
  const getRiskClass = (riskLevel) => {

    if (!riskLevel) return "risk-low";

    const r = riskLevel.toUpperCase();

    if (r.includes("STAMPEDE") || r.includes("RESTRICT"))
      return "risk-high";

    if (r.includes("CONTROL"))
      return "risk-medium";

    return "risk-low";
  };


  if (loading) {

    return (
      <div className="empty-state" style={{ padding: "40px" }}>
        Loading analysis data...
      </div>
    );

  }


  return (

    <div className="analysis-container">

      <h1 style={{ marginBottom: "20px" }}>
        Crowd Risk Analysis
      </h1>


      <div className="analysis-grid">


        {/* ZONE ANALYSIS */}

        <div className="zone-section">

          <h2>Zone Risk Status</h2>

          {zones.length === 0 ? (

            <div className="empty-state">
              No zones found. Create zones first.
            </div>

          ) : (

            <div className="zone-grid">

              {zones.map((zone) => (

                <div
                  key={zone.zone_id}
                  className="zone-card risk-low"
                >

                  <h3>{zone.zone_name}</h3>

                  <p>
                    <strong>Type:</strong> {zone.zone_type}
                  </p>

                  <p>
                    <strong>Capacity:</strong> {zone.max_capacity}
                  </p>

                  <p>
                    <strong>Doors:</strong> {zone.num_doors}
                  </p>

                  <p>
                    <strong>Camera:</strong> {zone.camera_id || "N/A"}
                  </p>

                </div>

              ))}

            </div>

          )}

        </div>


        {/* ALERTS PANEL */}

        <div className="alerts-section">

          <h2>Recent Alerts</h2>

          {alerts.length === 0 ? (

            <div className="empty-state">
              No alerts generated yet.
            </div>

          ) : (

            alerts.map((alert) => (

              <div
                key={alert.id}
                className={`alert-card ${getRiskClass(alert.risk_level) === "risk-high"
                  ? "warning"
                  : "info"
                }`}
              >

                <strong>{alert.risk_level}</strong>

                <p>
                  {alert.recommended_action}
                </p>

                <small>
                  {new Date(alert.timestamp).toLocaleString()}
                </small>

              </div>

            ))

          )}

        </div>

      </div>

    </div>

  );

};

/* ---------------- REPORT TAB ---------------- */

const ReportsTab = () => {

  const generateReport = async (type) => {

    try {

      const response = await fetch(`${API_BASE}/reports/${type}`);

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

    } catch (err) {
      console.error(err);
      alert("Report generation failed");
    }

  };


  const quickExport = async (format) => {

    try {

      const response = await fetch(`${API_BASE}/reports/export/${format}`);

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `crowd-data.${format}`;

      document.body.appendChild(a);
      a.click();
      a.remove();

    } catch (err) {
      console.error(err);
      alert("Export failed");
    }

  };


  return (
    <div className="reports-container">

      <h1 className="reports-title">Generate Reports</h1>

      <div className="reports-card-grid">

        {/* DAILY REPORT */}

        <div className="report-card">

          <div className="report-icon blue"></div>

          <h3>Daily Report</h3>

          <p>Today's crowd statistics and incident summary</p>

          <button
            className="btn-gradient-blue"
            onClick={() => generateReport("daily")}
          >
            Generate
          </button>

        </div>


        {/* WEEKLY REPORT */}

        <div className="report-card">

          <div className="report-icon purple"></div>

          <h3>Weekly Report</h3>

          <p>7-day trend analysis and performance metrics</p>

          <button
            className="btn-gradient-purple"
            onClick={() => generateReport("weekly")}
          >
            Generate
          </button>

        </div>


        {/* CUSTOM REPORT */}

        <div className="report-card">

          <div className="report-icon green"></div>

          <h3>Custom Report</h3>

          <p>Select date range and custom parameters</p>

          <button
            className="btn-green"
            onClick={() => alert("Custom report configuration coming soon")}
          >
            Configure
          </button>

        </div>

      </div>


      {/* QUICK EXPORT */}

      <div className="quick-export">

        <h3>Quick Export</h3>

        <div className="export-buttons">

          <button
            className="btn-outline"
            onClick={() => quickExport("pdf")}
          >
            Export as PDF
          </button>

          <button
            className="btn-outline"
            onClick={() => quickExport("xlsx")}
          >
            Export as Excel
          </button>

          <button
            className="btn-outline"
            onClick={() => quickExport("csv")}
          >
            Export as CSV
          </button>

        </div>

      </div>

    </div>
  );
};

/* ---------------- MONITORING TAB ---------------- */

const MonitoringTab = ({ zones, blockGate, unblockGate, triggerExitPlan }) => {

  const [selectedZone, setSelectedZone] = useState(null);
  const [readings, setReadings] = useState([]);

  // Poll readings every 5 seconds
  useEffect(() => {

    if (!selectedZone) return;

    const fetchReadings = () => {
      fetch(`${API_BASE}/readings/${selectedZone}?limit=12`)
        .then((r) => r.json())
        .then((data) => setReadings(data.reverse()))
        .catch(console.error);
    };

    fetchReadings();

    const interval = setInterval(fetchReadings, 5000);

    return () => clearInterval(interval);

  }, [selectedZone]);

  const latestCount =
    readings.length > 0
      ? readings[readings.length - 1].people_count
      : 0;

  const maxCount = Math.max(
    ...readings.map((r) => r.people_count),
    1
  );

  return (
    <div className="tab-view">

      <h1>Live Zone Monitoring</h1>

      {/* ZONE SELECTOR */}

      <select
        onChange={(e) => setSelectedZone(e.target.value || null)}
      >
        <option value="">Select Zone</option>

        {zones.map((z) => (
          <option key={z.zone_id} value={z.zone_id}>
            {z.zone_name}
          </option>
        ))}

      </select>


      {/* ZONE DATA */}

      {selectedZone && (

        <>

          <h2 style={{ marginTop: "20px" }}>
            Current Crowd Count
          </h2>

          <h1
            style={{
              fontSize: "4rem",
              color: "#4f46e5"
            }}
          >
            {latestCount}
          </h1>

          <p>People Detected (updates every 5s)</p>


          {/* CROWD TREND CHART */}

          <div
            style={{
              display: "flex",
              gap: "5px",
              height: "150px",
              alignItems: "flex-end",
              marginTop: "20px"
            }}
          >

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


          {/* ZONE CONTROL PANEL */}

          <div style={{ marginTop: "30px" }}>

            {zones
              .filter((z) => z.zone_id == selectedZone)
              .map((zone) => (

                <div key={zone.zone_id} className="zone-card">

                  <h3>{zone.zone_name} Control</h3>

                  <button
                    onClick={() => blockGate(zone.zone_id)}
                  >
                    Block Gate
                  </button>

                  <button
                    onClick={() => unblockGate(zone.zone_id)}
                  >
                    Unblock Gate
                  </button>

                  <button
                    onClick={() => triggerExitPlan(zone.zone_id)}
                  >
                    Trigger Exit Plan
                  </button>

                </div>

              ))}

          </div>

        </>

      )}

    </div>
  );
};

export default AdminDashboard;