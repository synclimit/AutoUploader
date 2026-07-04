from typing import Union

class AnalyticsFormatter:
    """
    Formats metrics for consistent UI display (e.g., CTR: 5.32%, Numbers with K/M).
    """
    
    @staticmethod
    def format_ctr(ctr_value: Union[float, int]) -> str:
        return f"{ctr_value:.2f}%"
        
    @staticmethod
    def format_number(num: Union[float, int]) -> str:
        if num >= 1000000:
            return f"{num/1000000:.1f}M"
        if num >= 1000:
            return f"{num/1000:.1f}K"
        return str(num)
        
    @staticmethod
    def format_duration(seconds: int) -> str:
        m, s = divmod(seconds, 60)
        h, m = divmod(m, 60)
        if h > 0:
            return f"{h}:{m:02d}:{s:02d}"
        return f"{m:02d}:{s:02d}"

analytics_formatter = AnalyticsFormatter()
