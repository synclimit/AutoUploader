import uuid
import platform
import hashlib

def get_hardware_id() -> str:
    """
    Generates a stable hardware ID without relying on wmic or powershell.
    Uses MAC address, node name, machine architecture, processor name, and OS system.
    """
    mac = str(uuid.getnode())
    node = platform.node()
    machine = platform.machine()
    processor = platform.processor()
    system_uuid = platform.system()
    
    raw = f"{mac}-{node}-{machine}-{processor}-{system_uuid}"
    
    # Hash using SHA256
    h = hashlib.sha256(raw.encode('utf-8')).hexdigest().upper()
    
    # Return in format XXXX-XXXX-XXXX-XXXX
    return f"{h[0:4]}-{h[4:8]}-{h[8:12]}-{h[12:16]}"
