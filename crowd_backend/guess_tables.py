from crowd_backend.supabase_config import supabase

# This is a trick to get table names from PostgREST if we don't know them
# Usually querying a non-existent table gives a hint or error with schema info
# But better to just try a known one and search for metadata
try:
    # Try to fetch from a generic RPC or just list what we can
    res = supabase.table("zones").select("*").limit(1).execute()
    print("Success connecting to Supabase")
    
    # Let's try to find if there's any table named 'devices' or similar
    # We can try to guess common names
    tables_to_try = ["devices", "registered_devices", "camera_devices", "profiles"]
    for t in tables_to_try:
        try:
            res = supabase.table(t).select("*").limit(1).execute()
            print(f"Table '{t}' exists.")
        except Exception as e:
            print(f"Table '{t}' check failed.")

except Exception as e:
    print("General failure:", e)
