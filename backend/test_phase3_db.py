from database.db import SessionLocal, engine
from models import Channel, OAuthCredential
import uuid

def test_db():
    db = SessionLocal()
    try:
        # Create Channel
        c = Channel(
            id=str(uuid.uuid4()),
            alias_name="Test Channel",
            project_id="test-proj-123",
            client_id="client-456",
            credential_folder="test-folder",
            health_status="CONNECTED"
        )
        db.add(c)
        db.commit()
        db.refresh(c)
        
        print("Channel Created:", c.id, c.alias_name)
        
        # Create Token
        t = OAuthCredential(
            channel_id=c.id,
            access_token="acc-token",
            refresh_token="ref-token"
        )
        db.add(t)
        db.commit()
        db.refresh(t)
        print("Token Created:", t.id, t.channel_id)
        
        # Test Query
        channel = db.query(Channel).first()
        print("Fetched Channel Token:", channel.oauth_credential.access_token)
        
    finally:
        db.close()

if __name__ == "__main__":
    test_db()
