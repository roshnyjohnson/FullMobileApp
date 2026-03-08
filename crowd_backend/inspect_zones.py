from crowd_backend.supabase_config import supabase

try:
    res = supabase.table("zones").select("*").limit(1).execute()
    print("Zones sample:", res.data[0] if res.data else "No zones")
except Exception as e:
    print("Error checking zones:", e)
