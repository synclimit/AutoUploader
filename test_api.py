import sqlite3
import urllib.request
import json
import os

db_path = r"C:\Users\Server Abal\AppData\Roaming\AutoUploader\database.db"

def main():
    if not os.path.exists(db_path):
        print("DB not found at", db_path)
        return
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT ai_api_key, ai_base_url, ai_model FROM global_settings LIMIT 1")
    row = cur.fetchone()
    if not row:
        print("No global_settings found.")
        return
        
    api_key, base_url, model = row
    if not api_key:
        print("No api key")
        return
        
    print(f"API Key retrieved: {api_key[:6]}...{api_key[-4:]}")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    try:
        req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            models = [m['name'] for m in data.get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
            print("MODELS:" + ",".join(models))
    except Exception as e:
        print(f"Error: {e}")
        import urllib.error
        if isinstance(e, urllib.error.HTTPError):
            print(e.read().decode())

if __name__ == "__main__":
    main()
