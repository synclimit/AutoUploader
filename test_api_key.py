import urllib.request
import json
import urllib.error

def main():
    api_key = "AQ.Ab8RN6LeJK86P9MG6JqgfLlXKDNS2Rp4GNMpsc_Mgiqfo21SOA"
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    print(f"Testing key: {api_key}")
    
    try:
        req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            models = [m['name'] for m in data.get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
            print("MODELS:" + ",".join(models))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(e.read().decode())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
