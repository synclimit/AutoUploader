import sys
import os

# Add backend to path
sys.path.append(os.path.abspath("backend"))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

print("Fetching channels...")
response = client.get("/api/v1/channels")
if response.status_code == 200:
    channels = response.json()
    if channels:
        channel_id = channels[0]["id"]
        print(f"Testing reconnect for channel: {channel_id}")
        
        # Test the NEW endpoint
        reconnect_resp = client.post(f"/api/v1/oauth/channels/{channel_id}/reconnect")
        print(f"Status Code: {reconnect_resp.status_code}")
        print(f"Response: {reconnect_resp.json()}")
    else:
        print("No channels found.")
else:
    print(f"Failed to fetch channels: {response.text}")
