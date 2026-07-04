from database.db import SessionLocal
from services.upload_service import UploadService, GenerateMetadataRequest
from models import UploadTask
import asyncio
import traceback

async def main():
    db = SessionLocal()
    task = db.query(UploadTask).first()
    if not task:
        print('No tasks found')
        return
    req = GenerateMetadataRequest(
        keyword='hujan deras', 
        target='improve', 
        current_title='coba', 
        current_description='', 
        current_tags=''
    )
    try:
        res = await UploadService.generate_metadata(db, task.id, req)
        print('Success:', res)
    except Exception as e:
        traceback.print_exc()
        print('Failed with 500-level error:', type(e), e)

if __name__ == "__main__":
    asyncio.run(main())
