from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

import uuid
from datetime import datetime

from database.db import Base
from sqlalchemy import Boolean

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    channel_name = Column(String, unique=True, nullable=False)
    channel_id = Column(String, nullable=True)
    subscribers = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    profile_id = Column(String, ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    
    source_type = Column(String, default="M1_VIDEO_SPLITTER")
    region = Column(String, default="Indonesia")
    
    watch_folder = Column(String, nullable=True)
    watch_folder_enabled = Column(Boolean, default=False)
    
    authentication_status = Column(String, default="Disconnected")
    
    # Publishing Schedule / Rules
    publish_enabled = Column(Boolean, default=False)
    preferred_publish_time = Column(String, nullable=True)
    publish_timezone = Column(String, default="UTC")
    publish_variance = Column(Integer, default=0)
    publish_mode = Column(String, default="exact")
    publish_days = Column(String, default="Mon,Tue,Wed,Thu,Fri,Sat,Sun")
    publish_visibility = Column(String, default="public")
    review_before_publish = Column(Boolean, default=True)
    
    import_folder = Column(String, nullable=True)
    browser_profile = Column(String, nullable=True)
    metadata_profile = Column(String, nullable=True)
    upload_preset = Column(String, nullable=True)
    playlist = Column(String, nullable=True)
    upload_provider = Column(String, default="api")
    category = Column(String, default="20")
    audience = Column(String, default="not_kids")
    license = Column(String, default="standard")
    language = Column(String, default="en")
    ai_preset = Column(String, default="gaming_v1")
    
    upload_defaults = Column(String, default="{}")
    advanced_settings = Column(String, default="{}")
    ai_identity = Column(String, default="{}")
    schedule_profile = Column(String, default="{}")
    
    pipelines = Column(String, default="{}")
    pipeline_states = Column(String, default="{}")
    
    schema_version = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("Profile", back_populates="accounts")


class UploadTask(Base):
    __tablename__ = "upload_tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(String, ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    
    # State Machine
    status = Column(String, nullable=False, default="WATCHED")
    upload_stage = Column(String, nullable=False, default="NONE")
    metadata_source = Column(String, nullable=False) # 'PROFILE', 'GEMINI', 'RENDERER', 'MANUAL'
    source_type = Column(String, nullable=False) # 'M1_VIDEO_SPLITTER', 'M3_PLAYLIST_BUILDER', 'MANUAL_UPLOAD'

    # Folder-Based Package Pointers
    package_folder = Column(String, nullable=False) # Base folder path
    video_path = Column(String, nullable=False)
    thumbnail_path = Column(String, nullable=True)
    metadata_path = Column(String, nullable=True)
    timestamps_path = Column(String, nullable=True)
    
    # Core Metadata (Parsed / Generated - Snapshot)
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    privacy_status = Column(String, nullable=False, default="private")
    made_for_kids = Column(Boolean, nullable=False, default=False)
    video_id = Column(String, nullable=True, index=True)  # From metadata.json — primary duplicate detection key
    
    # Extend YouTube API Metadata
    playlist_id = Column(String, nullable=True)
    playlist_title = Column(String, nullable=True)
    category_id = Column(Integer, nullable=True)
    ai_use = Column(String, nullable=False, default="UNKNOWN")
    default_language = Column(String, nullable=True)
    audio_language = Column(String, nullable=True)
    recording_date = Column(DateTime, nullable=True)
    license = Column(String, nullable=True)
    audience = Column(String, nullable=True)
    notify_subscribers = Column(Boolean, nullable=False, default=True)
    embeddable = Column(Boolean, nullable=False, default=True)
    public_stats_viewable = Column(Boolean, nullable=False, default=True)
    
    # YouTube specific fields
    youtube_video_id = Column(String, nullable=True)
    youtube_url = Column(String, nullable=True)
    
    # Scheduling Metadata (Phase 5)
    pipeline_type = Column(String, nullable=True) # 'long' or 'shorts'
    schedule_mode = Column(String, nullable=True) # 'application' or 'youtube'
    schedule_time = Column(String, nullable=True) # HH:MM format
    humanize_enabled = Column(Boolean, default=False)
    humanize_min = Column(Integer, default=0)
    humanize_max = Column(Integer, default=0)
    
    # Sprint 10.5 AI Metadata
    upload_mode = Column(String, default="Waiting For Approval")
    ai_metadata_generated = Column(Boolean, default=False)
    
    # Retry & Scheduling Model
    retry_count = Column(Integer, default=0)
    failure_reason = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    scheduled_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Validation History
    last_seo_validation_at = Column(DateTime, nullable=True)
    last_seo_provider = Column(String, nullable=True)
    upload_progress = Column(Integer, nullable=True, default=0)

    logs = relationship("UploadLog", back_populates="task", cascade="all, delete-orphan")
    ai_histories = relationship("AIGenerationHistory", back_populates="task", cascade="all, delete-orphan", order_by="desc(AIGenerationHistory.version)")


class AIGenerationHistory(Base):
    __tablename__ = "ai_generation_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("upload_tasks.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    provider = Column(String, nullable=True)
    model = Column(String, nullable=True)
    keyword = Column(String, nullable=True)
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    prompt_version = Column(String, nullable=True)
    prompt_name = Column(String, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    raw_response_json = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("UploadTask", back_populates="ai_histories")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    content_type = Column(String, default="Longform (16:9)")
    metadata_strategy = Column(String, default="Template Only")
    
    # Missing fields from checklist
    category = Column(String, nullable=True)
    language = Column(String, nullable=True)
    audience = Column(String, nullable=True)
    license = Column(String, nullable=True)
    thumbnail_rules = Column(String, nullable=True)
    ai_preset = Column(String, nullable=True)
    prompt_template = Column(String, nullable=True)
    is_default = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    templates = relationship("ProfileTemplate", back_populates="profile", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="profile")


class ProfileTemplate(Base):
    __tablename__ = "profile_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # 'title', 'description', 'tag'
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Profile", back_populates="templates")


class UploadLog(Base):
    __tablename__ = "upload_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("upload_tasks.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("UploadTask", back_populates="logs")


class GlobalSettings(Base):
    __tablename__ = "global_settings"

    id = Column(Integer, primary_key=True, default=1)
    general_language = Column(String, default="en")
    general_theme = Column(String, default="dark")
    general_launch = Column(Boolean, default=True)
    general_update = Column(Boolean, default=True)
    
    upload_concurrent = Column(Integer, default=3)
    upload_retry = Column(Integer, default=5)
    
    ai_provider = Column(String, default="gemini")
    ai_api_key = Column(String, nullable=True)
    ai_base_url = Column(String, nullable=True)
    ai_model = Column(String, nullable=True)
    ai_temperature = Column(String, default="0.7")
    ai_max_tokens = Column(Integer, default=2048)
    ai_system_prompt = Column(String, nullable=True)
    ai_enabled = Column(Boolean, default=True)
    ai_timeout = Column(Integer, default=30)
    ai_retry = Column(Integer, default=3)
    
    notif_desktop = Column(Boolean, default=True)
    notif_sound = Column(Boolean, default=True)
    notif_success = Column(Boolean, default=True)
    notif_fail = Column(Boolean, default=True)
    
    perf_mode = Column(String, default="balanced")
    perf_workers = Column(Integer, default=4)
    perf_threads = Column(Integer, default=8)
    perf_gpu = Column(Boolean, default=True)
    perf_mem = Column(Integer, default=4096)
    
    app_density = Column(String, default="comfortable")
    app_color = Column(String, default="cyan")
    app_anim = Column(Boolean, default=True)
    app_compact = Column(Boolean, default=False)
    
    adv_dev = Column(Boolean, default=False)
    adv_logs = Column(Boolean, default=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
