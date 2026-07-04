import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api/v1/accounts"

def run():
    # 1. Create account
    res = requests.post(BASE_URL, json={
        "channel_name": f"TestChannel_{uuid.uuid4().hex[:8]}",
        "source_type": "M1_VIDEO_SPLITTER",
        "region": "Indonesia"
    })
    if res.status_code != 201:
        print("OAuth Login FAIL - Cannot create account")
        return
    account_id = res.json()["id"]

    # 2. OAuth Login
    res = requests.get(f"{BASE_URL}/{account_id}/auth-url")
    if res.status_code == 200:
        print("OAuth Login | PASS")
    else:
        print("OAuth Login | FAIL")
        return

    # 3. Callback (with dummy code)
    res = requests.get(f"{BASE_URL}/oauth-callback", params={
        "code": "dummy_code",
        "state": account_id
    }, allow_redirects=False)

    print(f"Callback status: {res.status_code}, Location: {res.headers.get('Location')}")
    
    # 4. Check DB for authentication_status
    res = requests.get(f"{BASE_URL}/{account_id}")
    acc = res.json()
    status = acc.get("authentication_status")
    print(f"authentication_status: {status}")

run()
