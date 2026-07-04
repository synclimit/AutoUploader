import requests
import json

BASE_URL = "http://localhost:8000/api/v1/accounts"
results = {}

def log_status(name, status):
    print(f"{name.ljust(15)} {status}")
    results[name] = status

def run_tests():
    account_id = None
    
    # 1. POST
    try:
        res = requests.post(BASE_URL, json={
            "channel_name": "TestChannel123",
            "source_type": "M1_VIDEO_SPLITTER",
            "region": "Indonesia"
        })
        if res.status_code == 201:
            log_status("POST", "PASS")
            account_id = res.json()["id"]
        elif res.status_code == 409: # maybe already exists
            res_get = requests.get(BASE_URL)
            accs = [a for a in res_get.json() if a["channel_name"] == "TestChannel123"]
            if accs:
                account_id = accs[0]["id"]
                log_status("POST", "PASS (Already Exists)")
            else:
                log_status("POST", f"FAIL ({res.status_code})")
        else:
            log_status("POST", f"FAIL ({res.status_code}) - {res.text}")
    except Exception as e:
        log_status("POST", f"FAIL ({str(e)})")

    # 2. GET
    try:
        res = requests.get(BASE_URL)
        if res.status_code == 200:
            log_status("GET", "PASS")
        else:
            log_status("GET", f"FAIL ({res.status_code})")
    except Exception as e:
        log_status("GET", f"FAIL ({str(e)})")

    if not account_id:
        log_status("PUT", "SKIP (No account_id)")
        log_status("OAuth Login", "SKIP")
        log_status("OAuth Callback", "SKIP")
        log_status("DELETE", "SKIP")
        return

    # 3. PUT
    try:
        res = requests.put(f"{BASE_URL}/{account_id}", json={
            "region": "US"
        })
        if res.status_code == 200:
            log_status("PUT", "PASS")
        else:
            log_status("PUT", f"FAIL ({res.status_code})")
    except Exception as e:
        log_status("PUT", f"FAIL ({str(e)})")

    # 4. OAuth Login (auth-url)
    try:
        res = requests.get(f"{BASE_URL}/{account_id}/auth-url")
        if res.status_code == 200 and "auth_url" in res.json():
            log_status("OAuth Login", "PASS")
        else:
            log_status("OAuth Login", f"FAIL ({res.status_code})")
    except Exception as e:
        log_status("OAuth Login", f"FAIL ({str(e)})")

    # 5. OAuth Callback
    try:
        # Provide dummy code and state (account_id)
        # Note: the route might be /oauth-callback or /api/v1/accounts/oauth-callback?
        # In accounts.py: @router.get("/oauth-callback") -> so it's /api/v1/accounts/oauth-callback
        res = requests.get(f"{BASE_URL}/oauth-callback", params={
            "code": "dummy_code",
            "state": account_id
        }, allow_redirects=False)
        # We expect a redirect, but since it's dummy code, we might get an OAuth error redirect
        # Actually, let's see if it redirects or 500s.
        if res.status_code in (301, 302, 303, 307, 308):
            redirect_url = res.headers.get("Location", "")
            if "localhost:5173" in redirect_url:
                log_status("OAuth Callback", "FAIL (Redirects to hardcoded localhost:5173)")
            else:
                log_status("OAuth Callback", "PASS/Check")
        else:
            log_status("OAuth Callback", f"FAIL (status {res.status_code})")
    except Exception as e:
        log_status("OAuth Callback", f"FAIL ({str(e)})")

    # 6. DELETE
    try:
        res = requests.delete(f"{BASE_URL}/{account_id}")
        if res.status_code == 204:
            log_status("DELETE", "PASS")
        else:
            log_status("DELETE", f"FAIL ({res.status_code})")
    except Exception as e:
        log_status("DELETE", f"FAIL ({str(e)})")

if __name__ == "__main__":
    run_tests()
