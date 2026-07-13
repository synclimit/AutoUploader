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

router = APIRouter(prefix="/api/v1/channels", tags=["Accounts"])

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
    pass

@router.get("", response_model=List[AccountListResponse])
def get_accounts(db: Session = Depends(get_db)):
    import time
    start_time = time.time()
    debug_log("Request received: GET /api/v1/channels")
    debug_log(f"Database path: {db.get_bind().url.database}")
    
    try:
        channels = ChannelService.get_all(db)
        execution_time = (time.time() - start_time) * 1000
        debug_log(f"HTTP status: 200")
        debug_log(f"Returned rows: {len(channels)}")
        debug_log(f"Execution time: {execution_time:.2f} ms")
        return channels
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
        yt_channel_id = result["channel_id"]
        channel_name = urllib.parse.quote(result["channel_name"])
        avatar_url = urllib.parse.quote(result.get("avatar_url") or "")
        redirect_url = f"http://127.0.0.1:8000/accounts/confirm?accountId={account_id}&channelId={yt_channel_id}&channelName={channel_name}&avatarUrl={avatar_url}"
        return RedirectResponse(redirect_url)
    except Exception as e:
        print(f"OAuth Error: {e}")
        return RedirectResponse("http://127.0.0.1:8000/channels?error=oauth_failed")

@router.get("/{channel_id}", response_model=AccountDetailResponse)
def get_account(channel_id: str, db: Session = Depends(get_db)):
    return ChannelService.get_by_id(db, channel_id)

@router.post("", response_model=AccountDetailResponse, status_code=status.HTTP_201_CREATED)
def create_account(data: AccountCreate, db: Session = Depends(get_db)):
    return ChannelService.create(db, data)

@router.put("/{channel_id}", response_model=AccountDetailResponse)
def update_account(channel_id: str, data: AccountUpdate, db: Session = Depends(get_db)):
    return ChannelService.update(db, channel_id, data)

@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(channel_id: str, db: Session = Depends(get_db)):
    ChannelService.delete(db, channel_id)
    return None

@router.get("/{channel_id}/auth-url")
def get_auth_url(channel_id: str, db: Session = Depends(get_db)):
    auth_url = ChannelService.get_auth_url(db, channel_id, _temp_credentials)
    return {"auth_url": auth_url}

@router.post("/{channel_id}/disconnect", response_model=AccountDetailResponse)
def disconnect_channel(channel_id: str, db: Session = Depends(get_db)):
    return ChannelService.disconnect_channel(db, channel_id)

@router.post("/{channel_id}/refresh", response_model=AccountDetailResponse)
def refresh_token(channel_id: str, db: Session = Depends(get_db)):
    return ChannelService.refresh_token(db, channel_id)

@router.post("/{channel_id}/confirm-channel", response_model=AccountDetailResponse)
def confirm_channel(channel_id: str, request: ConfirmChannelRequest, db: Session = Depends(get_db)):
    return ChannelService.confirm_channel(db, channel_id, request, _temp_credentials)

@router.get("/{channel_id}/playlists")
def get_playlists(channel_id: str, db: Session = Depends(get_db)):
    return ChannelService.get_playlists(db, channel_id)
