import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event

from .base import Base
from services.system.path_service import PathService

db_path = PathService.get_database_path()
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{db_path}")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

def ensure_schema_migrations(target_engine):
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(target_engine)
        if inspector.has_table("upload_tasks"):
            existing = {c["name"] for c in inspector.get_columns("upload_tasks")}
            with target_engine.connect() as conn:
                if "channel_id" not in existing:
                    conn.execute(text("ALTER TABLE upload_tasks ADD COLUMN channel_id VARCHAR"))
                    conn.commit()
                if "account_id" not in existing:
                    conn.execute(text("ALTER TABLE upload_tasks ADD COLUMN account_id VARCHAR"))
                    conn.commit()
                conn.execute(text("UPDATE upload_tasks SET channel_id = account_id WHERE (channel_id IS NULL OR channel_id = '') AND account_id IS NOT NULL"))
                conn.execute(text("UPDATE upload_tasks SET account_id = channel_id WHERE (account_id IS NULL OR account_id = '') AND channel_id IS NOT NULL"))
                conn.commit()
    except Exception as e:
        print("[DB Schema Migration Notice]", e)

try:
    ensure_schema_migrations(engine)
except Exception:
    pass

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()