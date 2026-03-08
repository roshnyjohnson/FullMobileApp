from crowd_backend.supabase_config import supabase

try:
    res = supabase.table("crowd_readings").select("*").limit(1).execute()
    print("Crowd Readings sample:", res.data[0] if res.data else "No readings yet")
except Exception as e:
    print("Error checking crowd_readings:", e)
