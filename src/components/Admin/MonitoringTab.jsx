import React, { useState, useEffect } from "react";
import { API_BASE } from "../../api";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';

const MonitoringTab = ({ selectedEvent, setSelectedEvent, events, blockGate, unblockGate, triggerExitPlan }) => {

  const [liveStatus, setLiveStatus] = useState([]);
  const [histories, setHistories] = useState({});
  const historyLimit = 20;

  // 1. Initial Load: Get historical data for ALL zones in this event
  useEffect(() => {
    if (!selectedEvent) {
        setLiveStatus([]);
        setHistories({});
        return;
    }

    const fetchAllHistories = async () => {
      try {
        const res = await fetch(`${API_BASE}/events/${selectedEvent}/zones`);
        const eventZones = await res.json();
        
        const historyPromises = eventZones.map(z => 
          fetch(`${API_BASE}/readings/${z.zone_id}?limit=${historyLimit}`).then(r => r.json())
        );
        
        const results = await Promise.all(historyPromises);
        const newHistories = {};
        
        eventZones.forEach((z, idx) => {
          newHistories[z.zone_id] = results[idx].reverse();
        });
        
        setHistories(newHistories);
      } catch (err) {
        console.error("Failed to initialize histories", err);
      }
    };

    fetchAllHistories();
  }, [selectedEvent]);


  // 2. Poll live status and update histories
  useEffect(() => {
    if (!selectedEvent) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/events/${selectedEvent}/live-status`);
        const data = await res.json();
        const statusArray = Array.isArray(data) ? data : [];
        setLiveStatus(statusArray);

        setHistories(prev => {
          const next = { ...prev };
          statusArray.forEach(zone => {
            const currentHistory = next[zone.zone_id] || [];
            const newHistory = [...currentHistory, { 
              people_count: zone.people_count, 
              density_value: zone.density_value,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }];
            next[zone.zone_id] = newHistory.slice(-historyLimit);
          });
          return next;
        });

      } catch (err) {
        console.error("Polling failed", err);
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [selectedEvent]);


  const getStatusColor = (density, limit) => {
    const ratio = density / (limit || 2.5);
    if (ratio >= 0.9) return "#ef4444"; 
    if (ratio >= 0.7) return "#f59e0b"; 
    return "#22c55e"; 
  };

  return (
    <div className="tab-view monitoring-view">

      <header className="view-header" style={{ marginBottom: "30px" }}>
        <div>
            <h1>Command Center Live</h1>
            <p>Real-time telemetry and crowd metrics</p>
        </div>
        
        {/* EVENT SELECTOR IN MONITORING TAB */}
        <div className="event-picker" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontWeight: "600", fontSize: "0.9rem", color: "#64748b" }}>Active Event:</label>
            <select 
                value={selectedEvent || ""} 
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="styled-select"
                style={{ minWidth: "250px" }}
            >
                <option value="" disabled>Select an unfolding event...</option>
                {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.event_name}</option>
                ))}
            </select>
        </div>
      </header>

      {!selectedEvent ? (
          <div className="dashboard-card" style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📡</div>
            <h2>No Event Selected</h2>
            <p style={{ color: "#64748b" }}>Please select an event from the selector above to begin real-time monitoring.</p>
          </div>
      ) : (
          <>
            {/* KPI STRIP */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                <div className="dashboard-card" style={{ padding: "15px 20px" }}>
                    <small style={{ color: "#64748b", fontWeight: "700", letterSpacing: "1px" }}>TOTAL POPULATION</small>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#2563eb" }}>
                        {liveStatus.reduce((acc, curr) => acc + curr.people_count, 0)}
                    </div>
                </div>
                <div className="dashboard-card" style={{ padding: "15px 20px" }}>
                    <small style={{ color: "#64748b", fontWeight: "700", letterSpacing: "1px" }}>ACTIVE ZONES</small>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800" }}>{liveStatus.length}</div>
                </div>
                <div className="dashboard-card" style={{ padding: "15px 20px" }}>
                    <small style={{ color: "#64748b", fontWeight: "700", letterSpacing: "1px" }}>PEAK DENSITY</small>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ef4444" }}>
                        {Math.max(...liveStatus.map(z => z.density_value), 0).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* ZONES DATA GRID */}
            <div className="live-summary-grid">
                {liveStatus.map((zone) => {
                    const zoneHistory = histories[zone.zone_id] || [];
                    const color = getStatusColor(zone.density_value, zone.safe_limit);

                    return (
                        <div 
                            key={zone.zone_id} 
                            className="dashboard-card"
                            style={{ 
                                borderLeft: `6px solid ${color}`, 
                                display: "flex", 
                                flexDirection: "column",
                                padding: "20px" 
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{zone.zone_name}</h3>
                                    <span className={`role-badge ${zone.zone_type}`} style={{ fontSize: "0.65rem", marginTop: "4px", display: "inline-block" }}>
                                        {zone.zone_type.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: color, lineHeight: 1 }}>{zone.people_count}</div>
                                    <small style={{ fontWeight: "700", color: "#64748b", fontSize: "0.65rem" }}>PEOPLE</small>
                                </div>
                            </div>

                            {/* SPARKLINE */}
                            <div style={{ height: "100px", margin: "15px 0" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={zoneHistory}>
                                        <defs>
                                            <linearGradient id={`grad-${zone.zone_id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.8rem' }}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <Area 
                                            type="stepAfter" 
                                            dataKey="people_count" 
                                            stroke={color} 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill={`url(#grad-${zone.zone_id})`} 
                                            isAnimationActive={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "0.8rem", marginBottom: "15px", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                                <span><strong>Density:</strong> {zone.density_value.toFixed(2)}</span>
                                <span style={{ color: "#64748b" }}>Safe Limit: {zone.safe_limit}</span>
                            </div>

                            <div style={{ display: "flex", gap: "6px" }}>
                                <button className="btn-outline" style={{ flex: 1, fontSize: "0.7rem", padding: "5px" }} onClick={() => blockGate(zone.zone_id)}>BLOCK</button>
                                <button className="btn-outline" style={{ flex: 1, fontSize: "0.7rem", padding: "5px" }} onClick={() => unblockGate(zone.zone_id)}>OPEN</button>
                                <button className="btn-primary" style={{ flex: 1.5, fontSize: "0.7rem", padding: "5px", backgroundColor: "#ef4444" }} onClick={() => triggerExitPlan(zone.zone_id)}>EMERGENCY</button>
                            </div>
                        </div>
                    );
                })}
            </div>
          </>
      )}

    </div>
  );
};

export default MonitoringTab;
