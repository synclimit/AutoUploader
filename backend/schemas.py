from pydantic import BaseModel, constr, Field, model_validator
from typing import List, Optional, Generic, TypeVar, Any
from datetime import datetime
from enum import Enum

T = TypeVar("T")

class APIMeta(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0"

class APIErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    error: Optional[APIErrorDetail] = None
    meta: APIMeta = Field(default_factory=APIMeta)

class ProfileTemplateBase(BaseModel):
    type: str
    content: str

class ProfileTemplateCreate(ProfileTemplateBase):
    pass

class ProfileTemplateResponse(ProfileTemplateBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileBase(BaseModel):
    name: constr(min_length=1, strip_whitespace=True)
    description: Optional[str] = None
    content_type: str = "Longform (16:9)"
    metadata_strategy: str = "Template Only"
    
    category: Optional[str] = None
    language: Optional[str] = None
    audience: Optional[str] = None
    license: Optional[str] = None
    thumbnail_rules: Optional[str] = None
    ai_preset: Optional[str] = None
    prompt_template: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileListResponse(BaseModel):
    id: str
    name: str
    content_type: str
    is_default: bool

    class Config:
        from_attributes = True

class ProfileDetailResponse(ProfileBase):
    id: str
    is_default: bool
    title_templates: List[ProfileTemplateResponse] = []
    description_templates: List[ProfileTemplateResponse] = []
    tag_templates: List[ProfileTemplateResponse] = []

    class Config:
        from_attributes = True

class BulkImportRequest(BaseModel):
    type: str  # 'title', 'description', 'tag'
    mode: str  # 'replace', 'append'
    templates: List[str]

class BulkImportResponse(BaseModel):
    imported_count: int
    skipped_count: int
    templates: List[ProfileTemplateResponse]


class SourceTypeEnum(str, Enum):
    m1 = "M1_VIDEO_SPLITTER"
    m3 = "M3_PLAYLIST_BUILDER"
    manual = "MANUAL_UPLOAD"
    campaign = "CAMPAIGN_EXECUTION"

class UploadProviderEnum(str, Enum):
    api = "api"
    oauth = "oauth"
    playwright = "playwright"


class AccountBase(BaseModel):
    channel_name: constr(min_length=1, strip_whitespace=True)
    source_type: SourceTypeEnum = SourceTypeEnum.m1
    region: str = "Indonesia"
    
    import_folder: Optional[str] = None
    browser_profile: Optional[str] = None
    metadata_profile: Optional[str] = None
    upload_preset: Optional[str] = None
    playlist: Optional[str] = None
    category: str = "20"
    audience: str = "not_kids"
    license: str = "standard"
    language: str = "en"
    ai_preset: str = "gaming_v1"
    upload_provider: UploadProviderEnum = UploadProviderEnum.api
    
    upload_defaults: str = "{}"
    advanced_settings: str = "{}"
    ai_identity: str = "{}"
    schedule_profile: str = "{}"
    
class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    channel_name: Optional[constr(min_length=1, strip_whitespace=True)] = None
    avatar_url: Optional[str] = None
    source_type: Optional[SourceTypeEnum] = None
    region: Optional[str] = None
    profile_id: Optional[str] = None
    watch_folder: Optional[str] = None
    watch_folder_enabled: Optional[bool] = None
    publish_enabled: Optional[bool] = None
    preferred_publish_time: Optional[str] = None
    publish_timezone: Optional[str] = None
    publish_variance: Optional[int] = None
    publish_mode: Optional[str] = None
    publish_days: Optional[str] = None
    publish_visibility: Optional[str] = None
    review_before_publish: Optional[bool] = None
    
    import_folder: Optional[str] = None
    browser_profile: Optional[str] = None
    metadata_profile: Optional[str] = None
    upload_preset: Optional[str] = None
    playlist: Optional[str] = None
    category: Optional[str] = None
    audience: Optional[str] = None
    license: Optional[str] = None
    language: Optional[str] = None
    ai_preset: Optional[str] = None
    
    upload_defaults: Optional[str] = None
    advanced_settings: Optional[str] = None
    ai_identity: Optional[str] = None
    schedule_profile: Optional[str] = None
    
    pipelines: Optional[str] = None
    pipeline_states: Optional[str] = None

class ConfirmChannelRequest(BaseModel):
    channel_id: str
    channel_name: str
    avatar_url: Optional[str] = None

class AccountListResponse(BaseModel):
    id: str
    channel_name: str
    channel_id: Optional[str] = None
    subscribers: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_name: Optional[str] = None
    source_type: str
    region: str
    authentication_status: str

    # Dashboard Extended Fields
    status: Optional[str] = "healthy"
    attention: Optional[str] = "✓ Normal"
    queue: Optional[int] = 0
    completed: Optional[int] = 0
    lastUploadText: Optional[str] = "Never"
    views: Optional[str] = "0"
    videos: Optional[str] = "0"
    monetized: Optional[bool] = False
    handle: Optional[str] = ""
    coverage: Optional[str] = "0 Days"
    notification: Optional[str] = ""
    mode: Optional[str] = "Campaign"

    class Config:
        from_attributes = True

class AccountDetailResponse(BaseModel):
    id: str
    channel_name: str
    channel_id: Optional[str] = None
    subscribers: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_id: Optional[str] = None
    profile_name: Optional[str] = None
    source_type: str
    region: str
    watch_folder: Optional[str] = None
    watch_folder_enabled: bool
    authentication_status: str
    publish_enabled: bool
    preferred_publish_time: Optional[str] = None
    publish_timezone: str
    publish_variance: int
    publish_mode: str
    publish_days: str
    publish_visibility: str
    review_before_publish: bool
    
    import_folder: Optional[str] = None
    browser_profile: Optional[str] = None
    metadata_profile: Optional[str] = None
    upload_preset: Optional[str] = None
    playlist: Optional[str] = None
    category: str
    audience: str
    license: str
    language: str
    ai_preset: str
    
    upload_defaults: str
    advanced_settings: str
    ai_identity: str
    schedule_profile: str
    
    pipelines: str
    pipeline_states: str
    
    schema_version: int
    created_at: datetime

    class Config:
        from_attributes = True

class QueueStatusEnum(str, Enum):
    watched = "WATCHED"
    review = "REVIEW"
    queued = "QUEUED"
    uploading = "UPLOADING"
    scheduled = "SCHEDULED"
    completed = "COMPLETED"
    failed = "FAILED"
    cancelled = "CANCELLED"

class UploadStageEnum(str, Enum):
    none = "NONE"
    uploading_video = "UPLOADING_VIDEO"
    uploading_thumbnail = "UPLOADING_THUMBNAIL"
    updating_metadata = "UPDATING_METADATA"
    updating_playlist = "UPDATING_PLAYLIST"
    setting_schedule = "SETTING_SCHEDULE"
    waiting_youtube = "WAITING_YOUTUBE"
    finished = "FINISHED"
    failed = "FAILED"

class MetadataSourceEnum(str, Enum):
    profile = "PROFILE"
    gemini = "GEMINI"
    renderer = "RENDERER"
    manual = "MANUAL"
    campaign = "CAMPAIGN"

class UploadTaskBase(BaseModel):
    account_id: str
    profile_id: Optional[str] = None
    status: QueueStatusEnum = QueueStatusEnum.watched
    upload_stage: UploadStageEnum = UploadStageEnum.none
    metadata_source: MetadataSourceEnum = MetadataSourceEnum.manual
    source_type: SourceTypeEnum = SourceTypeEnum.manual
    
    source_id: Optional[str] = None
    execution_source: Optional[str] = None
    correlation_id: Optional[str] = None
    execution_no: Optional[int] = None
    
    package_folder: str
    video_path: str
    thumbnail_path: Optional[str] = None
    metadata_path: Optional[str] = None
    timestamps_path: Optional[str] = None
    
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    privacy_status: str = "private"
    made_for_kids: bool = False
    video_id: Optional[str] = None  # From metadata.json — primary duplicate detection key
    
    playlist_id: Optional[str] = None
    playlist_title: Optional[str] = None
    category_id: Optional[int] = None
    ai_use: str = "UNKNOWN"
    default_language: Optional[str] = None
    audio_language: Optional[str] = None
    recording_date: Optional[datetime] = None
    license: Optional[str] = None
    audience: Optional[str] = None
    notify_subscribers: bool = True
    embeddable: bool = True
    public_stats_viewable: bool = True
    
    pipeline_type: Optional[str] = None
    schedule_mode: Optional[str] = None
    schedule_time: Optional[str] = None
    
    youtube_video_id: Optional[str] = None
    youtube_url: Optional[str] = None
    
    upload_mode: str = "Waiting For Approval"
    ai_metadata_generated: bool = False
    upload_progress: Optional[int] = 0

class UploadTaskCreate(UploadTaskBase):
    pass

class UploadTaskUpdate(BaseModel):
    status: Optional[QueueStatusEnum] = None
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    privacy_status: Optional[str] = None
    made_for_kids: Optional[bool] = None
    video_id: Optional[str] = None
    
    playlist_id: Optional[str] = None
    playlist_title: Optional[str] = None
    category_id: Optional[int] = None
    ai_use: Optional[str] = None
    default_language: Optional[str] = None
    audio_language: Optional[str] = None
    recording_date: Optional[datetime] = None
    license: Optional[str] = None
    audience: Optional[str] = None
    notify_subscribers: Optional[bool] = None
    embeddable: Optional[bool] = None
    public_stats_viewable: Optional[bool] = None
    
    youtube_video_id: Optional[str] = None
    youtube_url: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    upload_mode: Optional[str] = None
    ai_metadata_generated: Optional[bool] = None

class UploadTaskResponse(UploadTaskBase):
    id: str
    retry_count: int
    failure_reason: Optional[str] = None
    created_at: datetime
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


    status_label: Optional[str] = None
    status_color: Optional[str] = None

    @model_validator(mode='after')
    def compute_status_fields(self):
        if not self.status:
            return self

        colors = {
            "WATCHED": "text-white/40",
            "REVIEW": "text-yellow-400",
            "QUEUED": "text-amber-400",
            "UPLOADING": "text-cyan-400",
            "SCHEDULED": "text-purple-400",
            "COMPLETED": "text-green-400",
            "FAILED": "text-red-400",
            "CANCELLED": "text-white/20"
        }

        labels = {
            "WATCHED": "Watched",
            "REVIEW": "Needs Review",
            "QUEUED": "Queued",
            "UPLOADING": "Uploading",
            "SCHEDULED": "Scheduled",
            "COMPLETED": "Completed",
            "FAILED": "Failed",
            "CANCELLED": "Cancelled"
        }

        status_val = self.status.value if hasattr(self.status, 'value') else str(self.status)
        self.status_color = colors.get(status_val, "text-white/50")
        self.status_label = labels.get(status_val, status_val)
        return self

    class Config:
        from_attributes = True

class UploadLogBase(BaseModel):
    task_id: str
    status: QueueStatusEnum
    message: str

class UploadLogResponse(UploadLogBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class GlobalSettingsBase(BaseModel):
    general_language: str = "en"
    general_theme: str = "dark"
    general_launch: bool = True
    general_update: bool = True
    
    upload_concurrent: int = 3
    upload_retry: int = 5
    
    ai_provider: str = "gemini"
    ai_api_key: Optional[str] = None
    ai_base_url: Optional[str] = None
    ai_model: Optional[str] = None
    ai_temperature: str = "0.7"
    ai_max_tokens: int = 2048
    ai_system_prompt: Optional[str] = None
    ai_enabled: bool = True
    ai_timeout: Optional[int] = 30
    ai_retry: Optional[int] = 3
    
    notif_desktop: bool = True
    notif_sound: bool = True
    notif_success: bool = True
    notif_fail: bool = True
    
    perf_mode: str = "balanced"
    perf_workers: int = 4
    perf_threads: int = 8
    perf_gpu: bool = True
    perf_mem: int = 4096
    
    app_density: str = "comfortable"
    app_color: str = "cyan"
    app_anim: bool = True
    app_compact: bool = False
    
    adv_dev: bool = False
    adv_logs: bool = True

class GlobalSettingsUpdate(BaseModel):
    general_language: Optional[str] = None
    general_theme: Optional[str] = None
    general_launch: Optional[bool] = None
    general_update: Optional[bool] = None
    
    upload_concurrent: Optional[int] = None
    upload_retry: Optional[int] = None
    
    ai_provider: Optional[str] = None
    ai_api_key: Optional[str] = None
    ai_base_url: Optional[str] = None
    ai_model: Optional[str] = None
    ai_temperature: Optional[str] = None
    ai_max_tokens: Optional[int] = None
    ai_system_prompt: Optional[str] = None
    ai_enabled: Optional[bool] = None
    ai_timeout: Optional[int] = None
    ai_retry: Optional[int] = None
    
    notif_desktop: Optional[bool] = None
    notif_sound: Optional[bool] = None
    notif_success: Optional[bool] = None
    notif_fail: Optional[bool] = None
    
    perf_mode: Optional[str] = None
    perf_workers: Optional[int] = None
    perf_threads: Optional[int] = None
    perf_gpu: Optional[bool] = None
    perf_mem: Optional[int] = None
    
    app_density: Optional[str] = None
    app_color: Optional[str] = None
    app_anim: Optional[bool] = None
    app_compact: Optional[bool] = None
    
    adv_dev: Optional[bool] = None
    adv_logs: Optional[bool] = None

class GlobalSettingsResponse(GlobalSettingsBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

class CampaignAssetState(str, Enum):
    NEW = "NEW"
    SELECTED = "SELECTED"
    REVIEWED = "REVIEWED"
    APPROVED = "APPROVED"
    UPLOADING = "UPLOADING"
    SCHEDULED = "SCHEDULED"
    CONSUMED = "CONSUMED"
    ARCHIVED = "ARCHIVED"

class CampaignAssetCheckRequest(BaseModel):
    sha256: str
    filesize: int
    duration_seconds: float
    
class CampaignAssetBase(BaseModel):
    channel_id: Optional[str] = None
    campaign_id: Optional[str] = None
    filename: str
    filesize: int
    duration_seconds: float
    source_type: str = "LOCAL"
    asset_origin: str = "LOCAL_FOLDER"
    youtube_video_id: Optional[str] = None
    scheduled_publish_at: Optional[datetime] = None
    allow_reupload: bool = False
    created_by: Optional[str] = None

class CampaignAssetCreate(CampaignAssetBase):
    sha256: str
    
class CampaignAssetResponse(CampaignAssetBase):
    id: str
    fingerprint: str
    fingerprint_version: int
    sha256: str
    status: CampaignAssetState
    uploaded_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CampaignAssetLookupResponse(BaseModel):
    duplicate: bool
    fingerprint: str
    status: Optional[CampaignAssetState] = None
    asset: Optional[CampaignAssetResponse] = None

class CampaignScanRequest(BaseModel):
    channel_id: Optional[str] = None
    campaign_folder: str

class CampaignScanSummary(BaseModel):
    detected: int = 0
    available: int = 0
    duplicate: int = 0
    invalid: int = 0
    videos_to_upload: int = 0
    estimated_coverage: str = "0 days"

class CampaignScanAsset(BaseModel):
    filename: str
    filepath: str
    filesize: int
    duration_seconds: float
    fingerprint: str
    duplicate: bool
    status: str
    selectable: bool
    # Future compatibility
    campaign_id: Optional[str] = None
    asset_id: Optional[str] = None
    youtube_video_id: Optional[str] = None
    scheduled_publish_at: Optional[datetime] = None
    allow_reupload: Optional[bool] = None

class CampaignScanResponse(BaseModel):
    success: bool = True
    summary: CampaignScanSummary
    assets: List[CampaignScanAsset]

class CampaignReviewAssetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    visibility: Optional[str] = None
    thumbnail: Optional[str] = None
    playlist: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    audience: Optional[str] = None
    recording_date: Optional[datetime] = None

class CampaignReviewAssetResponse(BaseModel):
    id: str
    session_id: str
    fingerprint: str
    filepath: str
    filename: str
    filesize: int
    duration_seconds: float
    status: str
    selected: bool
    editable: bool
    
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    visibility: str
    thumbnail: Optional[str] = None
    playlist: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    audience: Optional[str] = None
    recording_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class CampaignReviewSessionResponse(BaseModel):
    id: str
    channel_id: str
    pipeline_type: str
    strategy: str
    status: str
    
    detected: int
    available: int
    selected: int
    duplicate: int
    invalid: int
    selected_file_size: float
    selected_duration: float
    
    assets: List[CampaignReviewAssetResponse] = []

    class Config:
        from_attributes = True

class CampaignReviewSelectRequest(BaseModel):
    channel_id: str
    pipeline_type: str
    asset_id: str
    selected: bool

class CampaignReviewApproveRequest(BaseModel):
    channel_id: str
    pipeline_type: str

class CampaignQueueBuildRequest(BaseModel):
    session_id: str
    channel_id: str
    pipeline_type: str

class CampaignUploadPlanResponse(BaseModel):
    id: str
    review_session_id: str
    campaign_asset_id: str
    channel_id: str
    pipeline_type: str
    publish_order: int
    publish_date: str
    publish_time: str
    publish_datetime: datetime
    humanized_datetime: datetime
    title: Optional[str]
    description: Optional[str]
    tags: Optional[str]
    thumbnail: Optional[str]
    playlist: Optional[str]
    category: Optional[str]
    visibility: str
    language: Optional[str]
    audience: Optional[str]
    recording_date: Optional[datetime]
    status: str
    
    execution_status: str
    execution_started_at: Optional[datetime] = None
    execution_finished_at: Optional[datetime] = None
    retry_count: int = 0
    last_error: Optional[str] = None
    youtube_video_id: Optional[str] = None
    youtube_publish_at: Optional[datetime] = None
    upload_task_id: Optional[str] = None

    class Config:
        from_attributes = True

class CampaignExecutionStartRequest(BaseModel):
    session_id: str
    channel_id: str
    pipeline_type: str

class CampaignExecutionRetryRequest(BaseModel):
    plan_id: str
    updated_at: datetime
