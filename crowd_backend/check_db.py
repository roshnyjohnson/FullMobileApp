from crowd_backend.supabase_config import supabase

try:
    res = supabase.table("devices").select("*").limit(1).execute()
    print("Devices table structure:", res.data[0] if res.data else "Empty table")
except Exception as e:
    print("Error checking devices table:", e)
