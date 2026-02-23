import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Use the absolute path of THIS file to reliably find the .env
# This works no matter which directory uvicorn is started from
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)


# Step 2: Read the values that were loaded
# We use the SERVICE ROLE key here because this is the BACKEND
# This key bypasses all security rules so FastAPI can write freely
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Step 3: Create the Supabase "bridge" object
# Import this object in main.py to read/write data
supabase: Client = create_client(url, key)
