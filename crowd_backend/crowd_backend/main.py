from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
from datetime import datetime, timezone, timedelta
from typing import Optional
from contextlib import asynccontextmanager
from .supabase_config import supabase

# ---------- Background Scheduler ----------
from apscheduler.schedulers.background import BackgroundScheduler

def _auto_deploy_check():
    """Runs every 15 minutes. Finds events starting in 23-24 hours and auto-deploys volunteers."""
    try:
        now = datetime.now(timezone.utc)
        window_start = now + timedelta(hours=23)
        window_end   = now + timedelta(hours=24)

        events_res = supabase.table("events").select("event_id, start_datetime").execute()
        for ev in (events_res.data or []):
            start = datetime.fromisoformat(ev["start_datetime"])
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            if window_start <= start <= window_end:
                # Check if already deployed
                existing = (
                    supabase.table("volunteer_deployments")
                    .select("deployment_id")
                    .eq("event_id", ev["event_id"])
                    .limit(1)
                    .execute()
                )
                if not existing.data:
                    try:
                        _run_deploy_logic(ev["event_id"])
                        print(f"[AUTO-DEPLOY] Deployed volunteers for event {ev['event_id']}")
                    except Exception as e:
                        print(f"[AUTO-DEPLOY] Failed for event {ev['event_id']}: {e}")
    except Exception as e:
        print(f"[AUTO-DEPLOY] Scheduler error: {e}")

scheduler = BackgroundScheduler()
scheduler.add_job(_auto_deploy_check, "interval", minutes=15)

@asynccontextmanager
async def lifespan(app):
    scheduler.start()
    print("[SCHEDULER] Auto-deploy checker started (runs every 15 min)")
    yield
    scheduler.shutdown()
    print("[SCHEDULER] Shut down")

app = FastAPI(title="CrowdSafety API", version="1.0.0", lifespan=lifespan)

# Allow the frontend team to connect from their local dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — ensures CORS headers are always sent
# even when an unexpected server error occurs
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        },
    )

# ==========================================
# MODELS
# ==========================================

class RegisterProfileRequest(BaseModel):
    user_id: str
    full_name: str
    phone: Optional[str] = None
    role: str                                 # 'owner', 'admin', or 'volunteer'
    assigned_admin_id: Optional[str] = None   # Only for volunteers — their admin
    assigned_zone_id: Optional[int] = None    # Only for volunteers — their gate/entry


class CrowdRequest(BaseModel):
    device_id: str       # ID of the phone/camera sending data
    zone_id: int         # Which zone the phone is in
    crowd_count: int     # How many people were detected
    timestamp: datetime  # When it was detected

    @validator("timestamp", pre=True)
    def parse_timestamp(cls, v):
        if isinstance(v, str):
            # Android's Instant.now() sends "2026-02-18T09:39:43Z"
            # Python fromisoformat() needs "+00:00" instead of "Z"
            v = v.replace("Z", "+00:00")
        return v


class ApproveUserRequest(BaseModel):
    approver_id: str   # The person doing the approving (Owner or Admin)
    user_id: str       # The person being approved


class CreateEventRequest(BaseModel):
    admin_id: str                 # UUID of the Admin managing this event
    event_name: str
    event_type: str               # e.g. 'concert', 'religious', 'sports'
    location: str
    expected_attendance: int
    start_datetime: datetime
    end_datetime: datetime


class CreateZoneRequest(BaseModel):
    event_id: int
    zone_name: str
    zone_type: str                        # 'main' or 'portal'
    length_m: float                       # Zone length in metres
    width_m: float                        # Zone width in metres
    safe_density_limit: float = 2.5       # persons/m² before alert fires
    emergency_action: Optional[str] = None
    # Portal-only fields (leave blank for main zones)
    portal_type: Optional[str] = None     # 'entry', 'exit', or 'both'
    parent_zone_id: Optional[int] = None  # Which main zone this portal feeds into
    gate_width: Optional[float] = None    # Gate opening width in metres



# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/")
def home():
    return {"message": "CrowdSafety API is running!"}


# ==========================================
# AUTH & USER APPROVAL APIs
# ==========================================

@app.post("/register-profile")
def register_profile(data: RegisterProfileRequest):
    """
    Called by the frontend AFTER Supabase creates the user account.
    Saves the extra profile info (name, phone, role, assigned admin) to the profiles table.
    All new users start with is_approved = false.
    """
    # Validate: Volunteers must have an assigned_admin_id
    if data.role == "volunteer" and not data.assigned_admin_id:
        raise HTTPException(
            status_code=400,
            detail="Volunteers must select an admin they are assigned to"
        )

    # Validate: Only valid roles are allowed
    if data.role not in ["owner", "admin", "volunteer"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be owner, admin, or volunteer")

    # Save to the profiles table using upsert to avoid duplicate key errors during testing
    supabase.table("profiles").upsert({
        "id": data.user_id,
        "full_name": data.full_name,
        "phone": data.phone,
        "role": data.role,
        "is_approved": False,
        "assigned_admin_id": data.assigned_admin_id,
        "assigned_zone_id": data.assigned_zone_id    # The gate/entry this volunteer guards
    }).execute()

    return {
        "message": f"Profile created for {data.full_name}. Waiting for approval.",
        "role": data.role,
        "is_approved": False
    }


@app.get("/profile/{user_id}")
def get_profile(user_id: str):
    """
    Fetch a user's profile including their role and approval status.
    The frontend calls this right after login to decide which screen to show:
    - is_approved = false  → Show 'Pending Approval' screen
    - role = 'owner'       → Show Owner Dashboard
    - role = 'admin'       → Show Admin Dashboard
    - role = 'volunteer'   → Show Volunteer view
    """
    response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return response.data


@app.get("/admins")
def get_admins():
    """
    Returns a list of all approved admins.
    Used on the Volunteer sign-up form to populate the 'Select your Admin' dropdown.
    """
    response = (
        supabase.table("profiles")
        .select("id, full_name")
        .eq("role", "admin")
        .eq("is_approved", True)
        .execute()
    )
    return response.data


@app.get("/pending-users")
def get_pending_users(approver_id: str, approver_role: str):
    """
    Get a list of users waiting for approval, scoped to the approver.
    - Owner (approver_role='owner') → sees ALL unapproved Admins
    - Admin (approver_role='admin') → sees ONLY their own unapproved Volunteers
    """
    if approver_role == "owner":
        response = (
            supabase.table("profiles")
            .select("id, full_name, role, updated_at")
            .eq("role", "admin")
            .eq("is_approved", False)
            .execute()
        )
    elif approver_role == "admin":
        # Admins ONLY see volunteers assigned specifically to them
        response = (
            supabase.table("profiles")
            .select("id, full_name, role, updated_at")
            .eq("role", "volunteer")
            .eq("is_approved", False)
            .eq("assigned_admin_id", approver_id)
            .execute()
        )
    else:
        raise HTTPException(status_code=403, detail="Only owners and admins can view pending users")

    return response.data


@app.put("/approve-user")
def approve_user(req: ApproveUserRequest):
    """
    One-time approval during sign-up flow.
    - Owner can approve any Admin.
    - Admin can only approve Volunteers assigned to them specifically.
    """
    # Step 1: Get the approver's own profile
    approver_response = supabase.table("profiles").select("*").eq("id", req.approver_id).single().execute()
    approver = approver_response.data

    if not approver or not approver["is_approved"]:
        raise HTTPException(status_code=403, detail="Approver is not authorized")

    # Step 2: Get the target user's profile
    target_response = supabase.table("profiles").select("*").eq("id", req.user_id).single().execute()
    target = target_response.data

    if not target:
        raise HTTPException(status_code=404, detail="User to approve not found")

    # Step 3: Check the hierarchy + assignment rule
    if approver["role"] == "owner" and target["role"] == "admin":
        # Owner can approve any admin
        pass
    elif approver["role"] == "admin" and target["role"] == "volunteer":
        # Admin can only approve THEIR OWN volunteers
        if target.get("assigned_admin_id") != req.approver_id:
            raise HTTPException(
                status_code=403,
                detail="You can only approve volunteers assigned to you"
            )
    else:
        raise HTTPException(
            status_code=403,
            detail=f"A {approver['role']} cannot approve a {target['role']}"
        )

    # Step 4: Do the approval (one-time, sets is_approved = true permanently)
    supabase.table("profiles").update({"is_approved": True}).eq("id", req.user_id).execute()

    return {
        "message": f"{target['full_name']} ({target['role']}) has been approved",
        "approved_by": approver["full_name"]
    }


# ==========================================
# CROWD DATA APIs
# ==========================================

@app.post("/update-crowd")
def update_crowd(data: CrowdRequest):
    """
    Receives crowd count from the mobile app.
    1. Fetches the zone from Supabase to get area and type.
    2. Calculates density.
    3. Saves the reading to the cloud.
    4. Routes to different safety logic based on zone_type.
    """

    # --- PHASE A: Fetch Zone Info from Supabase ---
    zone_response = supabase.table("zones").select("*").eq("zone_id", data.zone_id).single().execute()
    zone = zone_response.data

    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone {data.zone_id} not found")

    # --- PHASE B: Calculations ---
    density = data.crowd_count / zone["area_sqm"]
    is_portal = zone["zone_type"] == "portal"

    # --- PHASE C: Save Reading to Cloud ---
    # Auto-register device to satisfy foreign key constraint "crowd_readings_device_id_fkey"
    try:
        supabase.table("camera_devices").upsert({"device_id": data.device_id}).execute()
    except Exception as e:
        print(f"Device registration warning: {e}")

    supabase.table("crowd_readings").insert({
        "zone_id": data.zone_id,
        "device_id": data.device_id,
        "people_count": data.crowd_count,
        "density_value": round(density, 4)
    }).execute()

    
    # --- PHASE D: Logic Routing ---
    alert_triggered = False

    if is_portal:
        # ---- PORTAL ZONE: Stampede Detection via Physical Density Signals ----
        # Net flow is NOT used here — it's unreliable without directional counting.
        # Instead we use 3 physical signals that together confirm a real stampede:
        #
        # Signal 1: Rapid density jump at this portal between two readings
        #           → The gate area is getting critically packed FAST
        # Signal 2: Parent (main) zone is already at or beyond its safe density limit
        #           → The hall itself is already dangerously full
        # Signal 3: Portal density is critically high (crushing-level)
        #           → Gate area is at a crushing pressure level
        #
        # ALL THREE must be true to avoid false alarms from normal busy gates.

        parent_zone_id = zone.get("parent_zone_id")

        # --- Signal 1: Get previous portal density to detect rapid increase ---
        prev_reading_res = (
            supabase.table("crowd_readings")
            .select("people_count, density_value")
            .eq("zone_id", data.zone_id)
            .order("timestamp", desc=True)
            .limit(1)
            .execute()
        )
        prev_density = prev_reading_res.data[0]["density_value"] if prev_reading_res.data else 0.0
        density_jump = density - prev_density   # How much denser since last reading

        # Rapid jump threshold: density rose by more than 1.5 p/m² in ONE reading
        DENSITY_JUMP_THRESHOLD = 1.5
        signal_1 = density_jump >= DENSITY_JUMP_THRESHOLD

        # --- Signal 2: Is the parent (main) zone already above safe_density_limit? ---
        signal_2 = False
        parent_safe_limit = 2.5   # Default fallback
        if parent_zone_id:
            parent_zone_res = (
                supabase.table("zones")
                .select("safe_density_limit")
                .eq("zone_id", parent_zone_id)
                .single()
                .execute()
            )
            if parent_zone_res.data:
                parent_safe_limit = parent_zone_res.data.get("safe_density_limit", 2.5)

            parent_reading_res = (
                supabase.table("crowd_readings")
                .select("density_value")
                .eq("zone_id", parent_zone_id)
                .order("timestamp", desc=True)
                .limit(1)
                .execute()
            )
            if parent_reading_res.data:
                parent_density = parent_reading_res.data[0]["density_value"]
                signal_2 = parent_density >= parent_safe_limit

        # --- Signal 3: Portal itself is at critical/crushing density ---
        CRITICAL_PORTAL_DENSITY = 3.5   # p/m² — crushing-level at a gate
        signal_3 = density >= CRITICAL_PORTAL_DENSITY

        # --- All 3 signals must fire together → confirmed stampede ---
        stampede_confirmed = signal_1 and signal_2 and signal_3

        if stampede_confirmed:
            supabase.table("risk_status").insert({
                "zone_id": data.zone_id,
                "risk_level": "STAMPEDE RISK",
                "recommended_action": (
                    f"STAMPEDE DETECTED at {zone['zone_name']}. "
                    f"Portal density: {round(density, 2)} p/m² (jump: +{round(density_jump, 2)}). "
                    f"Emergency exit plan activated."
                ),
                "targeted_volunteer_zone_id": data.zone_id
            }).execute()

            alert_triggered = True

            # Auto-trigger exit strategy for the parent zone immediately
            if parent_zone_id:
                try:
                    exit_strategy(parent_zone_id)
                except Exception:
                    pass  # Don't let exit_strategy failure stop the stampede alert

            # --- Auto-deploy general (floating) volunteers to overwhelmed portals ---
            if parent_zone_id:
                try:
                    # Get event_id for this zone (needed to find general volunteers)
                    event_zone_res = (
                        supabase.table("zones")
                        .select("event_id")
                        .eq("zone_id", parent_zone_id)
                        .single()
                        .execute()
                    )
                    event_id_for_zone = event_zone_res.data.get("event_id") if event_zone_res.data else None

                    if event_id_for_zone:
                        # Step A: Get all general (unassigned) volunteers for this event
                        generals_res = (
                            supabase.table("volunteer_deployments")
                            .select("id, volunteer_id, profiles(full_name)")
                            .eq("event_id", event_id_for_zone)
                            .eq("deployment_status", "general")
                            .is_("zone_id", "null")
                            .execute()
                        )
                        generals = generals_res.data or []

                        # Step B: Find all active portals sorted by congestion (most crowded first)
                        # Most crowded portals need help the most
                        portals_for_deploy_res = (
                            supabase.table("zones")
                            .select("zone_id, zone_name, area_sqm")
                            .eq("parent_zone_id", parent_zone_id)
                            .eq("is_emergency_blocked", False)
                            .execute()
                        )
                        portals_for_deploy = portals_for_deploy_res.data or []

                        # Get latest count for each portal and sort by congestion descending
                        portal_congestion = []
                        for p in portals_for_deploy:
                            p_count_res = (
                                supabase.table("crowd_readings")
                                .select("people_count")
                                .eq("zone_id", p["zone_id"])
                                .order("timestamp", desc=True)
                                .limit(1)
                                .execute()
                            )
                            p_count = p_count_res.data[0]["people_count"] if p_count_res.data else 0
                            portal_congestion.append({**p, "current_count": p_count})

                        # Most congested portals assigned first
                        portal_congestion.sort(key=lambda x: x["current_count"], reverse=True)

                        # Step C: Assign 1-2 generals per portal (round-robin across portals)
                        # e.g., 6 generals, 3 portals → 2 per portal
                        GENERALS_PER_PORTAL = max(1, len(generals) // max(1, len(portal_congestion)))
                        g_index = 0

                        for portal in portal_congestion:
                            if g_index >= len(generals):
                                break  # No more generals to assign

                            for _ in range(GENERALS_PER_PORTAL):
                                if g_index >= len(generals):
                                    break

                                general = generals[g_index]
                                vol_name = (general.get("profiles") or {}).get("full_name", "Volunteer")

                                # Update deployment record: assign to this portal
                                supabase.table("volunteer_deployments").update({
                                    "zone_id": portal["zone_id"],
                                    "deployment_status": "emergency_assigned"
                                }).eq("id", general["id"]).execute()

                                # Send personal alert to this volunteer
                                supabase.table("risk_status").insert({
                                    "zone_id": parent_zone_id,
                                    "risk_level": "EMERGENCY ASSIGNMENT",
                                    "recommended_action": (
                                        f"URGENT — {vol_name}, report to {portal['zone_name']} immediately. "
                                        f"You are needed for emergency crowd management. "
                                        f"Portal congestion: {portal['current_count']} people."
                                    ),
                                    "targeted_volunteer_zone_id": portal["zone_id"]
                                }).execute()

                                g_index += 1

                except Exception:
                    pass  # Don't let volunteer assignment failure block the stampede alert


    else:
        # ---- MAIN ZONE: 2-Level Entry Management (Monitor Zones use case) ----
        # Goal: Intervene EARLY so the zone never reaches an unsafe or uncomfortable density.
        # CRITICAL / EVACUATE is NOT handled here — that belongs to the Stampede use case.

        safe_limit         = zone.get("safe_density_limit", 2.5)
        control_threshold  = safe_limit * 0.65   # 65%: zone getting busy — start controlling entry
        restrict_threshold = safe_limit * 0.85   # 85%: zone too full  — stop entry completely
        # We restrict at 85% so density NEVER actually reaches 100% (safe_limit)

        # Check the last alert for this zone (needed to send "RESUME" when safe again)
        last_alert_res = (
            supabase.table("risk_status")
            .select("risk_level")
            .eq("zone_id", data.zone_id)
            .order("timestamp", desc=True)
            .limit(1)
            .execute()
        )
        last_risk_level = last_alert_res.data[0]["risk_level"] if last_alert_res.data else None

        # --- Determine current alert level ---
        # Only 2 levels here — no CRITICAL/EVACUATE (that belongs to Stampede use case)
        if density >= restrict_threshold:
            risk_level = "RESTRICT ENTRY"
            action = "Zone is filling up. Close all entry portals until density drops below safe level."
        elif density >= control_threshold:
            risk_level = "CONTROL ENTRY"
            # How many more people can safely enter before hitting the restrict threshold?
            max_capacity = zone.get("max_capacity") or int(zone["area_sqm"] * safe_limit)
            restrict_capacity = int(max_capacity * 0.85)       # the actual restrict ceiling
            headroom = max(0, restrict_capacity - data.crowd_count)
            action = (
                f"Zone getting busy. Slow down entry. "
                f"Only {headroom} more people can enter before restriction kicks in."
            )
        else:
            risk_level = None  # Density is comfortably within safe range

        # --- Send RESUME ENTRY alert if density just returned to safe ---
        was_restricted = last_risk_level in ["RESTRICT ENTRY", "CONTROL ENTRY"]
        if risk_level is None and was_restricted:
            risk_level = "RESUME ENTRY"
            action = "Density is back to safe levels. Re-open entry portals. Resume normal flow."

        if risk_level:
            alert_triggered = True

            # Find the entry/both portals that serve THIS main zone
            # These are the portals whose volunteers must receive the alert
            portal_res = (
                supabase.table("zones")
                .select("zone_id, zone_name")
                .eq("parent_zone_id", data.zone_id)
                .in_("portal_type", ["entry", "both"])
                .execute()
            )
            entry_portals = portal_res.data or []

            if entry_portals:
                # For CONTROL ENTRY, split the headroom evenly across all entry portals
                # so each volunteer knows exactly how many more people to allow through their gate
                num_portals = len(entry_portals)
                headroom_val = locals().get("headroom", None)  # Only defined for CONTROL ENTRY

                for portal in entry_portals:
                    if risk_level == "CONTROL ENTRY" and headroom_val is not None:
                        per_portal_quota = max(0, headroom_val // num_portals)
                        portal_action = (
                            f"[{portal['zone_name']}] CONTROL ENTRY — "
                            f"Allow max {per_portal_quota} more people through this gate, then hold."
                        )
                    else:
                        portal_action = f"[{portal['zone_name']}] {action}"

                    supabase.table("risk_status").insert({
                        "zone_id": data.zone_id,
                        "risk_level": risk_level,
                        "recommended_action": portal_action,
                        "targeted_volunteer_zone_id": portal["zone_id"]
                    }).execute()
            else:
                # No portals configured — fall back to a general alert for the zone
                supabase.table("risk_status").insert({
                    "zone_id": data.zone_id,
                    "risk_level": risk_level,
                    "recommended_action": action,
                    "targeted_volunteer_zone_id": data.zone_id
                }).execute()

    return {
        "message": "Data saved to Supabase",
        "zone": zone["zone_name"],
        "zone_type": zone["zone_type"],
        "density": round(density, 4),
        "alert_triggered": alert_triggered
    }


@app.get("/all-crowd-data")
def get_all_crowd_data(limit: int = 50):
    """
    Returns latest crowd readings from all zones.
    Added to satisfy mobile app's GET request.
    """
    response = (
        supabase.table("crowd_readings")
        .select("*")
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data

    

@app.get("/zones")
def get_zones():
    """Get all zones for the current event."""
    response = supabase.table("zones").select("*").execute()
    return response.data


@app.get("/readings/{zone_id}")
def get_readings(zone_id: int, limit: int = 50):
    """Get the latest crowd readings for a specific zone."""
    response = (
        supabase.table("crowd_readings")
        .select("*")
        .eq("zone_id", zone_id)
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data


@app.get("/alerts")
def get_alerts():
    """Get all recent risk alerts."""
    response = (
        supabase.table("risk_status")
        .select("*")
        .order("timestamp", desc=True)
        .limit(20)
        .execute()
    )
    return response.data


# ==========================================
# EVENT SETUP APIs (Owner / Admin fills form)
# ==========================================

@app.post("/create-event")
def create_event(data: CreateEventRequest):
    """
    Owner or Admin creates a new event.
    Call this first — then use the returned event_id to add zones.
    """
    response = supabase.table("events").insert({
        "admin_id": data.admin_id,
        "event_name": data.event_name,
        "event_type": data.event_type,
        "location": data.location,
        "expected_attendance": data.expected_attendance,
        "start_datetime": data.start_datetime.isoformat(),
        "end_datetime": data.end_datetime.isoformat()
    }).execute()

    created = response.data[0] if response.data else {}
    return {
        "message": f"Event '{data.event_name}' created successfully",
        "event_id": created.get("event_id")
    }


@app.post("/create-zone")
def create_zone(data: CreateZoneRequest):
    """
    Add a zone to an existing event.
    Area and max capacity are auto-calculated from length × width.
    For portal zones, also provide portal_type and parent_zone_id.
    """
    # Validate zone_type
    if data.zone_type not in ["main", "portal"]:
        raise HTTPException(status_code=400, detail="zone_type must be 'main' or 'portal'")

    # Validate portal fields
    if data.zone_type == "portal":
        if not data.portal_type:
            raise HTTPException(status_code=400, detail="Portal zones must have a portal_type (entry/exit/both)")
        if not data.parent_zone_id:
            raise HTTPException(status_code=400, detail="Portal zones must have a parent_zone_id (the main zone they feed into)")

    # Auto-calculate area and max capacity
    area_sqm = round(data.length_m * data.width_m, 2)
    max_capacity = int(area_sqm * data.safe_density_limit)

    response = supabase.table("zones").insert({
        "event_id": data.event_id,
        "zone_name": data.zone_name,
        "zone_type": data.zone_type,
        "area_sqm": area_sqm,
        "max_capacity": max_capacity,
        "safe_density_limit": data.safe_density_limit,
        "emergency_action": data.emergency_action,
        "portal_type": data.portal_type,
        "parent_zone_id": data.parent_zone_id,
        "gate_width": data.gate_width
    }).execute()

    created = response.data[0] if response.data else {}
    return {
        "message": f"Zone '{data.zone_name}' added to event {data.event_id}",
        "zone_id": created.get("zone_id"),
        "area_sqm": area_sqm,
        "max_capacity": max_capacity
    }


@app.get("/events/{event_id}/zones")
def get_event_zones(event_id: int):
    """
    Get all zones for a specific event.
    Use this after setup to verify all zones are correctly configured.
    """
    response = (
        supabase.table("zones")
        .select("*")
        .eq("event_id", event_id)
        .order("zone_type")   # main zones first, then portals
        .execute()
    )
    return response.data


@app.get("/events")
def get_events():
    """Get all events. Useful for the Owner dashboard."""
    response = (
        supabase.table("events")
        .select("*")
        .order("start_datetime", desc=True)
        .execute()
    )
    return response.data


@app.get("/events/{event_id}/live-status")
def get_event_live_status(event_id: int):
    """
    Get the latest crowd count and density for all zones in an event.
    """
    # 1. Fetch all zones for the event
    zones_res = supabase.table("zones").select("*").eq("event_id", event_id).execute()
    zones = zones_res.data or []
    
    if not zones:
        return []

    # 2. For each zone, fetch the latest reading
    live_data = []
    for zone in zones:
        latest_reading = (
            supabase.table("crowd_readings")
            .select("people_count, density_value, timestamp")
            .eq("zone_id", zone["zone_id"])
            .order("timestamp", desc=True)
            .limit(1)
            .execute()
        )
        
        reading = latest_reading.data[0] if latest_reading.data else None
        
        live_data.append({
            "zone_id": zone["zone_id"],
            "zone_name": zone["zone_name"],
            "zone_type": zone["zone_type"],
            "people_count": reading["people_count"] if reading else 0,
            "density_value": reading["density_value"] if reading else 0.0,
            "last_updated": reading["timestamp"] if reading else None,
            "safe_limit": zone.get("safe_density_limit", 2.5)
        })
        
    return live_data


# ==========================================
# VOLUNTEER DEPLOYMENT SYSTEM
# ==========================================

# How many m² a single volunteer can reasonably cover
SQMT_PER_VOLUNTEER_MAIN   = 50   # 1 volunteer per 50 sqm for main zones
SQMT_PER_VOLUNTEER_PORTAL = 30   # 1 volunteer per 30 sqm for portals (busier)
MIN_VOLUNTEERS_PORTAL     = 2    # At least 2 volunteers at any portal gate
GENERAL_BUFFER_PERCENT    = 0.10 # 10% extra as floating/general backup volunteers


@app.post("/deploy-volunteers/{event_id}")
def deploy_volunteers(event_id: int):
    """
    Auto-generates and publishes the volunteer deployment list for an event.
    - Only works if the event is at least 48 hours away.
    - Fetches all approved volunteers belonging to the event's admin.
    - Calculates how many volunteers each zone needs from its dimensions.
    - Assigns volunteers to zones; leftover are marked 'general' (floating backup).
    - Publishes the list (saved to volunteer_deployments table).
    """
    from datetime import timezone

    # --- Step 1: Get event details ---
    event_res = supabase.table("events").select("*").eq("event_id", event_id).single().execute()
    event = event_res.data
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # --- Step 2: Check 24-hour rule ---
    now = datetime.now(timezone.utc)
    start = datetime.fromisoformat(event["start_datetime"])
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    hours_until_event = (start - now).total_seconds() / 3600
    if hours_until_event < 24:
        raise HTTPException(
            status_code=400,
            detail=f"Deployment list can only be published at least 24 hours before the event. Currently {hours_until_event:.1f} hrs away."
        )

    # --- Step 3: Fetch all zones for this event ---
    zones_res = supabase.table("zones").select("*").eq("event_id", event_id).execute()
    zones = zones_res.data
    if not zones:
        raise HTTPException(status_code=400, detail="No zones found for this event. Please add zones first.")

    # --- Step 4: Calculate how many volunteers each zone needs ---
    zone_needs = []
    total_needed = 0
    for zone in zones:
        area = zone["area_sqm"]
        if zone["zone_type"] == "portal":
            needed = max(MIN_VOLUNTEERS_PORTAL, round(area / SQMT_PER_VOLUNTEER_PORTAL))
        else:
            needed = max(1, round(area / SQMT_PER_VOLUNTEER_MAIN))
        zone_needs.append({"zone": zone, "needed": needed})
        total_needed += needed

    # Add general buffer (10% extra, minimum 1)
    general_count = max(1, round(total_needed * GENERAL_BUFFER_PERCENT))
    grand_total_needed = total_needed + general_count

    # --- Step 5: Fetch approved volunteers for this admin (fairest rotation) ---

    # 5a. Get all eligible volunteers under this admin
    all_volunteers_res = (
        supabase.table("profiles")
        .select("id, full_name")
        .eq("role", "volunteer")
        .eq("is_approved", True)
        .eq("assigned_admin_id", event["admin_id"])
        .execute()
    )
    all_volunteers = all_volunteers_res.data

    # 5b. Count how many events each volunteer has been deployed to (fairness rotation)
    # Volunteers with fewer past deployments are picked first
    deployment_counts_res = (
        supabase.table("volunteer_deployments")
        .select("volunteer_id")
        .execute()
    )
    raw_counts = deployment_counts_res.data or []
    count_map = {}
    for row in raw_counts:
        vid = row["volunteer_id"]
        count_map[vid] = count_map.get(vid, 0) + 1

    # 5c. Find volunteers already committed to a time-overlapping event
    # (same admin, different event with overlapping start/end times)
    overlapping_events_res = (
        supabase.table("events")
        .select("event_id")
        .eq("admin_id", event["admin_id"])
        .neq("event_id", event_id)
        .execute()
    )
    overlapping_ids = [e["event_id"] for e in (overlapping_events_res.data or [])]

    busy_volunteer_ids = set()
    if overlapping_ids:
        busy_res = (
            supabase.table("volunteer_deployments")
            .select("volunteer_id, events(start_datetime, end_datetime)")
            .in_("event_id", overlapping_ids)
            .execute()
        )
        event_start = datetime.fromisoformat(event["start_datetime"])
        event_end   = datetime.fromisoformat(event["end_datetime"])
        for row in (busy_res.data or []):
            evt = row.get("events") or {}
            if not evt:
                continue
            other_start = datetime.fromisoformat(evt["start_datetime"])
            other_end   = datetime.fromisoformat(evt["end_datetime"])
            # Two events overlap if one starts before the other ends
            if other_start < event_end and other_end > event_start:
                busy_volunteer_ids.add(row["volunteer_id"])

    # 5d. Filter out busy volunteers and sort rest by fewest deployments first
    volunteers = sorted(
        [v for v in all_volunteers if v["id"] not in busy_volunteer_ids],
        key=lambda v: count_map.get(v["id"], 0)
    )

    if len(volunteers) < grand_total_needed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough available volunteers. Need {grand_total_needed} "
                f"(including {general_count} general backup), but only "
                f"{len(volunteers)} are available (not already committed to another event at the same time)."
            )
        )

    # --- Step 6: Assign volunteers to zones ---
    deployments = []
    v_index = 0
    published_now = now.isoformat()

    for zn in zone_needs:
        for _ in range(zn["needed"]):
            deployments.append({
                "event_id": event_id,
                "volunteer_id": volunteers[v_index]["id"],
                "zone_id": zn["zone"]["zone_id"],
                "deployment_status": "pending",
                "published_at": published_now
            })
            v_index += 1

    # Remaining volunteers are 'general' (floating backup, no zone yet)
    for _ in range(general_count):
        deployments.append({
            "event_id": event_id,
            "volunteer_id": volunteers[v_index]["id"],
            "zone_id": None,
            "deployment_status": "general",
            "published_at": published_now
        })
        v_index += 1

    # --- Step 7: Save all deployments ---
    supabase.table("volunteer_deployments").insert(deployments).execute()

    return {
        "message": "Volunteer deployment list published successfully",
        "event": event["event_name"],
        "hours_until_event": round(hours_until_event, 1),
        "total_volunteers_deployed": len(deployments),
        "zone_assignments": [
            {
                "zone_name": zn["zone"]["zone_name"],
                "zone_type": zn["zone"]["zone_type"],
                "volunteers_assigned": zn["needed"]
            }
            for zn in zone_needs
        ],
        "general_volunteers": general_count
    }


@app.get("/deployment/{event_id}")
def get_deployment(event_id: int):
    """
    Get the full published volunteer deployment list for an event.
    Returns who is assigned to which zone, and who is general backup.
    """
    response = (
        supabase.table("volunteer_deployments")
        .select("*, profiles(full_name, phone), zones(zone_name, zone_type)")
        .eq("event_id", event_id)
        .order("deployment_status")  # assigned first, then general
        .execute()
    )
    return response.data


class ReassignVolunteerRequest(BaseModel):
    volunteer_id: str   # UUID of the volunteer to reassign
    event_id: int
    new_zone_id: int    # The zone they're being moved to


@app.put("/reassign-volunteer")
def reassign_volunteer(req: ReassignVolunteerRequest):
    """
    Move a 'general' volunteer to a specific zone during an event.
    Typically used when a zone is understaffed and needs backup.
    """
    supabase.table("volunteer_deployments").update({
        "zone_id": req.new_zone_id,
        "deployment_status": "reassigned"
    }).eq("volunteer_id", req.volunteer_id).eq("event_id", req.event_id).execute()

    return {
        "message": "Volunteer successfully reassigned to the new zone",
        "volunteer_id": req.volunteer_id,
        "new_zone_id": req.new_zone_id
    }


@app.get("/test-deploy/{event_id}")
def test_deploy(event_id: int):
    """Manual endpoint to force trigger the deployment for testing purposes."""
    _run_deploy_logic(event_id)
    return {"message": f"Successfully forced deployment for event {event_id}"}


# --- Helper used by both the endpoint and the auto-scheduler ---
def _run_deploy_logic(event_id: int):
    """Core deployment logic extracted so it can be called from scheduler too."""
    from datetime import timezone as tz

    event_res = supabase.table("events").select("*").eq("event_id", event_id).single().execute()
    event = event_res.data
    if not event:
        raise Exception(f"Event {event_id} not found")

    now = datetime.now(tz.utc)
    start = datetime.fromisoformat(event["start_datetime"])
    if start.tzinfo is None:
        start = start.replace(tzinfo=tz.utc)

    zones_res = supabase.table("zones").select("*").eq("event_id", event_id).execute()
    zones = zones_res.data
    if not zones:
        raise Exception("No zones for this event")

    zone_needs = []
    total_needed = 0
    for zone in zones:
        area = zone["area_sqm"]
        if zone["zone_type"] == "portal":
            needed = max(MIN_VOLUNTEERS_PORTAL, round(area / SQMT_PER_VOLUNTEER_PORTAL))
        else:
            needed = max(1, round(area / SQMT_PER_VOLUNTEER_MAIN))
        zone_needs.append({"zone": zone, "needed": needed})
        total_needed += needed

    general_count = max(1, round(total_needed * GENERAL_BUFFER_PERCENT))
    grand_total = total_needed + general_count

    all_vol_res = (
        supabase.table("profiles")
        .select("id, full_name")
        .eq("role", "volunteer")
        .eq("is_approved", True)
        .eq("assigned_admin_id", event["admin_id"])
        .execute()
    )
    all_volunteers = all_vol_res.data or []

    count_res = supabase.table("volunteer_deployments").select("volunteer_id").execute()
    count_map = {}
    for row in (count_res.data or []):
        vid = row["volunteer_id"]
        count_map[vid] = count_map.get(vid, 0) + 1

    volunteers = sorted(
        all_volunteers,
        key=lambda v: count_map.get(v["id"], 0)
    )

    if len(volunteers) < grand_total:
        raise Exception(f"Need {grand_total} volunteers but only {len(volunteers)} available")

    deployments = []
    v_index = 0
    published_now = now.isoformat()

    for zn in zone_needs:
        for _ in range(zn["needed"]):
            deployments.append({
                "event_id": event_id,
                "volunteer_id": volunteers[v_index]["id"],
                "zone_id": zn["zone"]["zone_id"],
                "deployment_status": "pending",
                "published_at": published_now
            })
            v_index += 1

    for _ in range(general_count):
        deployments.append({
            "event_id": event_id,
            "volunteer_id": volunteers[v_index]["id"],
            "zone_id": None,
            "deployment_status": "pending",
            "published_at": published_now
        })
        v_index += 1

    supabase.table("volunteer_deployments").insert(deployments).execute()


# ==========================================
# VOLUNTEER ACCEPT / REJECT / VIEW APIs
# ==========================================

@app.get("/my-deployments/{volunteer_id}")
def get_my_deployments(volunteer_id: str):
    """
    Volunteer sees only their own deployment invites.
    Returns event name, zone name, status, and shift times.
    """
    response = (
        supabase.table("volunteer_deployments")
        .select("*, events(event_name, start_datetime, end_datetime, location), zones(zone_name, zone_type)")
        .eq("volunteer_id", volunteer_id)
        .in_("deployment_status", ["pending", "accepted"])
        .order("published_at", desc=True)
        .execute()
    )
    return response.data or []


class RespondDeploymentRequest(BaseModel):
    deployment_id: int
    volunteer_id: str
    response: str  # 'accepted' or 'rejected'


@app.put("/respond-deployment")
def respond_deployment(req: RespondDeploymentRequest):
    """
    Volunteer accepts or rejects a deployment invite.
    On rejection: auto-finds the next available volunteer under the same admin
    with fewest past deployments and creates a new 'pending' assignment.
    """
    if req.response not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Response must be 'accepted' or 'rejected'")

    # Get the deployment row
    dep_res = (
        supabase.table("volunteer_deployments")
        .select("*, events(admin_id, start_datetime, end_datetime)")
        .eq("deployment_id", req.deployment_id)
        .eq("volunteer_id", req.volunteer_id)
        .single()
        .execute()
    )
    dep = dep_res.data
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")

    if dep["deployment_status"] != "pending":
        raise HTTPException(status_code=400, detail="Can only respond to pending deployments")

    # Update the status
    supabase.table("volunteer_deployments").update({
        "deployment_status": req.response
    }).eq("deployment_id", req.deployment_id).execute()

    result = {"message": f"Deployment {req.response}", "deployment_id": req.deployment_id}

    # --- Auto-reassign on rejection ---
    if req.response == "rejected":
        admin_id = dep["events"]["admin_id"]
        event_id = dep["event_id"]
        zone_id = dep.get("zone_id")

        # Get all volunteers already assigned to this event
        already_assigned_res = (
            supabase.table("volunteer_deployments")
            .select("volunteer_id")
            .eq("event_id", event_id)
            .execute()
        )
        already_ids = set(r["volunteer_id"] for r in (already_assigned_res.data or []))

        # Get all approved volunteers under this admin
        all_vol_res = (
            supabase.table("profiles")
            .select("id, full_name")
            .eq("role", "volunteer")
            .eq("is_approved", True)
            .eq("assigned_admin_id", admin_id)
            .execute()
        )

        # Filter out those already in this event's deployment
        available = [v for v in (all_vol_res.data or []) if v["id"] not in already_ids]

        if available:
            # Pick the one with fewest past deployments (fairness)
            count_res = supabase.table("volunteer_deployments").select("volunteer_id").execute()
            count_map = {}
            for row in (count_res.data or []):
                vid = row["volunteer_id"]
                count_map[vid] = count_map.get(vid, 0) + 1

            available.sort(key=lambda v: count_map.get(v["id"], 0))
            replacement = available[0]

            # Create new pending deployment for the replacement
            supabase.table("volunteer_deployments").insert({
                "event_id": event_id,
                "volunteer_id": replacement["id"],
                "zone_id": zone_id,
                "deployment_status": "pending",
                "published_at": datetime.now(timezone.utc).isoformat()
            }).execute()

            result["replacement"] = {
                "volunteer_name": replacement["full_name"],
                "volunteer_id": replacement["id"]
            }
        else:
            result["replacement"] = None
            result["warning"] = "No available volunteer to replace. Admin should review."

    return result


@app.get("/admin-deployments/{admin_id}")
def get_admin_deployments(admin_id: str):
    """
    Admin sees all deployments for their events (from 24 hours before onwards).
    Shows volunteer name, zone, status for each assignment.
    """
    # Get all events belonging to this admin
    events_res = (
        supabase.table("events")
        .select("event_id")
        .eq("admin_id", admin_id)
        .execute()
    )
    event_ids = [e["event_id"] for e in (events_res.data or [])]

    if not event_ids:
        return []

    # Get all deployments for those events
    response = (
        supabase.table("volunteer_deployments")
        .select("*, profiles(full_name, phone), zones(zone_name, zone_type), events(event_name, start_datetime)")
        .in_("event_id", event_ids)
        .order("published_at", desc=True)
        .execute()
    )
    return response.data or []


# ==========================================
# STAMPEDE PREVENTION & EXIT STRATEGY
# ==========================================

# Emergency standard: ~1.5 persons can pass per second per metre of gate width
# Used only as reference; actual allocation is by proportional score
PERSONS_PER_SEC_PER_METRE = 1.5
# Max portal density used as baseline for congestion calculation (very crowded portal)
MAX_PORTAL_DENSITY = 5.0


@app.post("/exit-strategy/{zone_id}")
def exit_strategy(zone_id: int):
    """
    Computes and broadcasts an emergency exit plan for a zone.
    Called automatically when STAMPEDE RISK is detected, or manually by admin.

    Combined 3-option algorithm:
    Option 3: Total crowd to evacuate = main zone's latest camera reading (most reliable)
    Option 2: Base score per portal    = gate_width (physical throughput, always correct)
    Option 1: Flow modifier            = Is the portal count FALLING? → gate is working (boost)
                                         Is it RISING or stable?      → gate is jammed (no boost)
    Final allocation = proportional to (gate_width × flow_modifier)
    """
    # --- Option 3: Get MAIN ZONE's crowd count (source of truth for evacuation total) ---
    zone_res = supabase.table("zones").select("*").eq("zone_id", zone_id).single().execute()
    zone = zone_res.data
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    main_reading_res = (
        supabase.table("crowd_readings")
        .select("people_count")
        .eq("zone_id", zone_id)
        .order("timestamp", desc=True)
        .limit(1)
        .execute()
    )
    total_crowd = main_reading_res.data[0]["people_count"] if main_reading_res.data else 0

    # --- Find all active (non-blocked) portals (ALL types become exits in emergency) ---
    portals_res = (
        supabase.table("zones")
        .select("zone_id, zone_name, gate_width, area_sqm")
        .eq("parent_zone_id", zone_id)
        .eq("is_emergency_blocked", False)
        .execute()
    )
    portals = portals_res.data or []

    if not portals:
        raise HTTPException(
            status_code=400,
            detail="No available exits for this zone. All portals may be blocked."
        )

    # --- Score each portal using Options 1 + 2 ---
    portal_scores = []
    for portal in portals:
        pid    = portal["zone_id"]
        gate_w = portal.get("gate_width") or 1.0   # Option 2: base = gate width
        area   = portal.get("area_sqm") or 10.0

        # Option 1: Get last TWO readings for this portal to detect flow direction
        p_readings_res = (
            supabase.table("crowd_readings")
            .select("people_count")
            .eq("zone_id", pid)
            .order("timestamp", desc=True)
            .limit(2)
            .execute()
        )
        readings = p_readings_res.data or []

        if len(readings) >= 2:
            latest_count = readings[0]["people_count"]
            prev_count   = readings[1]["people_count"]
            count_change = latest_count - prev_count

            # Falling count → gate is actively clearing → people flowing through → BOOST
            # Rising or stable → gate is jammed or overcrowding → no boost
            if count_change < 0:
                flow_modifier = 1.5   # Gate is working well — send more people here
            elif count_change == 0:
                flow_modifier = 1.0   # Neutral — gate is stable, use gate_width only
            else:
                flow_modifier = 0.7   # Gate count rising — might be jammed — slight penalty
        else:
            flow_modifier = 1.0       # No prior reading — treat as neutral

        # Final composite score: wide + flowing gates score highest
        score = gate_w * flow_modifier

        # Current portal congestion for display only (informational)
        current_count = readings[0]["people_count"] if readings else 0
        portal_density = round(current_count / area, 3)

        portal_scores.append({
            "zone_id":       pid,
            "zone_name":     portal["zone_name"],
            "gate_width":    gate_w,
            "flow_modifier": flow_modifier,
            "current_count": current_count,
            "portal_density": portal_density,
            "score":         score
        })

    # --- Proportional allocation by final score ---
    total_score = sum(p["score"] for p in portal_scores)
    allocations = []
    for p in portal_scores:
        share     = p["score"] / total_score
        allocated = round(share * total_crowd)
        allocations.append({
            **p,
            "allocated_people": allocated,
            "share_pct":        round(share * 100, 1)
        })

    # --- Broadcast targeted alert to each portal's volunteer ---
    for alloc in allocations:
        flow_status = (
            "flowing ✓" if alloc["flow_modifier"] > 1.0
            else "jammed ⚠" if alloc["flow_modifier"] < 1.0
            else "stable"
        )
        supabase.table("risk_status").insert({
            "zone_id": zone_id,
            "risk_level": "EMERGENCY EXIT PLAN",
            "recommended_action": (
                f"[{alloc['zone_name']}] Direct {alloc['allocated_people']} people to this gate "
                f"({alloc['share_pct']}% of {total_crowd} total). "
                f"Gate status: {flow_status}. Width: {alloc['gate_width']}m."
            ),
            "targeted_volunteer_zone_id": alloc["zone_id"]
        }).execute()

    # Summary alert to general/unassigned volunteers in the main zone
    plan_summary = " | ".join(
        [f"{a['zone_name']}: {a['allocated_people']} people" for a in allocations]
    )
    supabase.table("risk_status").insert({
        "zone_id": zone_id,
        "risk_level": "EMERGENCY EXIT PLAN",
        "recommended_action": f"EVACUATE — {total_crowd} people total. {plan_summary}",
        "targeted_volunteer_zone_id": zone_id
    }).execute()

    return {
        "message":       "Emergency exit plan computed and broadcast to all volunteers",
        "zone":          zone["zone_name"],
        "total_crowd":   total_crowd,
        "active_exits":  len(allocations),
        "exit_plan":     allocations
    }


@app.put("/block-exit/{zone_id}")
def block_exit(zone_id: int):
    """
    Admin manually marks a portal as blocked (fire, obstruction etc).
    Excluded from exit strategy. Triggers automatic recalculation.
    """
    supabase.table("zones").update({
        "is_emergency_blocked": True
    }).eq("zone_id", zone_id).execute()

    portal_res = supabase.table("zones").select("parent_zone_id, zone_name").eq("zone_id", zone_id).single().execute()
    portal = portal_res.data
    result = {"message": f"Exit '{portal['zone_name']}' BLOCKED — excluded from exit plans"}

    if portal and portal.get("parent_zone_id"):
        recalc = exit_strategy(portal["parent_zone_id"])
        result["recalculated_exit_plan"] = recalc

    return result


@app.put("/unblock-exit/{zone_id}")
def unblock_exit(zone_id: int):
    """
    Admin re-opens a previously blocked portal.
    Triggers automatic recalculation of the exit strategy.
    """
    supabase.table("zones").update({
        "is_emergency_blocked": False
    }).eq("zone_id", zone_id).execute()

    portal_res = supabase.table("zones").select("parent_zone_id, zone_name").eq("zone_id", zone_id).single().execute()
    portal = portal_res.data
    result = {"message": f"Exit '{portal['zone_name']}' re-opened — included in exit plans"}

    if portal and portal.get("parent_zone_id"):
        recalc = exit_strategy(portal["parent_zone_id"])
        result["recalculated_exit_plan"] = recalc

    return result


# ==========================================
# POST-EVENT ANALYSIS & REPORT
# ==========================================

@app.get("/event-report/{event_id}")
def event_report(event_id: int):
    """
    Returns a full post-event analysis report.
    ONLY accessible after the event's end_datetime has passed.

    Returns 6 sections:
    1. event_overview       → key stats (peak attendance, duration, total alerts)
    2. zone_density_timeline → per-zone list of {time, density} for line charts
    3. alert_breakdown      → count of each alert type for bar chart
    4. zone_utilization     → each zone's peak utilization % for pie chart
    5. volunteer_summary    → deployment stats (assigned, general, emergency)
    6. incident_log         → chronological list of all alerts fired
    """
    from datetime import timezone

    # --- Post-event gate: block access if event is still ongoing ---
    event_res = supabase.table("events").select("*").eq("event_id", event_id).single().execute()
    event = event_res.data
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    now = datetime.now(timezone.utc)
    end_dt = datetime.fromisoformat(event["end_datetime"])
    start_dt = datetime.fromisoformat(event["start_datetime"])

    if now < end_dt:
        raise HTTPException(
            status_code=400,
            detail=f"Event is still ongoing. Report available after {end_dt.strftime('%Y-%m-%d %H:%M')} UTC."
        )

    duration_hrs = round((end_dt - start_dt).total_seconds() / 3600, 1)

    # --- Fetch all zones for this event ---
    zones_res = supabase.table("zones").select("*").eq("event_id", event_id).execute()
    zones = zones_res.data or []
    zone_ids = [z["zone_id"] for z in zones]
    zone_map = {z["zone_id"]: z for z in zones}

    # ============================================================
    # SECTION 1: Event Overview
    # ============================================================
    all_readings_res = (
        supabase.table("crowd_readings")
        .select("zone_id, people_count, density_value, timestamp")
        .in_("zone_id", zone_ids)
        .order("timestamp", desc=False)
        .execute()
    )
    all_readings = all_readings_res.data or []

    peak_reading = max(all_readings, key=lambda r: r["people_count"], default=None)
    peak_attendance = peak_reading["people_count"] if peak_reading else 0
    peak_time = peak_reading["timestamp"] if peak_reading else None

    all_alerts_res = (
        supabase.table("risk_status")
        .select("*")
        .in_("zone_id", zone_ids)
        .order("timestamp", desc=False)
        .execute()
    )
    all_alerts = all_alerts_res.data or []
    stampede_count = sum(1 for a in all_alerts if a["risk_level"] == "STAMPEDE RISK")

    event_overview = {
        "event_name":       event["event_name"],
        "event_type":       event.get("event_type"),
        "location":         event.get("location"),
        "start":            event["start_datetime"],
        "end":              event["end_datetime"],
        "duration_hrs":     duration_hrs,
        "peak_attendance":  peak_attendance,
        "peak_time":        peak_time,
        "total_alerts":     len(all_alerts),
        "stampede_events":  stampede_count,
        "zones_monitored":  len(zones)
    }

    # ============================================================
    # SECTION 2: Zone Density Timeline (per zone — for line charts)
    # ============================================================
    zone_density_timeline = []
    for zone in zones:
        zid = zone["zone_id"]
        zone_readings = [r for r in all_readings if r["zone_id"] == zid]
        timeline = [
            {"time": r["timestamp"], "density": round(r["density_value"], 3)}
            for r in zone_readings
        ]
        max_density = max((r["density_value"] for r in zone_readings), default=0)
        zone_density_timeline.append({
            "zone_id":    zid,
            "zone_name":  zone["zone_name"],
            "zone_type":  zone["zone_type"],
            "safe_limit": zone.get("safe_density_limit", 2.5),
            "max_density_reached": round(max_density, 3),
            "timeline":   timeline    # List of {time, density} → plot as line
        })

    # ============================================================
    # SECTION 3: Alert Breakdown by Type (for bar chart)
    # ============================================================
    alert_counts = {}
    for alert in all_alerts:
        rl = alert["risk_level"]
        alert_counts[rl] = alert_counts.get(rl, 0) + 1

    # Timeline of alert frequency — how many alerts per hour bucket
    from collections import defaultdict
    alert_by_hour = defaultdict(int)
    for alert in all_alerts:
        ts = alert["timestamp"][:13]   # "2026-02-01T18" → hour bucket
        alert_by_hour[ts] += 1

    alert_breakdown = {
        "by_type":   alert_counts,                                          # For bar chart
        "by_hour":   dict(sorted(alert_by_hour.items()))                   # For alert frequency line
    }

    # ============================================================
    # SECTION 4: Zone Utilization % (for pie/donut chart)
    # ============================================================
    zone_utilization = []
    for zone in zones:
        zid = zone["zone_id"]
        safe_limit   = zone.get("safe_density_limit", 2.5)
        max_capacity = zone.get("max_capacity") or int(zone["area_sqm"] * safe_limit)
        zone_readings = [r for r in all_readings if r["zone_id"] == zid]
        peak_count    = max((r["people_count"] for r in zone_readings), default=0)
        utilization   = round((peak_count / max_capacity) * 100, 1) if max_capacity else 0

        zone_utilization.append({
            "zone_name":      zone["zone_name"],
            "zone_type":      zone["zone_type"],
            "max_capacity":   max_capacity,
            "peak_count":     peak_count,
            "utilization_pct": utilization,     # Use as pie slice size
            "status": (
                "Critical" if utilization >= 90 else
                "High"     if utilization >= 75 else
                "Moderate" if utilization >= 50 else
                "Low"
            )
        })

    # ============================================================
    # SECTION 5: Volunteer Deployment Summary
    # ============================================================
    deployments_res = (
        supabase.table("volunteer_deployments")
        .select("deployment_status")
        .eq("event_id", event_id)
        .execute()
    )
    deployments = deployments_res.data or []

    status_counts = {}
    for d in deployments:
        s = d["deployment_status"]
        status_counts[s] = status_counts.get(s, 0) + 1

    volunteer_summary = {
        "total_deployed":        len(deployments),
        "zone_assigned":         status_counts.get("assigned", 0),
        "general_buffer":        status_counts.get("general", 0),
        "emergency_assigned":    status_counts.get("emergency_assigned", 0),
        "admin_reassigned":      status_counts.get("reassigned", 0)
    }

    # ============================================================
    # SECTION 6: Incident Log (chronological — for table display)
    # ============================================================
    incident_log = [
        {
            "time":     a["timestamp"],
            "zone":     zone_map.get(a["zone_id"], {}).get("zone_name", "Unknown"),
            "level":    a["risk_level"],
            "action":   a["recommended_action"]
        }
        for a in all_alerts
    ]

    # ============================================================
    # FINAL RESPONSE
    # ============================================================
    return {
        "event_overview":        event_overview,
        "zone_density_timeline": zone_density_timeline,
        "alert_breakdown":       alert_breakdown,
        "zone_utilization":      zone_utilization,
        "volunteer_summary":     volunteer_summary,
        "incident_log":          incident_log
    }
