from crowd_backend.supabase_config import supabase
import requests
import os

# We can query the PostgREST root to get the list of tables
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

try:
    response = requests.get(f"{url}/rest/v1/", headers={"apikey": key, "Authorization": f"Bearer {key}"})
    if response.status_code == 200:
        print("Available tables in Supabase:")
        print(response.json())
    else:
        print(f"Failed to get metadata: {response.status_code} {response.text}")
except Exception as e:
    print("Error:", e)
