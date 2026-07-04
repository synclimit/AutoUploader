import sys
import requests

BASE_URL = "http://localhost:8000/api/v1/settings"

def step1():
    print("Executing Step 1: GET -> PUT")
    # GET
    res = requests.get(BASE_URL)
    print(f"GET /settings: {res.status_code}")
    if res.status_code != 200:
        print(f"Error GET: {res.text}")
        return

    # PUT
    res = requests.put(BASE_URL, json={
        "general_language": "id",
        "general_theme": "light"
    })
    print(f"PUT /settings: {res.status_code}")
    if res.status_code != 200:
        print(f"Error PUT: {res.text}")
        return
    print("PUT Success. Next step: Restart backend and run step2.")

def step2():
    print("Executing Step 2: GET after restart")
    res = requests.get(BASE_URL)
    print(f"GET /settings: {res.status_code}")
    if res.status_code != 200:
        print(f"Error GET: {res.text}")
        return
    
    data = res.json()
    lang = data.get("general_language")
    theme = data.get("general_theme")
    print(f"Current values: general_language={lang}, general_theme={theme}")
    if lang == "id" and theme == "light":
        print("PASS (Values persist across restart)")
    else:
        print("FAIL (Values DID NOT persist)")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "step2":
        step2()
    else:
        step1()
