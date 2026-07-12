from .base import IAnalyticsProvider
from typing import Dict, Any, Optional
from googleapiclient.discovery import build
from datetime import datetime, timedelta

class YouTubePlugin(IAnalyticsProvider):
    """
    YouTube Analytics Provider Implementation.
    Requires `https://www.googleapis.com/auth/youtube.readonly` and 
    `https://www.googleapis.com/auth/yt-analytics.readonly` scopes.
    """
    
    def _get_youtube_service(self, credentials):
        if not credentials:
            raise ValueError("Credentials are required for YouTube API")
        return build("youtube", "v3", credentials=credentials)
        
    def _get_youtube_analytics_service(self, credentials):
        if not credentials:
            raise ValueError("Credentials are required for YouTube API")
        return build("youtubeAnalytics", "v2", credentials=credentials)
    
    def get_channel_metrics(self, channel_id: str, credentials: Any = None) -> Dict[str, Any]:
        youtube = self._get_youtube_service(credentials)
        response = youtube.channels().list(mine=True, part="id,statistics,snippet").execute()
        
        if not response.get("items"):
            raise ValueError("No YouTube channel found for this channel.")
            
        channel = response["items"][0]
        stats = channel.get("statistics", {})
        
        return {
            "subscribers": int(stats.get("subscriberCount", 0)),
            "views": int(stats.get("viewCount", 0)),
            "videos": int(stats.get("videoCount", 0)),
            "channel_id": channel["id"],
            "title": channel.get("snippet", {}).get("title", "")
        }
        
    def get_analytics_metrics(self, channel_id: str, credentials: Any = None) -> Dict[str, Any]:
        # Fetch high-level analytics (Last 28 days for CTR, watch time, etc)
        # Using YouTube Analytics API
        analytics = self._get_youtube_analytics_service(credentials)
        
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=28)).strftime("%Y-%m-%d")
        
        try:
            response = analytics.reports().query(
                ids="channel==MINE",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched,averageViewDuration"
            ).execute()
            
            # YouTube API response format:
            # { "columnHeaders": [...], "rows": [ [views, watchTime, avgDuration] ] }
            
            rows = response.get("rows", [])
            if not rows:
                return {"views": 0, "watchTime": 0, "avgViewDuration": 0, "ctr": 0}
                
            row = rows[0]
            # Convert watchTime (minutes) to string representation if needed, 
            # or just return the raw values and format them later.
            return {
                "views": row[0],
                "watchTime": row[1],
                "avgViewDuration": row[2],
                "ctr": 0 # CTR is typically not available without specific dimensions
            }
        except Exception as e:
            print(f"Analytics API Error: {e}")
            return {"views": 0, "watchTime": 0, "avgViewDuration": 0, "ctr": 0}
        
    def get_chart_data(self, channel_id: str, days: int, credentials: Any = None) -> Dict[str, Any]:
        analytics = self._get_youtube_analytics_service(credentials)
        
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        try:
            response = analytics.reports().query(
                ids="channel==MINE",
                startDate=start_date,
                endDate=end_date,
                metrics="views,subscribersGained,subscribersLost",
                dimensions="day",
                sort="day"
            ).execute()
            
            rows = response.get("rows", [])
            chart_data = []
            
            for row in rows:
                chart_data.append({
                    "date": row[0],
                    "views": row[1],
                    "subscribers": row[2] - row[3]
                })
                
            return {"history": chart_data}
        except Exception as e:
            print(f"Analytics Chart API Error: {e}")
            return {"history": []}
        
    def get_videos(self, channel_id: str, page_token: Optional[str], limit: int, credentials: Any = None) -> Dict[str, Any]:
        return {}
