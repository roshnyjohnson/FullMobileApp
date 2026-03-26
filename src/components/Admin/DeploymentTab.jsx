import React, { useState, useEffect } from "react";
import { API_BASE } from "../../api";

const DeploymentTab = ({ pendingApprovals, loadingApprovals, approveVolunteer, adminId, events, selectedEvent, setSelectedEvent }) => {

  const [deployments, setDeployments] = useState([]);
  const [loadingDeploy, setLoadingDeploy] = useState(true);

  // New state for All Volunteers
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [loadingAllVols, setLoadingAllVols] = useState(true);

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

    const fetchAllVolunteers = async () => {
      setLoadingAllVols(true);
      try {
        const res = await fetch(`${API_BASE}/admin-volunteers/${adminId}`);
        const data = await res.json();
        setAllVolunteers(Array.isArray(data) ? data : []);
      } catch {
        console.error("Could not load all volunteers");
      }
      setLoadingAllVols(false);
    };

    fetchDeployments();
    fetchAllVolunteers();

    const interval = setInterval(() => {
      fetchDeployments();
      fetchAllVolunteers();
    }, 15000);
    return () => clearInterval(interval);
  }, [adminId]);

  const statusColor = (s) => {
    if (s === "accepted") return "#22c55e";
    if (s === "rejected") return "#ef4444";
    return "#f59e0b";
  };

  const publishDeployment = async () => {
    if (!selectedEvent) return alert("Please select an event first.");
    try {
      const res = await fetch(`${API_BASE}/deploy-volunteers/${selectedEvent}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Volunteers successfully deployed!");
        // Force refresh
        const reloadRes = await fetch(`${API_BASE}/admin-deployments/${adminId}`);
        const reloadData = await reloadRes.json();
        setDeployments(Array.isArray(reloadData) ? reloadData : []);
      } else {
        alert("Deployment Failed: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      alert("Network error while deploying volunteers.");
    }
  };

  return (
    <div className="tab-view">

      <header className="view-header" style={{ marginBottom: "30px" }}>
        <div>
          <h1 className="text-black">Volunteer Deployment</h1>
          <p>Manage and deploy your workforce</p>
        </div>
        
        {/* EVENT SELECTOR IN DEPLOYMENT TAB */}
        <div className="event-picker" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "15px" }}>
            <label style={{ fontWeight: "600", fontSize: "0.9rem", color: "#64748b" }}>Active Event:</label>
            <select 
                value={selectedEvent || ""} 
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="styled-select"
                style={{ minWidth: "250px" }}
            >
                <option value="" disabled>Select an event to deploy...</option>
                {(events || []).map((ev) => (
                    <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>
                ))}
            </select>
        </div>
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

        <div className="section-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <h3>Deployment Schedule</h3>
            <span className="badge-count">
              {deployments.length} Assignments
            </span>
          </div>
          
          <button 
            className="btn-primary" 
            style={{ padding: "8px 16px", fontSize: "0.9rem", opacity: selectedEvent ? 1 : 0.5 }}
            onClick={publishDeployment}
            disabled={!selectedEvent}
          >
           🚀 Auto-Deploy Volunteers
          </button>
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
            <div key={group.event?.event_id || Math.random()} style={{ marginBottom: "2rem" }}>
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
                  {group.event?.event_name || "Unknown Event"}
                </h4>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {group.event?.start_datetime ? new Date(group.event.start_datetime).toLocaleDateString("en-US", {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  }) : "Date Unknown"}
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

      {/* ALL VOLUNTEERS SECTION */}
      <section className="dashboard-card shadow-sm" style={{ marginTop: "24px" }}>
        <div className="section-header-row">
          <h3>All Active Volunteers</h3>
          <span className="badge-count">
            {allVolunteers.length} Active
          </span>
        </div>

        {loadingAllVols ? (
          <div className="empty-state">Loading active volunteers...</div>
        ) : allVolunteers.length === 0 ? (
          <div className="empty-state">No approved volunteers found under your administration.</div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Volunteer Name</th>
                <th>Phone</th>
                <th>Current Zone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allVolunteers.map((v) => (
                <tr key={v.id}>
                  <td>{v.full_name}</td>
                  <td>{v.phone || "N/A"}</td>
                  <td>{v.zone_name}</td>
                  <td>
                    <span
                      className="role-badge"
                      style={{ 
                        backgroundColor: v.status === "Not Deployed" ? "#9ca3af" : statusColor(v.status), 
                        color: "#fff" 
                      }}
                    >
                      {v.status}
                    </span>
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

export default DeploymentTab;
