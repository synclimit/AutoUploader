from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from database.db import SessionLocal
from schemas import (
    AccountCreate, AccountUpdate, AccountListResponse, AccountDetailResponse, ConfirmChannelRequest
)
from fastapi.responses import RedirectResponse, HTMLResponse
from services.channel_service import ChannelService
import urllib.parse

router = APIRouter(prefix="/api/v1/accounts", tags=["Accounts"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Temporary in-memory store for credentials between callback and confirm
_temp_credentials = {}

import os
def debug_log(msg):
    try:
        # Write to Desktop
        desktop = os.path.join(os.path.join(os.environ['USERPROFILE']), 'Desktop')
        log_path_desktop = os.path.join(desktop, 'AutoUploader_Debug.txt')
        with open(log_path_desktop, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')
    except:
        pass
    try:
        # Write to AppData
        appdata = os.path.join(os.environ['APPDATA'], 'AutoUploader', 'logs')
        os.makedirs(appdata, exist_ok=True)
        log_path_appdata = os.path.join(appdata, 'AutoUploader_Debug.txt')
        with open(log_path_appdata, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')
    except:
        pass

@router.get("", response_model=List[AccountListResponse])
def get_accounts(db: Session = Depends(get_db)):
    import time
    start_time = time.time()
    debug_log("Request received: GET /api/v1/accounts")
    debug_log(f"Database path: {db.get_bind().url.database}")
    
    try:
        accounts = ChannelService.get_all(db)
        execution_time = (time.time() - start_time) * 1000
        debug_log(f"HTTP status: 200")
        debug_log(f"Returned rows: {len(accounts)}")
        debug_log(f"Execution time: {execution_time:.2f} ms")
        return accounts
    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        debug_log(f"HTTP status: 500")
        debug_log(f"Execution time: {execution_time:.2f} ms")
        debug_log(f"Exception: {str(e)}")
        import traceback
        debug_log(traceback.format_exc())
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/oauth-callback", include_in_schema=False)
def oauth_callback(code: str, state: str, db: Session = Depends(get_db)):
    try:
        result = ChannelService.oauth_callback(db, code, state, _temp_credentials)
        account_id = result["account_id"]
        channel_id = result["channel_id"]
        channel_name = urllib.parse.quote(result["channel_name"])
        avatar_url = urllib.parse.quote(result.get("avatar_url") or "")
        redirect_url = f"http://127.0.0.1:8000/accounts/confirm?accountId={account_id}&channelId={channel_id}&channelName={channel_name}&avatarUrl={avatar_url}"
        return RedirectResponse(redirect_url)
    except Exception as e:
        print(f"OAuth Error: {e}")
        return RedirectResponse("http://127.0.0.1:8000/accounts?error=oauth_failed")

@router.get("/{account_id}", response_model=AccountDetailResponse)
def get_account(account_id: str, db: Session = Depends(get_db)):
    return ChannelService.get_by_id(db, account_id)

@router.post("", response_model=AccountDetailResponse, status_code=status.HTTP_201_CREATED)
def create_account(data: AccountCreate, db: Session = Depends(get_db)):
    return ChannelService.create(db, data)

@router.put("/{account_id}", response_model=AccountDetailResponse)
def update_account(account_id: str, data: AccountUpdate, db: Session = Depends(get_db)):
    return ChannelService.update(db, account_id, data)

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: str, db: Session = Depends(get_db)):
    ChannelService.delete(db, account_id)
    return None

@router.get("/{account_id}/auth-url")
def get_auth_url(account_id: str, db: Session = Depends(get_db)):
    auth_url = ChannelService.get_auth_url(db, account_id, _temp_credentials)
    return {"auth_url": auth_url}

@router.post("/{account_id}/disconnect", response_model=AccountDetailResponse)
def disconnect_channel(account_id: str, db: Session = Depends(get_db)):
    return ChannelService.disconnect_channel(db, account_id)

@router.post("/{account_id}/refresh", response_model=AccountDetailResponse)
def refresh_token(account_id: str, db: Session = Depends(get_db)):
    return ChannelService.refresh_token(db, account_id)

@router.post("/{account_id}/confirm-channel", response_model=AccountDetailResponse)
def confirm_channel(account_id: str, request: ConfirmChannelRequest, db: Session = Depends(get_db)):
    return ChannelService.confirm_channel(db, account_id, request, _temp_credentials)

