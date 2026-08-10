import os
import sys
import logging
import threading
from typing import Callable, Optional
from PIL import Image, ImageDraw
import pystray

logger = logging.getLogger("TrayService")

class TrayService:
    def __init__(self, on_show_callback: Optional[Callable] = None, on_exit_callback: Optional[Callable] = None):
        self.on_show_callback = on_show_callback
        self.on_exit_callback = on_exit_callback
        self.icon: Optional[pystray.Icon] = None
        self._is_running = False

    def _get_icon_image(self) -> Image.Image:
        """Load logo image for system tray or create fallback colored icon."""
        possible_paths = [
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "Logo.png"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "favicon.png"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "Logo.png"),
        ]
        
        for path in possible_paths:
            norm_path = os.path.normpath(path)
            if os.path.exists(norm_path):
                try:
                    img = Image.open(norm_path)
                    img.thumbnail((64, 64), Image.Resampling.LANCZOS)
                    # Convert to RGBA
                    if img.mode != 'RGBA':
                        img = img.convert('RGBA')
                    return img
                except Exception as e:
                    logger.warning(f"Could not load icon from {norm_path}: {e}")

        # Fallback drawn icon (Cyan circle)
        img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.ellipse((4, 4, 60, 60), fill=(34, 211, 238, 255), outline=(13, 19, 31, 255), width=3)
        return img

    def start(self):
        """Start the system tray icon in detached background mode."""
        if self._is_running:
            return

        try:
            image = self._get_icon_image()
            
            menu = pystray.Menu(
                pystray.MenuItem(
                    "Buka Raynz PitStop", 
                    self._handle_show, 
                    default=True,
                    bold=True
                ),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem(
                    "🟢 Status: Berjalan di Background", 
                    None, 
                    enabled=False
                ),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem(
                    "Keluar (Exit)", 
                    self._handle_exit
                )
            )

            self.icon = pystray.Icon(
                "RaynzPitStop",
                image,
                "Raynz PitStop (Berjalan di Background)",
                menu
            )

            self._is_running = True
            self.icon.run_detached()
            logger.info("System Tray service started in background.")

        except Exception as e:
            logger.error(f"Failed to start System Tray service: {e}")

    def notify_hidden(self):
        """Send Windows notification when app is minimized to tray."""
        if self.icon and self._is_running:
            try:
                self.icon.notify(
                    "Raynz PitStop berjalan di background.\nKlik 2x ikon di tray untuk membuka kembali.",
                    "Raynz PitStop"
                )
            except Exception as e:
                logger.warning(f"Could not send tray notification: {e}")

    def _handle_show(self, icon=None, item=None):
        """Handle click on 'Buka Raynz PitStop'."""
        if self.on_show_callback:
            try:
                self.on_show_callback()
            except Exception as e:
                logger.error(f"Error during show callback: {e}")

    def _handle_exit(self, icon=None, item=None):
        """Handle click on 'Keluar (Exit)'."""
        self.stop()
        if self.on_exit_callback:
            try:
                self.on_exit_callback()
            except Exception as e:
                logger.error(f"Error during exit callback: {e}")
        else:
            sys.exit(0)

    def stop(self):
        """Stop system tray icon."""
        if self.icon:
            try:
                self.icon.stop()
            except Exception as e:
                logger.warning(f"Error stopping tray icon: {e}")
            self.icon = None
        self._is_running = False
        logger.info("System Tray service stopped.")
