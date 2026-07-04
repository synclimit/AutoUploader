import subprocess
import winsound
import threading
import os
import logging
from database.db import SessionLocal
from models import GlobalSettings

logger = logging.getLogger("notification_service")

class NotificationService:
    @staticmethod
    def _play_sound():
        try:
            # Play a system notification sound (asterisk)
            winsound.MessageBeep(winsound.MB_ICONASTERISK)
        except Exception as e:
            logger.error(f"Failed to play sound: {e}")

    @staticmethod
    def _show_desktop_notification(title: str, message: str):
        try:
            # Escape double quotes for powershell
            title_escaped = title.replace('"', '\\"')
            message_escaped = message.replace('"', '\\"')
            
            ps_script = f"""
            [reflection.assembly]::loadwithpartialname("System.Windows.Forms") | Out-Null
            [reflection.assembly]::loadwithpartialname("System.Drawing") | Out-Null
            $notify = New-Object system.windows.forms.notifyicon
            $notify.icon = [System.Drawing.SystemIcons]::Information
            $notify.visible = $true
            $notify.showballoontip(10, "{title_escaped}", "{message_escaped}", [system.windows.forms.tooltipicon]::Info)
            # Give it time to show up, then dispose to clean up the tray icon
            Start-Sleep -Seconds 5
            $notify.Dispose()
            """
            
            # Run in a background thread so it doesn't block the backend
            def run_ps():
                # CREATE_NO_WINDOW = 0x08000000 to prevent console window flashing
                subprocess.run(
                    ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script], 
                    creationflags=0x08000000
                )
            
            threading.Thread(target=run_ps, daemon=True).start()
        except Exception as e:
            logger.error(f"Failed to show desktop notification: {e}")

    @classmethod
    def notify_upload_success(cls, video_title: str):
        db = SessionLocal()
        try:
            settings = db.query(GlobalSettings).first()
            if not settings: return
            
            if settings.notif_sound and settings.notif_success:
                cls._play_sound()
                
            if settings.notif_desktop and settings.notif_success:
                title = "Upload Completed!"
                msg = f"Successfully uploaded: {video_title}"
                cls._show_desktop_notification(title, msg)
        finally:
            db.close()

    @classmethod
    def notify_upload_failed(cls, video_title: str, error_msg: str):
        db = SessionLocal()
        try:
            settings = db.query(GlobalSettings).first()
            if not settings: return
            
            if settings.notif_sound and settings.notif_fail:
                try:
                    winsound.MessageBeep(winsound.MB_ICONHAND) # Error sound
                except:
                    pass
                
            if settings.notif_desktop and settings.notif_fail:
                title = "Upload Failed"
                msg = f"Failed to upload: {video_title}\n{error_msg}"
                cls._show_desktop_notification(title, msg)
        finally:
            db.close()
