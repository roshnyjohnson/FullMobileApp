import asyncio
from crowd_backend.supabase_config import supabase
from datetime import datetime, timezone, timedelta

def check():
    now = datetime.now(timezone.utc)
    print(f"Current UTC time: {now}")
    print(f"Window start (now+23h): {now + timedelta(hours=23)}")
    print(f"Window end (now+24h): {now + timedelta(hours=24)}")
    
    events_res = supabase.table("events").select("event_id, event_name, start_datetime").execute()
    events = events_res.data
    
    print("\nEvents:")
    for ev in events:
        start = datetime.fromisoformat(ev["start_datetime"])
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        
        hours_away = (start - now).total_seconds() / 3600
        status = "IN WINDOW (SHOULD DEPLOY)" if 23 <= hours_away <= 24 else "OUTSIDE WINDOW"
        
        print(f" - [{ev['event_id']}] {ev['event_name']}: {start} ({hours_away:.2f} hours away) -> {status}")

    print("\nDeployments:")
    deps = supabase.table("volunteer_deployments").select("*").execute()
    for d in deps.data:
        print(f" - {d}")

if __name__ == "__main__":
    check()
