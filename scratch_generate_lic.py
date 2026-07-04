import rsa
import json
import base64
from datetime import date
from pathlib import Path

script_dir = Path(r"d:\AutoUploader\LicenseGenerator")
private_key_path = script_dir / 'private.pem'
output_path = Path(r"d:\AutoUploader\license.lic")

with open(private_key_path, 'rb') as f:
    priv_key = rsa.PrivateKey.load_pkcs1(f.read())

payload = {
    "customer_name": "Pro User",
    "hardware_id": "FF79-6608-AC8F-145D",
    "edition": "Professional",
    "issue_date": date.today().isoformat(),
    "version": "1.0"
}

payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
signature = rsa.sign(payload_str.encode('utf-8'), priv_key, 'SHA-256')
signature_b64 = base64.b64encode(signature).decode('utf-8')

license_data = {
    "payload": payload,
    "signature": signature_b64
}

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(license_data, f, indent=4)

print("License generated successfully at", output_path)
