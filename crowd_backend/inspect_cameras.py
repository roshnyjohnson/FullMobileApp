from crowd_backend.supabase_config import supabase

try:
    res = supabase.table("camera_devices").select("*").limit(1).execute()
    print("Camera devices sample:", res.data[0] if res.data else "Empty table")
except Exception as e:
    print("Error checking camera_devices:", e)
