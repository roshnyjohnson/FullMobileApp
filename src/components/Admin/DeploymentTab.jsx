import React, { useState, useEffect } from "react";
import { API_BASE } from "../../api";

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

export default DeploymentTab;
