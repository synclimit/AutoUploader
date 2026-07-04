from sqlalchemy.orm import Session
from services.channel_service import ChannelService

class ChannelProvider:
    @staticmethod
    def get_channels(db: Session) -> dict:
        accounts = ChannelService.get_dashboard_projection(db)
        total = len(accounts)
        connected = sum(1 for a in accounts if a.authentication_status == "Connected")
        
        print(f"Dashboard Count (Connected): {connected}")
        print(f"Accounts Count (Total): {total}")
        
        return {
            "connected_channels": total,
            "authenticated_channels": connected,
            "disconnected_channels": total - connected
        }
