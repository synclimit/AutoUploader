import requests
import json

base_url = "http://localhost:8000/api/v1/accounts"
defects = []

def test_endpoint(method, url, data=None):
    try:
        if method == "GET":
            res = requests.get(url)
        elif method == "POST":
            res = requests.post(url, json=data)
        elif method == "PUT":
            res = requests.put(url, json=data)
        elif method == "DELETE":
            res = requests.delete(url)
            
        print(f"{method} {url} -> {res.status_code}")
        
        # Assume our backend wraps everything in {success: true, data: ...}
        # or maybe the API doesn't wrap correctly?
        try:
            body = res.json()
            # if status code is 200, check if success flag exists if wrapped
        except:
            body = res.text
            
        return res.status_code, body
    except Exception as e:
        return 0, str(e)

# 1. GET /accounts
status, body = test_endpoint("GET", base_url)
if status != 200:
    defects.append({"desc": "GET /accounts failed", "status": status, "body": body})
else:
    # 2. Add Channel
    payload = {
        "channel_name": "Audit Test Channel",
        "source_type": "M1_VIDEO_SPLITTER"
    }
    status_post, body_post = test_endpoint("POST", base_url, data=payload)
    if status_post not in [200, 201]:
        defects.append({"desc": "POST /accounts failed", "status": status_post, "body": body_post})
    else:
        # Get ID
        acc_id = None
        if isinstance(body_post, dict) and "data" in body_post and body_post["data"]:
            acc_id = body_post["data"].get("id")
        elif isinstance(body_post, dict) and "id" in body_post:
            acc_id = body_post.get("id")
            
        if not acc_id:
            defects.append({"desc": "POST /accounts returned 200 but no ID found in response", "body": body_post})
        else:
            # 3. Edit Channel
            put_payload = {"channel_name": "Audit Test Channel Updated"}
            status_put, body_put = test_endpoint("PUT", f"{base_url}/{acc_id}", data=put_payload)
            if status_put != 200:
                defects.append({"desc": "PUT /accounts/{id} failed", "status": status_put, "body": body_put})
            
            # 4. Delete Channel
            status_del, body_del = test_endpoint("DELETE", f"{base_url}/{acc_id}")
            if status_del != 200:
                defects.append({"desc": "DELETE /accounts/{id} failed", "status": status_del, "body": body_del})

with open('audit_api_results.json', 'w') as f:
    json.dump(defects, f, indent=2)
print("API Audit Completed")
