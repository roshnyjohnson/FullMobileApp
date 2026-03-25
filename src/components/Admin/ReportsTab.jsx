import React, { useState } from "react";
import { API_BASE } from "../../api";

const ReportsTab = ({ selectedEvent, events, setSelectedEvent }) => {

  // Custom Report State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customFormat, setCustomFormat] = useState("pdf");

  const generateReport = async (type) => {
    if (!selectedEvent) {
      alert("Please select an event from the Event Control tab first.");
      return;
    }

    try {

      const response = await fetch(`${API_BASE}/reports/${type}?event_id=${selectedEvent}`);

      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Report generation failed");
    }

  };


  const generateCustomReport = async () => {
    if (!selectedEvent) {
      alert("Please select an event from the Event Control tab first.");
      return;
    }

    if (!customStart || !customEnd) {
      alert("Please select both start and end dates.");
      return;
    }

    try {
      // Create valid ISO strings
      const startIso = new Date(customStart).toISOString();
      const endIso = new Date(customEnd).toISOString();

      const url = `${API_BASE}/reports/custom?start_date=${encodeURIComponent(startIso)}&end_date=${encodeURIComponent(endIso)}&format=${customFormat}&event_id=${selectedEvent}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch custom report");
      }

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = `custom-report.${customFormat}`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(fileUrl);
      
      setShowCustomModal(false);

    } catch (err) {
      console.error(err);
      alert("Custom report generation failed");
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

      {/* EVENT SELECTION DROPDOWN */}
      <div className="dashboard-card" style={{ marginBottom: "20px" }}>
        <h3>Report Target Event</h3>
        <p style={{ color: "#666", marginBottom: "10px" }}>Select the event you want to generate reports for:</p>
        <select
          className="styled-select"
          value={selectedEvent || ""}
          onChange={(e) => setSelectedEvent(e.target.value)}
          style={{ width: "100%", maxWidth: "400px" }}
        >
          <option value="">-- Choose an Event --</option>
          {events && events.map((ev) => (
            <option key={ev.event_id} value={ev.event_id}>
              {ev.name} ({ev.location})
            </option>
          ))}
        </select>
      </div>

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
            onClick={() => setShowCustomModal(true)}
          >
            Configure
          </button>

        </div>

      </div>

      {/* CUSTOM REPORT MODAL */}
      {showCustomModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Generate Custom Report</h2>
            <p>Select the date range for your report.</p>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label>Start Date & Time</label>
              <input 
                type="datetime-local" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="styled-select"
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label>End Date & Time</label>
              <input 
                type="datetime-local" 
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="styled-select"
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>Format</label>
              <select 
                value={customFormat} 
                onChange={(e) => setCustomFormat(e.target.value)}
                className="styled-select"
                style={{ width: "100%", marginTop: "4px" }}
              >
                <option value="pdf">PDF Document</option>
                <option value="csv">CSV Spreadsheet</option>
              </select>
            </div>

            <div className="modal-actions" style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowCustomModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={generateCustomReport}>Download</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportsTab;
