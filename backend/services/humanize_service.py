import random
from datetime import datetime, timedelta
import zoneinfo

class HumanizeService:
    @staticmethod
    def calculate_publish_time(
        preferred_time: str, 
        variance_minutes: int, 
        publish_days: str, 
        timezone_str: str = "UTC"
    ) -> datetime:
        """
        Pure deterministic service to calculate humanized publish times.
        Input:
            - preferred_time: 'HH:MM' (24h)
            - variance_minutes: int
            - publish_days: 'Mon,Tue,Wed'
            - timezone_str: e.g. 'UTC' or 'Asia/Jakarta'
        """
        if not preferred_time:
            return datetime.utcnow()
            
        try:
            tz = zoneinfo.ZoneInfo(timezone_str)
        except Exception:
            tz = zoneinfo.ZoneInfo("UTC")
            
        now = datetime.now(tz)
        try:
            h, m = map(int, preferred_time.split(":"))
        except ValueError:
            h, m = 12, 0
            
        target_date = now.replace(hour=h, minute=m, second=0, microsecond=0)
        
        # Simple days logic: if today isn't in publish_days, just push it to tomorrow for now 
        # (This is simplified; a full robust implementation would find the next matching day)
        days_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        current_day_str = days_map[target_date.weekday()]
        
        allowed_days = [d.strip() for d in publish_days.split(",")] if publish_days else days_map
        
        while current_day_str not in allowed_days or target_date < now:
            target_date += timedelta(days=1)
            current_day_str = days_map[target_date.weekday()]
            
        if variance_minutes > 0:
            offset = random.randint(-variance_minutes, variance_minutes)
            target_date += timedelta(minutes=offset)
            
        # Ensure it's not in the past due to negative variance
        if target_date < now:
            target_date = now + timedelta(minutes=1)
            
        # Convert back to UTC for DB storage
        target_utc = target_date.astimezone(zoneinfo.ZoneInfo("UTC")).replace(tzinfo=None)
        return target_utc
