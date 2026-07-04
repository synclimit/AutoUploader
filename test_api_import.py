import subprocess
import time
import requests

# Start the server
process = subprocess.Popen(["uvicorn", "main:app", "--port", "8003"], cwd="d:/AutoUploader/backend")

# Wait for it to start
time.sleep(3)

try:
    # Test the import
    with open("d:/AutoUploader/LicenseGenerator/license.lic", "rb") as f:
        response = requests.post("http://localhost:8003/api/v1/license/import", files={"file": f})
    
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
finally:
    # Kill the server
    process.terminate()
