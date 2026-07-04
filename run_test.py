import os, json, shutil, time
from database.db import SessionLocal
from services.channel_service import ChannelService
from services.watch_folder.engine import get_engine as get_wf_engine
from services.upload_service import UploadService
from services.upload_engine.engine import get_engine as get_upload_engine
from models import UploadTask, Account

def run_test():
    print("Initializing DB...")
    db = SessionLocal()

    print('Creating test package...')
    package_dir = 'test_package_api'
    os.makedirs(package_dir, exist_ok=True)
    shutil.copy('../test_assets/video_720p_30s.mp4', os.path.join(package_dir, 'video.mp4'))
    with open(os.path.join(package_dir, 'metadata.json'), 'w') as f:
        json.dump({'video_id': 'test-api-1', 'title_final': 'Test API Worker Final', 'description': 'desc', 'visibility': 'private', 'kids': False}, f)

    print('Fetching accounts...')
    accounts = ChannelService.get_all(db)
    if not accounts:
        # Create a dummy account if none exists
        print('No accounts found, creating a dummy one...')
        account = Account(id='test-account-id', channel_name='Test Channel', source_type='M1_VIDEO_SPLITTER', region='Indonesia', browser_profile='youtube_automation', upload_provider='playwright')
        db.add(account)
        db.commit()
    else:
        account = accounts[0]
        # Just use whatever is in DB, now it's api.
        db.commit()
    
    print('Using Account:', account.id, account.channel_name)

    print('Processing folder...')
    wf_engine = get_wf_engine()
    # It must be an absolute path or relative to backend?
    abs_package_dir = os.path.abspath(package_dir)
    outcome = wf_engine._process_folder(abs_package_dir, account, db)
    print('Import outcome:', outcome)

    print('Approving task...')
    task = db.query(UploadTask).filter(UploadTask.title == 'Test API Worker Final').order_by(UploadTask.created_at.desc()).first()
    if not task:
        print('Task not found!')
        return

    print('Found task:', task.id, 'Status:', task.status)
    UploadService.approve(db, task.id)
    print('Task approved to QUEUED')
    db.refresh(task)
    print('Current status:', task.status)

    print('Running Upload Engine directly (sync)...')
    upload_engine = get_upload_engine()
    upload_engine._process_queue()

    db.refresh(task)
    print('Task final status:', task.status)

if __name__ == "__main__":
    run_test()
