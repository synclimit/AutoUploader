from fastapi import APIRouter, Depends, Request, UploadFile, File
from sqlalchemy.orm import Session
from typing import Union

from database.db import get_db
from api.controllers.oauth_controller import OAuthController
from api.schemas.oauth_schema import SuccessResponse, ErrorResponse

router = APIRouter(prefix="/api/v1/oauth", tags=["oauth"])

@router.post("/channels/{channel_id}/credential/upload", response_model=Union[SuccessResponse, ErrorResponse])
async def upload_credential(channel_id: str, file: UploadFile = File(...)):
    content = await file.read()
    return OAuthController.upload_credential(channel_id, content.decode('utf-8'))

@router.get("/channels/{channel_id}/url", response_model=Union[SuccessResponse, ErrorResponse])
def get_oauth_url(channel_id: str, redirect_uri: str = None):
    return OAuthController.get_oauth_url(channel_id, redirect_uri)

from fastapi.responses import HTMLResponse

@router.get("/callback")
def oauth_callback(code: str, state: str, db: Session = Depends(get_db)):
    # state contains the channel_id
    channel_id = state
    result = OAuthController.handle_callback(db, channel_id, code, redirect_uri=None)
    
    html_content = """
    <html>
        <head>
            <title>AutoUploader - Authentication Successful</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #05080e; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .container { text-align: center; background: rgba(255,255,255,0.05); padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
                h1 { color: #22d3ee; }
                p { color: rgba(255,255,255,0.7); }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✅ Authentication Successful!</h1>
                <p>Your YouTube channel has been connected.</p>
                <p>You can now safely close this browser tab and return to the AutoUploader application.</p>
            </div>
            <script>
                setTimeout(() => window.close(), 3000);
            </script>
        </body>
    </html>
    """
    
    if not result.success:
        html_content = html_content.replace("✅ Authentication Successful!", "❌ Authentication Failed!")
        html_content = html_content.replace("Your YouTube channel has been connected.", f"Error: {result.message}")
        
    return HTMLResponse(content=html_content)

@router.post("/channels/{channel_id}/reconnect", response_model=Union[SuccessResponse, ErrorResponse])
def reconnect(channel_id: str, db: Session = Depends(get_db)):
    # Essentially reconnect is getting URL again or forcing refresh
    # We will map it to get_oauth_url for UI to open new window
    return OAuthController.get_oauth_url(channel_id, redirect_uri=None)

@router.post("/channels/{channel_id}/refresh", response_model=Union[SuccessResponse, ErrorResponse])
def refresh_token(channel_id: str, db: Session = Depends(get_db)):
    return OAuthController.refresh_token(db, channel_id)

@router.get("/channels/{channel_id}/health", response_model=Union[SuccessResponse, ErrorResponse])
def get_health(channel_id: str, db: Session = Depends(get_db)):
    return OAuthController.get_health(db, channel_id)

@router.get("/channels/{channel_id}/diagnostics", response_model=Union[SuccessResponse, ErrorResponse])
def get_diagnostics(channel_id: str):
    return OAuthController.get_diagnostics(channel_id)
