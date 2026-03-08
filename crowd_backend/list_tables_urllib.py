import os
import urllib.request
import json
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / "crowd_backend" / ".env"
load_dotenv(dotenv_path=env_path)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing Supabase credentials in .env")
    exit(1)

req_url = f"{url}/rest/v1/"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

try:
    req = urllib.request.Request(req_url, headers=headers)
    with urllib.request.urlopen(req) as response:
        if response.status == 200:
            data = json.loads(response.read().decode())
            print("Available tables in Supabase:")
            # data is a dict where keys are table names and values are details
            if "definitions" in data:
                print(list(data["definitions"].keys()))
            else:
                print(list(data.keys()))
        else:
            print(f"Failed to get metadata: {response.status}")
except Exception as e:
    print("Error:", e)
