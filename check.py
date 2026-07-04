import sqlite3
import urllib.request
import json

db_path = "D:\\AutoUploader\\auto_uploader.db"

def main():
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT value FROM settings WHERE key = 'ai_provider'")
        row = cur.fetchone()
        if not row:
            print("No ai_provider found.")
            return
            
        ai_settings = json.loads(row[0].replace("'", '"')) if isinstance(row[0], str) else row[0]
        api_key = ai_settings.get("api_key")
        
        print(f"Key in DB: {api_key[:10]}...{api_key[-4:]}")
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        print(f"Requesting: {url.replace(api_key, 'HIDDEN')}")
        
        req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            models = [m['name'] for m in data.get('models', [])]
            print("Available models:")
            print(models)
            
    except Exception as e:
        print(f"Error: {e}")
        import urllib.error
        if isinstance(e, urllib.error.HTTPError):
            print(e.read().decode())

if __name__ == "__main__":
    main()
