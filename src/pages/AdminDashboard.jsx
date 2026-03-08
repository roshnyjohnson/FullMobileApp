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
  const [newEventType, setNewEventType] = useState("");
  const [newExpectedAttendance, setNewExpectedAttendance] = useState("");
  const [newStartDatetime, setNewStartDatetime] = useState("");
  const [newEndDatetime, setNewEndDatetime] = useState("");

  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneType, setNewZoneType] = useState("");
  const [newZoneLength, setNewZoneLength] = useState("");
  const [newZoneWidth, setNewZoneWidth] = useState("");
  const [newZoneSafeDensity, setNewZoneSafeDensity] = useState("2.5");
  const [newZonePortalType, setNewZonePortalType] = useState("");
  const [newZoneParentId, setNewZoneParentId] = useState("");
  const [newZoneGateWidth, setNewZoneGateWidth] = useState("");

  /* ---------------- VOLUNTEER STATE ---------------- */

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);

  /* ---------------- LOAD EVENTS ---------------- */

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/events`);
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
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
        const res = await fetch(`${API_BASE}/events/${selectedEvent}/zones`);
        const data = await res.json();
        setZones(Array.isArray(data) ? data : []);
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
          admin_id: adminId,
          event_name: newEventName,
          location: newEventLocation,
          event_type: newEventType,
          expected_attendance: newExpectedAttendance,
          start_datetime: newStartDatetime,
          end_datetime: newEndDatetime
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Event created");
        setEvents((prev) => [...(prev || []), data]);
        setNewEventName("");
        setNewEventLocation("");
        setNewEventType("");
        setNewExpectedAttendance("");
        setNewStartDatetime("");
        setNewEndDatetime("");
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
          length_m: parseFloat(newZoneLength),
          width_m: parseFloat(newZoneWidth),
          safe_density_limit: parseFloat(newZoneSafeDensity) || 2.5,
          portal_type: newZonePortalType || null,
          parent_zone_id: newZoneParentId ? parseInt(newZoneParentId) : null,
          gate_width: newZoneGateWidth ? parseFloat(newZoneGateWidth) : null
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Zone created");
        setZones((prev) => [...(prev || []), data]);
        setNewZoneName("");
        setNewZoneType("");
        setNewZoneLength("");
        setNewZoneWidth("");
        setNewZonePortalType("");
        setNewZoneParentId("");
        setNewZoneGateWidth("");
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
              newEventType={newEventType}
              setNewEventType={setNewEventType}
              newExpectedAttendance={newExpectedAttendance}
              setNewExpectedAttendance={setNewExpectedAttendance}
              newStartDatetime={newStartDatetime}
              setNewStartDatetime={setNewStartDatetime}
              newEndDatetime={newEndDatetime}
              setNewEndDatetime={setNewEndDatetime}
              createEvent={createEvent}
              createZone={createZone}
              newZoneName={newZoneName}
              setNewZoneName={setNewZoneName}
              newZoneType={newZoneType}
              setNewZoneType={setNewZoneType}
              newZoneLength={newZoneLength}
              setNewZoneLength={setNewZoneLength}
              newZoneWidth={newZoneWidth}
              setNewZoneWidth={setNewZoneWidth}
              newZoneSafeDensity={newZoneSafeDensity}
              setNewZoneSafeDensity={setNewZoneSafeDensity}
              newZonePortalType={newZonePortalType}
              setNewZonePortalType={setNewZonePortalType}
              newZoneParentId={newZoneParentId}
              setNewZoneParentId={setNewZoneParentId}
              newZoneGateWidth={newZoneGateWidth}
              setNewZoneGateWidth={setNewZoneGateWidth}
              zones={zones}
            />
          )}

          {activeTab === "deployment" && (
            <DeploymentTab
              pendingApprovals={pendingApprovals}
              loadingApprovals={loadingApprovals}
              approveVolunteer={approveVolunteer}
              adminId={adminId}
            />
          )}

          {activeTab === "analysis" && <AnalysisTab />}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "monitoring" && (
            <MonitoringTab
              selectedEvent={selectedEvent}
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
  newEventType,
  setNewEventType,
  newExpectedAttendance,
  setNewExpectedAttendance,
  newStartDatetime,
  setNewStartDatetime,
  newEndDatetime,
  setNewEndDatetime,
  createEvent,
  createZone,
  newZoneName,
  setNewZoneName,
  newZoneType,
  setNewZoneType,
  newZoneLength,
  setNewZoneLength,
  newZoneWidth,
  setNewZoneWidth,
  newZoneSafeDensity,
  setNewZoneSafeDensity,
  newZonePortalType,
  setNewZonePortalType,
  newZoneParentId,
  setNewZoneParentId,
  newZoneGateWidth,
  setNewZoneGateWidth,
  zones
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

          <input
            placeholder="Event Type (e.g. concert, sports)"
            value={newEventType}
            onChange={(e) => setNewEventType(e.target.value)}
          />
          
          <input
            placeholder="Expected Attendance"
            type="number"
            value={newExpectedAttendance}
            onChange={(e) => setNewExpectedAttendance(e.target.value)}
          />

          <input
            placeholder="Start Date and Time"
            type="datetime-local"
            value={newStartDatetime}
            onChange={(e) => setNewStartDatetime(e.target.value)}
          />

          <input
            placeholder="End Date and Time"
            type="datetime-local"
            value={newEndDatetime}
            onChange={(e) => setNewEndDatetime(e.target.value)}
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

          {(events || []).map((event) => (
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

            <input placeholder="Zone Name" value={newZoneName} onChange={(e)=>setNewZoneName(e.target.value)} />
            
            <select className="styled-select" value={newZoneType} onChange={(e)=>setNewZoneType(e.target.value)}>
              <option value="">Select Zone Type</option>
              <option value="main">Main Zone</option>
              <option value="portal">Portal Gate</option>
            </select>

            <input placeholder="Length in meters" type="number" value={newZoneLength} onChange={(e)=>setNewZoneLength(e.target.value)} />
            <input placeholder="Width in meters" type="number" value={newZoneWidth} onChange={(e)=>setNewZoneWidth(e.target.value)} />
            <input placeholder="Safe Density Limit (e.g. 2.5)" type="number" step="0.1" value={newZoneSafeDensity} onChange={(e)=>setNewZoneSafeDensity(e.target.value)} />
            
            {newZoneType === "portal" && (
              <>
                <select className="styled-select" value={newZonePortalType} onChange={(e)=>setNewZonePortalType(e.target.value)}>
                  <option value="">Portal Configuration</option>
                  <option value="entry">Entry Only</option>
                  <option value="exit">Exit Only</option>
                  <option value="both">Both (Entry & Exit)</option>
                </select>

                <select className="styled-select" value={newZoneParentId} onChange={(e)=>setNewZoneParentId(e.target.value)}>
                  <option value="">Select Parent Main Zone</option>
                  {(zones || []).filter(z => z.zone_type === "main").map(mz => (
                    <option key={mz.zone_id} value={mz.zone_id}>
                      {mz.zone_name} (ID: {mz.zone_id})
                    </option>
                  ))}
                </select>

                <input placeholder="Gate Width in meters" type="number" value={newZoneGateWidth} onChange={(e)=>setNewZoneGateWidth(e.target.value)} />
              </>
            )}

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

const DeploymentTab = ({ pendingApprovals, loadingApprovals, approveVolunteer, adminId }) => {

  const [deployments, setDeployments] = useState([]);
  const [loadingDeploy, setLoadingDeploy] = useState(true);

  useEffect(() => {
    if (!adminId) return;
    const fetchDeployments = async () => {
      setLoadingDeploy(true);
      try {
        const res = await fetch(`${API_BASE}/admin-deployments/${adminId}`);
        const data = await res.json();
        setDeployments(Array.isArray(data) ? data : []);
      } catch {
        console.error("Could not load deployments");
      }
      setLoadingDeploy(false);
    };
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 15000);
    return () => clearInterval(interval);
  }, [adminId]);

  const statusColor = (s) => {
    if (s === "accepted") return "#22c55e";
    if (s === "rejected") return "#ef4444";
    return "#f59e0b";
  };

  return (
    <div className="tab-view">

      <header className="view-header">
        <h1 className="text-black">Volunteer Deployment</h1>
      </header>

      {/* APPROVALS SECTION */}
      <section className="dashboard-card shadow-sm">

        <div className="section-header-row">
          <h3>Volunteer Approvals</h3>
          <span className="badge-count">
            {pendingApprovals.length} Pending
          </span>
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
                  <td><span className="role-badge">{v.role}</span></td>
                  <td>
                    <button className="btn-approve-action" onClick={() => approveVolunteer(v)}>
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </section>

      {/* DEPLOYMENT SCHEDULE SECTION */}
      <section className="dashboard-card shadow-sm" style={{ marginTop: "24px" }}>

        <div className="section-header-row">
          <h3>Deployment Schedule</h3>
          <span className="badge-count">
            {deployments.length} Assignments
          </span>
        </div>

        {loadingDeploy ? (
          <div className="empty-state">Loading deployment schedule...</div>
        ) : deployments.length === 0 ? (
          <div className="empty-state">No deployments published yet. Volunteers are auto-assigned 24 hours before each event.</div>
        ) : (
          Object.values(
            deployments.reduce((acc, d) => {
              const eventId = d.event_id;
              if (!acc[eventId]) {
                acc[eventId] = {
                  event: d.events,
                  assignments: [],
                };
              }
              acc[eventId].assignments.push(d);
              return acc;
            }, {})
          ).map((group) => (
            <div key={group.event.event_id} style={{ marginBottom: "2rem" }}>
              <div style={{ 
                background: "#f8fafc", 
                padding: "12px 16px", 
                borderRadius: "8px", 
                borderLeft: "4px solid #3b82f6",
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <h4 style={{ margin: 0, color: "#1e293b" }}>
                  {group.event.event_name}
                </h4>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {new Date(group.event.start_datetime).toLocaleDateString("en-US", {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              </div>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>Zone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {group.assignments.map((d) => (
                    <tr key={d.deployment_id}>
                      <td>{d.profiles?.full_name || "Unknown"}</td>
                      <td>{d.zones?.zone_name || "General Backup"}</td>
                      <td>
                        <span
                          className="role-badge"
                          style={{ backgroundColor: statusColor(d.deployment_status), color: "#fff" }}
                        >
                          {d.deployment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
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

const MonitoringTab = ({ selectedEvent, zones, blockGate, unblockGate, triggerExitPlan }) => {

  const [selectedZone, setSelectedZone] = useState(null);
  const [readings, setReadings] = useState([]);
  const [liveStatus, setLiveStatus] = useState([]);

  // 1. Poll live status for the WHOLE EVENT
  useEffect(() => {
    if (!selectedEvent) return;

    const fetchLiveStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/events/${selectedEvent}/live-status`);
        const data = await res.json();
        setLiveStatus(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Could not load live status", err);
      }
    };

    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 5000);
    return () => clearInterval(interval);
  }, [selectedEvent]);

  // 2. Poll readings for a SPECIFIC ZONE (Chart view)
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

  const getStatusColor = (density, limit) => {
    const ratio = density / limit;
    if (ratio >= 0.9) return "#ef4444"; // Red (Critical)
    if (ratio >= 0.7) return "#f59e0b"; // Orange (Busy)
    return "#22c55e"; // Green (Safe)
  };

  return (
    <div className="tab-view">

      <header className="view-header">
        <h1>Live Monitoring</h1>
        <p>Real-time updates every 5 seconds</p>
      </header>

      {/* EVENT SUMMARY GRID */}
      {selectedEvent && liveStatus.length > 0 && (
        <div className="live-summary-grid" style={{ marginBottom: "40px" }}>
          {liveStatus.map((zone) => (
            <div 
              key={zone.zone_id} 
              className="dashboard-card status-card"
              style={{ 
                borderLeft: `6px solid ${getStatusColor(zone.density_value, zone.safe_limit)}`,
                cursor: "pointer"
              }}
              onClick={() => setSelectedZone(zone.zone_id)}
            >
              <div className="status-card-header">
                <div>
                  <h3 style={{ margin: 0 }}>{zone.zone_name}</h3>
                  <span className={`role-badge ${zone.zone_type}`}>
                    {zone.zone_type.toUpperCase()}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="big-stat">{zone.people_count}</div>
                  <small>PEOPLE</small>
                </div>
              </div>
              
              <div className="status-card-footer" style={{ marginTop: "15px" }}>
                <div>
                  <strong>Density:</strong> {zone.density_value.toFixed(2)} p/m²
                </div>
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  Limit: {zone.safe_limit} p/m²
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ZONE SELECTOR FOR CHART */}
      <div className="dashboard-card">
        <h3>Detailed Intelligence</h3>
        <select
          className="styled-select"
          value={selectedZone || ""}
          onChange={(e) => setSelectedZone(e.target.value || null)}
        >
          <option value="">Choose a zone for trend analysis...</option>
          {zones.map((z) => (
            <option key={z.zone_id} value={z.zone_id}>
              {z.zone_name} ({z.zone_type})
            </option>
          ))}
        </select>
      </div>

      {/* CHART VIEW */}
      {selectedZone && (
        <div className="dashboard-card" style={{ marginTop: "24px" }}>
          <div className="chart-header">
            <h2>{zones.find(z => z.zone_id == selectedZone)?.zone_name} Trend</h2>
            <div className="current-count-display">
              <span className="count-val">{latestCount}</span>
              <span className="count-label">Current Count</span>
            </div>
          </div>

          <div
            className="bar-chart-container"
            style={{
              display: "flex",
              gap: "8px",
              height: "200px",
              alignItems: "flex-end",
              marginTop: "40px",
              padding: "0 10px",
              borderBottom: "2px solid #eee"
            }}
          >
            {readings.map((r, index) => (
              <div
                key={index}
                className="chart-bar"
                style={{
                  flex: 1,
                  height: `${(r.people_count / maxCount) * 200}px`,
                  background: getStatusColor(r.density_value, zones.find(z => z.zone_id == selectedZone)?.safe_density_limit || 2.5),
                  borderRadius: "4px 4px 0 0",
                  minHeight: "4px",
                  transition: "height 0.3s ease"
                }}
                title={`Time: ${new Date(r.timestamp).toLocaleTimeString()}\nCount: ${r.people_count}`}
              />
            ))}
          </div>
          
          <div className="zone-controls" style={{ marginTop: "40px", display: "flex", gap: "10px" }}>
             <button className="btn-outline" onClick={() => blockGate(selectedZone)}>Block Gate</button>
             <button className="btn-outline" onClick={() => unblockGate(selectedZone)}>Unblock Gate</button>
             <button className="btn-primary" style={{ backgroundColor: "#ef4444" }} onClick={() => triggerExitPlan(selectedZone)}>Trigger Exit Plan</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;