import requests
import time
import subprocess
import os

print("Starting backend test...")
proc = subprocess.Popen(["python", "-m", "uvicorn", "main:app", "--port", "8001"], cwd="backend")
time.sleep(4) # wait for startup

try:
    print("Testing /api/v1/channels to get an account id...")
    res = requests.get("http://127.0.0.1:8001/api/v1/channels")
    if res.status_code == 200 and len(res.json()) > 0:
        channels = res.json()
        print(f"Found {len(channels)} channels.")
        channel_id = channels[0]["id"]
        
        print(f"Testing reconnect for channel {channel_id}...")
        reconnect_res = requests.post(f"http://127.0.0.1:8001/api/v1/oauth/channels/{channel_id}/reconnect")
        print(f"Status: {reconnect_res.status_code}")
        print(f"Response: {reconnect_res.json()}")
    else:
        print("No channels found or failed to fetch.")
        print(res.text)
finally:
    proc.terminate()
