from crowd_backend.supabase_config import supabase

def check_db():
    print("--- Checking Events ---")
    events = supabase.table("events").select("*").execute()
    print(f"Total Events: {len(events.data)}")
    for e in events.data:
        print(f"Event ID: {e['event_id']}, Name: {e['event_name']}")

    print("\n--- Checking Zones ---")
    zones = supabase.table("zones").select("*").execute()
    print(f"Total Zones: {len(zones.data)}")
    for z in zones.data:
        print(f"Zone ID: {z['zone_id']}, Name: {z['zone_name']}, Event ID: {z['event_id']}")

if __name__ == "__main__":
    check_db()
