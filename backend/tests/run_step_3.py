import requests
import time
import os

BASE_URL = "http://127.0.0.1:8001/api/v1"

def run_workflow():
    print("--- Executing Functional Workflow Transitions ---")
    
    # 1. Profile
    print("1. Browser Profile")
    profile_payload = {
        "name": "Workflow Test Profile",
        "description": "Profile for automated tests",
        "content_type": "Longform (16:9)",
        "metadata_strategy": "Template Only"
    }
    res = requests.post(f"{BASE_URL}/profiles", json=profile_payload)
    if res.status_code != 201:
        print("Failed to create profile", res.status_code, res.text)
        # Try to get the first profile if exists
        profiles = requests.get(f"{BASE_URL}/profiles").json()
        if len(profiles) > 0:
            profile_id = profiles[0]["id"]
            print(f"   Using existing Profile ID: {profile_id}")
        else:
            return
    else:
        profile_id = res.json()["id"]
        print(f"   Created Profile ID: {profile_id}")

    # 2. Channel
    print("2. Channel Setup")
    account_payload = {
        "channel_name": "Workflow Test Channel",
        "source_type": "MANUAL_UPLOAD",
        "region": "Indonesia"
    }
    res = requests.post(f"{BASE_URL}/channels", json=account_payload)
    if res.status_code != 201:
        print("Failed to create channel", res.status_code, res.text)
        channels = requests.get(f"{BASE_URL}/channels").json()
        if len(channels) > 0:
            channel_id = channels[0]["id"]
            print(f"   Using existing Channel ID: {channel_id}")
        else:
            return
    else:
        channel_id = res.json()["id"]
        print(f"   Created Channel ID: {channel_id}")

    # 3. Queue / Import
    print("3. Watch Folder -> Import")
    queue_payload = {
        "channel_id": channel_id,
        "profile_id": profile_id,
        "package_folder": "./tests/assets",
        "video_path": "./tests/assets/720p.mp4",
        "title": "Workflow Test Video",
        "description": "Testing the full workflow",
        "status": "REVIEW"
    }
    res = requests.post(f"{BASE_URL}/queue", json=queue_payload)
    if res.status_code != 201:
        print("Failed to queue task", res.status_code, res.text)
        return
    task_id = res.json()["id"]
    print(f"   Queued Task ID: {task_id}")

    # 4. Review & Approve
    print("4. Review -> Approve")
    res = requests.post(f"{BASE_URL}/queue/{task_id}/approve")
    if res.status_code != 200:
        print("Failed to approve task", res.status_code, res.text)
        return
    print("   Task Approved")

    # 5. Upload Engine & Scheduler
    print("5. Upload Engine -> Scheduler")
    max_attempts = 120
    for i in range(max_attempts):
        task = requests.get(f"{BASE_URL}/queue/{task_id}").json()
        status = task.get('status')
        print(f"   Status: {status}")
        if status in ['COMPLETED', 'FAILED']:
            break
        time.sleep(2)

    # 6. History & Dashboard
    print("6. Completed -> History -> Dashboard")
    history = requests.get(f"{BASE_URL}/history").json()
    dashboard = requests.get(f"{BASE_URL}/dashboard").json()
    print(f"   Dashboard pending: {dashboard.get('pending_review', 0)}, uploading: {dashboard.get('uploading', 0)}, completed: {dashboard.get('completed', 0)}")
    print("--- Workflow Completed Successfully ---")

if __name__ == "__main__":
    run_workflow()
