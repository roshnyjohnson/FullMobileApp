import React from "react";

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

export default EventControlTab;
