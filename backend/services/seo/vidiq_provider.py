import webbrowser
import urllib.parse
from .base import BaseSEOProvider

class VidIQProvider(BaseSEOProvider):
    """
    VidIQ validation provider.
    Relies on the user having the VidIQ browser extension installed.
    It simply opens the target YouTube URLs where the extension injects its UI.
    """
    
    def open_studio_mode(self, video_id: str) -> dict:
        if video_id:
            url = f"https://studio.youtube.com/video/{video_id}/edit"
        else:
            url = "https://studio.youtube.com"
            
        webbrowser.open(url)
        return {"success": True, "message": "YouTube Studio opened in browser"}

    def open_search_mode(self, keyword: str) -> dict:
        encoded = urllib.parse.quote_plus(keyword)
        url = f"https://www.youtube.com/results?search_query={encoded}"
        
        webbrowser.open(url)
        return {"success": True, "message": "YouTube Search opened in browser"}
