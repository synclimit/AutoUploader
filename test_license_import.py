import asyncio
import io
import sys
sys.path.append('d:/AutoUploader/backend')

from fastapi import UploadFile
from api.license import import_license

async def test():
    f = UploadFile(filename='license.lic', file=io.BytesIO(b'{"payload": {"hardware_id": "FF79-6608-AC8F-145D"}, "signature": "invalid"}'))
    try:
        res = await import_license(f)
        print("Success:", res)
    except Exception as e:
        print("Error:", repr(e))

asyncio.run(test())
