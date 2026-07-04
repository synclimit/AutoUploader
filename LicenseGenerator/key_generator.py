import rsa
import os
from pathlib import Path

def generate_keys():
    print("Generating RSA-2048 keys... Please wait.")
    pubkey, privkey = rsa.newkeys(2048)
    
    pub_data = pubkey.save_pkcs1()
    priv_data = privkey.save_pkcs1()
    
    script_dir = Path(__file__).parent
    
    with open(script_dir / 'public.pem', 'wb') as pfile:
        pfile.write(pub_data)
        
    with open(script_dir / 'private.pem', 'wb') as prfile:
        prfile.write(priv_data)
        
    print("Keys generated successfully:")
    print(" - public.pem (Move this to AutoUploader backend)")
    print(" - private.pem (Keep this safe in LicenseGenerator)")

if __name__ == "__main__":
    generate_keys()
