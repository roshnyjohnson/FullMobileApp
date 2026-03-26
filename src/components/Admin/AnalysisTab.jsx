import React, { useState, useEffect } from "react";
import { API_BASE } from "../../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

const AnalysisTab = ({ selectedEvent, setSelectedEvent, events }) => {
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch zones + alerts + historical readings
  const fetchData = async () => {
    if (!selectedEvent) {
      setLoading(false);
      return;
    }

    try {
      const [zonesRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/events/${selectedEvent}/zones`),
        fetch(`${API_BASE}/alerts`)
      ]);

      const zonesData = await zonesRes.json();
      const alertsData = await alertsRes.json();

      // Wait to set zones until we have their live counts
      setAlerts(alertsData || []);

      // Fetch readings for each zone to build historical trend
      if (zonesData && zonesData.length > 0) {
        const readingsPromises = zonesData.map(z => 
          fetch(`${API_BASE}/readings/${z.zone_id}?limit=20`).then(r => r.json())
        );
        const allReadings = await Promise.all(readingsPromises);
        
        const combined = {};
        allReadings.forEach((zoneReadings, idx) => {
          const zoneName = zonesData[idx].zone_name;
          zoneReadings.forEach(r => {
            const time = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (!combined[time]) combined[time] = { time };
            combined[time][zoneName] = r.density_value;
          });
        });

        const zonesWithLiveCounts = zonesData.map((z, idx) => {
          const latestReading = allReadings[idx] && allReadings[idx].length > 0 ? allReadings[idx][0] : null;
          return {
            ...z,
            current_people_count: latestReading ? latestReading.people_count : 0
          };
        });
        
        setZones(zonesWithLiveCounts);
        setHistoricalData(Object.values(combined).sort((a,b) => a.time.localeCompare(b.time)));
      } else {
        setZones(zonesData || []);
      }

    } catch (err) {
      console.error("Could not load analysis data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [selectedEvent]);

  const getRiskColor = (riskLevel) => {
    if (!riskLevel) return "#22c55e";
    const r = riskLevel.toUpperCase();
    if (r.includes("STAMPEDE") || r.includes("RESTRICT")) return "#ef4444";
    if (r.includes("CONTROL")) return "#f59e0b";
    return "#22c55e";
  };

  // Data for Bar Chart: Capacity vs Current
  const capacityData = zones.map(z => ({
    name: z.zone_name,
    capacity: z.max_capacity,
    current: z.current_people_count || 0
  }));

  if (loading) {
    return <div className="empty-state" style={{ padding: "100px" }}>Analyzing ecosystem metrics...</div>;
  }

  return (
    <div className="analysis-view" style={{ padding: "20px" }}>
      <header className="view-header" style={{ marginBottom: "30px" }}>
        <div>
          <h1>Intelligence Dashboard</h1>
          <p>Advanced analytics and predictive insights</p>
        </div>
        <div className="event-picker" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontWeight: "600", fontSize: "0.9rem", color: "#64748b" }}>Active Event:</label>
            <select 
                value={selectedEvent || ""} 
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="styled-select"
                style={{ minWidth: "250px" }}
            >
                <option value="" disabled>Select an unfolding event...</option>
                {(events || []).map((ev) => (
                    <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>
                ))}
            </select>
        </div>
      </header>

      {!selectedEvent ? (
          <div className="dashboard-card" style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📈</div>
            <h2>No Event Selected</h2>
            <p style={{ color: "#64748b" }}>Please select an event from the selector above to analyze its data.</p>
          </div>
      ) : (
      <div className="analysis-layout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* LATEST TRENDS */}
        <div className="dashboard-card shadow-sm" style={{ gridColumn: "span 2" }}>
          <h3>Density Trends (People per m²)</h3>
          <div style={{ width: '100%', height: 350, marginTop: "20px" }}>
            <ResponsiveContainer>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                {zones.map((z, i) => (
                  <Line 
                    key={z.zone_id} 
                    type="monotone" 
                    dataKey={z.zone_name} 
                    stroke={`hsl(${i * 137.5 % 360}, 70%, 50%)`} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CAPACITY COMPARISON */}
        <div className="dashboard-card shadow-sm">
          <h3>Zone Occupancy vs Capacity</h3>
          <div style={{ width: '100%', height: 300, marginTop: "20px" }}>
            <ResponsiveContainer>
              <BarChart data={capacityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Legend />
                <Bar 
                  dataKey="current" 
                  fill="#3b82f6" 
                  radius={[0, 4, 4, 0]} 
                  name="Current People" 
                  minPointSize={4}
                  label={{ position: 'right', fill: '#3b82f6', fontSize: 12, fontWeight: 'bold' }} 
                />
                <Bar dataKey="capacity" fill="#e2e8f0" radius={[0, 4, 4, 0]} name="Safe Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ALERT LOG */}
        <div className="dashboard-card shadow-sm">
          <h3>Incident Log</h3>
          <div className="mini-alert-list" style={{ marginTop: "15px", maxHeight: "280px", overflowY: "auto" }}>
            {alerts.slice(0, 10).map((alert) => (
              <div 
                key={alert.id} 
                style={{ 
                  padding: "12px", 
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center"
                }}
              >
                <div style={{ 
                  width: "10px", 
                  height: "10px", 
                  borderRadius: "50%", 
                  backgroundColor: getRiskColor(alert.risk_level),
                  flexShrink: 0
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{alert.risk_level}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{alert.recommended_action}</div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {alerts.length === 0 && <div className="empty-state">No incidents recorded.</div>}
          </div>
        </div>

      </div>
      )}
    </div>
  );
};

export default AnalysisTab;
