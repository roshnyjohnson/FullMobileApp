from crowd_backend.supabase_config import supabase

try:
    # Supabase requires a filter for deletes, so we use an always-true condition
    res = supabase.table("risk_status").delete().neq("zone_id", -1).execute()
    print("SUCCESS: Cleared all old demo alerts from the database.")
except Exception as e:
    print(f"FAILED to clear alerts: {e}")
