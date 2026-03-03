import React, { useState } from "react";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("deployment");

  // --- STATE MANAGEMENT (Volunteers) ---
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 1, name: "Suresh Das", email: "suresh@v.com", experience: "Crowd Control" },
    { id: 2, name: "Meera Nair", email: "meera@v.com", experience: "First Aid" },
  ]);

  const [availablePool, setAvailablePool] = useState([]);

  const [teams, setTeams] = useState([
    { id: "T1", name: "Team Alpha", location: "Zone 1", volunteer: "Rahul K.", status: "Accepted" },
    { id: "T2", name: "Team Bravo", location: "Zone 4", volunteer: "Anjali M.", status: "Rejected" }
  ]);

  // --- LOGIC FUNCTIONS ---
  const approveVolunteer = (volunteer) => {
    setPendingApprovals(pendingApprovals.filter(v => v.id !== volunteer.id));
    setAvailablePool([...availablePool, volunteer]);
    alert(`${volunteer.name} added to the available pool!`);
  };

  const reassignVolunteer = (teamId) => {
    if (availablePool.length === 0) {
      alert("No volunteers available in the pool!");
      return;
    }

    const newVolunteer = availablePool[0];

    setTeams(
      teams.map(t =>
        t.id === teamId
          ? { ...t, volunteer: newVolunteer.name, status: "Pending" }
          : t
      )
    );

    setAvailablePool(availablePool.slice(1));
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
          </nav>

          <button className="logout-button">Logout</button>
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
        <button className="btn-primary">+ Add New Team</button>
      </div>
    </header>

    <section className="dashboard-card shadow-sm">
      <div className="section-header-row">
        <h3 className="text-black">Volunteer Approvals</h3>
        <span className="badge-count">{pendingApprovals.length} Pending</span>
      </div>

      <div className="modern-table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Volunteer Name</th>
              <th>Specialization</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingApprovals.map(v => (
              <tr key={v.id}>
                <td className="text-bold-black">{v.name}</td>
                <td className="text-slate">{v.experience}</td>
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

        {pendingApprovals.length === 0 && (
          <div className="empty-state">All registration requests cleared.</div>
        )}
      </div>
    </section>

    <section className="teams-section">
      <h3 className="text-black">Active Teams & Tracking</h3>

      <div className="team-grid">
        {teams.map(team => (
          <div
            key={team.id}
            className={`team-card shadow-sm ${
              team.status === "Rejected" ? "rejected-border" : ""
            }`}
          >
            <div className={`team-status ${team.status.toLowerCase()}`}>
              {team.status}
            </div>

            <h4 className="text-black">{team.name}</h4>
            <p className="text-slate"><strong>Location:</strong> {team.location}</p>
            <p className="text-slate"><strong>Assigned:</strong> {team.volunteer}</p>

            {team.status === "Rejected" ? (
              <button
                className="btn-danger"
                onClick={() => reassignVolunteer(team.id)}
              >
                Reassign from Pool
              </button>
            ) : (
              <button className="btn-secondary">Manage Team</button>
            )}
          </div>
        ))}
      </div>
    </section>

  </div>
);

/* ---------------- ANALYSIS TAB ---------------- */

const AnalysisTab = () => {
  const [zones, setZones] = useState([
    { id: 1, name: "Main Entrance", density: 82 },
    { id: 2, name: "Food Court", density: 45 },
  ]);

  const avgDensity =
    zones.length > 0
      ? Math.round(zones.reduce((acc, z) => acc + z.density, 0) / zones.length)
      : 0;

  const addZone = () => {
    const zoneName = prompt("Enter Zone Name:");
    if (zoneName) {
      const newId =
        zones.length > 0 ? Math.max(...zones.map(z => z.id)) + 1 : 1;
      setZones([...zones, { id: newId, name: zoneName, density: 0 }]);
    }
  };

  const deleteZone = (id) => {
    if (window.confirm("Remove this zone?")) {
      setZones(zones.filter(z => z.id !== id));
    }
  };

  return (
    <div className="analysis-page-layout">

      <header className="view-header">
        <h1 className="text-black">Live Crowd Analysis</h1>
        <button className="btn-add-zone" onClick={addZone}>
          + Add Zone
        </button>
      </header>

      <div className="card overview-card shadow-sm">
        <h2 className="big-number text-black">{avgDensity}%</h2>
      </div>

      <div className="zone-card-grid">
        {zones.map(zone => (
          <div
            key={zone.id}
            className={`zone-card shadow-sm ${
              zone.density >= 80 ? "high-risk-border" : "medium-risk-border"
            }`}
          >
            <h4 className="text-black">
              ZONE {zone.id}: {zone.name.toUpperCase()}
            </h4>

            <p>{zone.density}% Density</p>

            <button onClick={() => deleteZone(zone.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

/* ---------------- REPORTS TAB ---------------- */

const ReportsTab = () => (
  <div className="reports-view">
    <header className="view-header">
      <h1 className="text-black">Generate Reports</h1>
    </header>

    <button className="btn-generate-blue">Generate Daily Report</button>
    <button className="btn-generate-purple">Generate Weekly Report</button>
    <button className="btn-configure-green">Custom Report</button>
  </div>
);

export default AdminDashboard;