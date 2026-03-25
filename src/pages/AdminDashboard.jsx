import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import { API_BASE } from "../api";
import { supabase } from "../supabaseClient";

// Import modular components
import EventControlTab from "../components/Admin/EventControlTab";
import DeploymentTab from "../components/Admin/DeploymentTab";
import AnalysisTab from "../components/Admin/AnalysisTab";
import ReportsTab from "../components/Admin/ReportsTab";
import MonitoringTab from "../components/Admin/MonitoringTab";

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

  /* ---------------- GLOBAL ALERT STATE ---------------- */
  
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  
  // Alert History Drawer State
  const [showHistory, setShowHistory] = useState(false);
  const [allRecentAlerts, setAllRecentAlerts] = useState([]);

  useEffect(() => {
    const fetchGlobalAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE}/alerts`);
        if (res.ok) {
          const data = await res.json();
          setAllRecentAlerts(data || []); // Store all alerts for History
          
          // Filter to only high/critical alerts not yet dismissed
          const critical = (data || []).filter(a => {
             if (dismissedAlerts.has(a.id)) return false;
             if (!a.risk_level) return false;
             const r = a.risk_level.toUpperCase();
             // Pop up for severe situations
             return r.includes("STAMPEDE") || r.includes("EMERGENCY") || r.includes("RESTRICT");
          });
          setActiveAlerts(critical);
        }
      } catch (err) {
        console.error("Global alerts fetch failed", err);
      }
    };
    fetchGlobalAlerts();
    const interval = setInterval(fetchGlobalAlerts, 5000);
    return () => clearInterval(interval);
  }, [dismissedAlerts]);

  const dismissAlert = (id) => {
    setDismissedAlerts(prev => new Set(prev).add(id));
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

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

      {/* GLOBAL ALERT OVERLAY */}
      {activeAlerts.length > 0 && (
        <div className="alert-overlay" style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: "20px", padding: "20px"
        }}>
          {activeAlerts.map(alert => (
            <div key={alert.id} className="alert-toast" style={{
              backgroundColor: "#fff0f0", border: "3px solid #ff4444", borderRadius: "12px",
              padding: "20px 30px", width: "100%", maxWidth: "600px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)", animation: "popIn 0.3s ease-out"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#d32f2f", marginBottom: "15px" }}>
                <h2>⚠️ {alert.risk_level}</h2>
                <button onClick={() => dismissAlert(alert.id)} style={{ background: "none", border: "none", fontSize: "24px", fontWeight: "bold", cursor: "pointer", color: "#999" }}>X</button>
              </div>
              <p style={{ fontSize: "1.1rem", marginBottom: "10px" }}>
                <strong>Zone ID:</strong> {alert.zone_id} | <strong>Time:</strong> {new Date(alert.timestamp).toLocaleTimeString()}
              </p>
              <div style={{ backgroundColor: "#d32f2f", color: "white", padding: "15px", borderRadius: "8px", fontSize: "1.2rem", fontWeight: "bold" }}>
                <strong>ADMIN ACTION REQUIRED:</strong><br/>
                {alert.recommended_action}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-layout">

        {/* SIDEBAR */}

        <aside className="admin-sidebar" style={{ display: "flex", flexDirection: "column" }}>
          <div>
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
          </div>

          <div style={{ marginTop: "auto", marginBottom: "20px" }}>
            <button 
              className="nav-item" 
              onClick={() => setShowHistory(true)}
              style={{ width: "100%", textAlign: "left", color: "#f87171", fontWeight: "bold" }}
            >
              🔔 Alert History
            </button>
            <button className="logout-button" onClick={handleLogout} style={{ marginTop: "10px" }}>
              Logout
            </button>
          </div>
        </aside>

        {/* RIGHT DRAWER: ALERT HISTORY */}
        {showHistory && (
          <div className="alert-history-drawer" style={{
            position: "fixed", top: 0, right: 0, width: "350px", height: "100vh",
            backgroundColor: "#fff", boxShadow: "-5px 0 15px rgba(0,0,0,0.1)", zIndex: 10000,
            display: "flex", flexDirection: "column", animation: "slideInRight 0.3s ease-out"
          }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Alert History</h2>
              <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" }}>&times;</button>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
              {allRecentAlerts.map(alert => (
                <div key={alert.id} style={{
                  padding: "15px", marginBottom: "10px", borderRadius: "8px",
                  borderLeft: `4px solid ${alert.risk_level?.includes('STAMPEDE') || alert.risk_level?.includes('RESTRICT') ? '#ef4444' : '#f59e0b'}`,
                  backgroundColor: "#f9fafb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <strong style={{ color: "#374151" }}>{alert.risk_level}</strong>
                    <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>Zone ID: {alert.zone_id}</div>
                  <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "8px", fontStyle: "italic" }}>
                    {alert.recommended_action}
                  </div>
                </div>
              ))}
              {allRecentAlerts.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                  No recent alerts detected.
                </div>
              )}
            </div>
          </div>
        )}

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
          {activeTab === "reports" && <ReportsTab selectedEvent={selectedEvent} events={events} setSelectedEvent={setSelectedEvent} />}
          {activeTab === "monitoring" && (
            <MonitoringTab
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
              events={events}
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

export default AdminDashboard;