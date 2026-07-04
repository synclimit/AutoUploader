from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Optional
from datetime import datetime

from models import UploadTask, UploadLog, GlobalSettings
from schemas import UploadTaskCreate, UploadTaskUpdate, QueueStatusEnum
from services.event_logger import EventLogger
from pydantic import BaseModel

class ScheduleRequest(BaseModel):
    scheduled_at: datetime

class GenerateMetadataRequest(BaseModel):
    keyword: str
    language: str = "Auto"
    seo_mode: str = "SEO Maximum"
    content_type: str = "General"
    target: str = "all" # all, title, description, tags, improve
    current_title: Optional[str] = None
    current_description: Optional[str] = None
    current_tags: Optional[str] = None

class SEOValidationRequest(BaseModel):
    mode: str
    keyword: Optional[str] = None
    provider: str = "vidiq"
    action: str = "open"  # 'open' or 'copy'

class UploadService:
    @staticmethod
    def get_all(
        db: Session, 
        status: List[str] = None,
        source_type: str = None,
        account_id: str = None,
        profile_id: str = None,
        keyword: str = None,
        date_from: datetime = None,
        date_to: datetime = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> List[UploadTask]:
        from sqlalchemy import or_
        query = db.query(UploadTask)
        
        if status:
            query = query.filter(UploadTask.status.in_(status))
        if source_type:
            query = query.filter(UploadTask.source_type == source_type)
        if account_id:
            query = query.filter(UploadTask.account_id == account_id)
        if profile_id:
            query = query.filter(UploadTask.profile_id == profile_id)
        if keyword:
            kw = f"%{keyword}%"
            query = query.filter(
                or_(
                    UploadTask.title.ilike(kw),
                    UploadTask.description.ilike(kw)
                )
            )
        if date_from:
            query = query.filter(UploadTask.created_at >= date_from)
        if date_to:
            query = query.filter(UploadTask.created_at <= date_to)
            
        sort_col = getattr(UploadTask, sort_by, UploadTask.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_col.asc())
        else:
            query = query.order_by(sort_col.desc())
            
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, task_id: str) -> UploadTask:
        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

    @staticmethod
    def get_task_logs(db: Session, task_id: str) -> List[UploadLog]:
        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        logs = db.query(UploadLog).filter(UploadLog.task_id == task_id).order_by(UploadLog.created_at.asc()).all()
        return logs

    @staticmethod
    def create(db: Session, data: UploadTaskCreate) -> UploadTask:
        from models import Account
        import json
        
        # Inheritance Engine
        account = db.query(Account).filter(Account.id == data.account_id).first()
        if account:
            try:
                defaults_json = json.loads(account.upload_defaults) if account.upload_defaults else {}
                advanced_json = json.loads(account.advanced_settings) if account.advanced_settings else {}
                
                pipeline = data.pipeline_type if data.pipeline_type else "long"
                
                p_defaults = defaults_json.get(pipeline, {}).get("basic_info", {})
                p_advanced = defaults_json.get(pipeline, {}).get("advanced", {})
                
                # Basic Info
                if data.title is None and p_defaults.get("title_template"): data.title = p_defaults.get("title_template")
                if data.description is None and p_defaults.get("description"): data.description = p_defaults.get("description")
                if data.playlist_id is None and p_defaults.get("playlist"): data.playlist_id = p_defaults.get("playlist") 
                if data.audience is None and p_defaults.get("audience"): data.audience = p_defaults.get("audience")
                if p_defaults.get("ai_generated") is not None: data.ai_use = "YES" if p_defaults.get("ai_generated") else "NO"
                if data.tags is None and p_defaults.get("tags"): data.tags = p_defaults.get("tags")
                if data.category_id is None and p_defaults.get("category"): data.category_id = int(p_defaults.get("category"))
                if data.default_language is None and p_defaults.get("language"): data.default_language = p_defaults.get("language")
                if data.privacy_status == "private" and p_defaults.get("visibility"): data.privacy_status = p_defaults.get("visibility")
                if data.license is None and p_defaults.get("license"): data.license = p_defaults.get("license")
                
                # Advanced Settings
                if p_advanced.get("notify_subscribers") is not None: data.notify_subscribers = p_advanced.get("notify_subscribers")
                if p_advanced.get("embeddable") is not None: data.embeddable = p_advanced.get("embeddable")
                if p_advanced.get("public_stats_viewable") is not None: data.public_stats_viewable = p_advanced.get("public_stats_viewable")
                
            except Exception as e:
                print(f"Inheritance Engine Error: {e}")
                
        task = UploadTask(**data.model_dump())
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def update(db: Session, task_id: str, data: UploadTaskUpdate) -> UploadTask:
        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
            
        db.commit()
        db.refresh(task)
        EventLogger.log_event(db, task.id, "REVIEW", "Metadata updated (Save Draft)")
        return task

    @staticmethod
    def delete(db: Session, task_id: str) -> None:
        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        db.delete(task)
        db.commit()

    @staticmethod
    def approve(db: Session, task_id: str) -> UploadTask:
        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        if task.status not in [QueueStatusEnum.review, QueueStatusEnum.watched, QueueStatusEnum.scheduled, QueueStatusEnum.failed]:
            raise HTTPException(status_code=400, detail="Only WATCHED, REVIEW, SCHEDULED, or FAILED tasks can be approved/retried")
            
        # If it was scheduled, this is a manual override
        if task.status == QueueStatusEnum.scheduled:
            task.scheduled_at = None
            EventLogger.log_event(db, task.id, "QUEUED", "Operator manually approved scheduled upload. Task bypassed scheduler.")
            task.status = QueueStatusEnum.queued
        else:
            if task.schedule_mode == "application":
                task.status = QueueStatusEnum.scheduled
                EventLogger.log_event(db, task.id, "SCHEDULED", "Task approved. Waiting for scheduler to assign and wait for time.")
            else:
                task.status = QueueStatusEnum.queued
                EventLogger.log_event(db, task.id, "QUEUED", "Task approved and moved to Queue")

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def cancel(db: Session, task_id: str) -> UploadTask:
        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        cancellable = {QueueStatusEnum.watched, QueueStatusEnum.review, QueueStatusEnum.queued, QueueStatusEnum.scheduled}
        if task.status not in cancellable:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel a task with status {task.status.value if hasattr(task.status, 'value') else task.status}. Only WATCHED, REVIEW, QUEUED, and SCHEDULED tasks can be cancelled."
            )

        task.status = QueueStatusEnum.cancelled
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def retry(db: Session, task_id: str) -> UploadTask:
        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        if task.status != QueueStatusEnum.failed:
            raise HTTPException(status_code=400, detail="Only FAILED tasks can be retried")
            
        new_task_data = {c.name: getattr(task, c.name) for c in task.__table__.columns if c.name not in ['id', 'created_at', 'updated_at', 'started_at', 'completed_at', 'scheduled_at', 'failure_reason']}
        new_task_data['retry_count'] = task.retry_count + 1
        new_task_data['status'] = QueueStatusEnum.queued
        
        new_task = UploadTask(**new_task_data)
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        
        EventLogger.log_event(db, new_task.id, "RETRY_CREATED", f"Retry initiated from failed task {task_id}")
        EventLogger.log_event(db, new_task.id, "QUEUE", "Added")
        
        return new_task

    @staticmethod
    def schedule(db: Session, task_id: str, body: ScheduleRequest) -> UploadTask:
        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if task.status != QueueStatusEnum.review:
            raise HTTPException(
                status_code=400,
                detail="Only PENDING_REVIEW tasks can be scheduled"
            )

        if body.scheduled_at <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="scheduled_at must be a future datetime")

        task.status = QueueStatusEnum.scheduled
        task.scheduled_at = body.scheduled_at
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    async def generate_metadata(db: Session, task_id: str, request: GenerateMetadataRequest) -> dict:
        from services.ai_engine.manager import AIEngineManager
        from models import AIGenerationHistory
        import json
        import time

        start_time = time.time()

        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        from models import Account
        from prompts.manager import PromptManager
        
        prompt_meta = PromptManager.get_prompt(request.content_type)
        prompt_name = prompt_meta.get("name", "Unknown Prompt")
        prompt_version = prompt_meta.get("version", "v1.0")
        
        prompt = prompt_meta["template"].replace("{keyword}", request.keyword)\
                                        .replace("{language}", request.language)\
                                        .replace("{seo_mode}", request.seo_mode)
                                        
        account = db.query(Account).filter(Account.id == task.account_id).first()
        if account and account.ai_identity:
            try:
                ai_identity = json.loads(account.ai_identity)
                if ai_identity and isinstance(ai_identity, dict) and len(ai_identity.keys()) > 0:
                    prompt = f"CHANNEL AI IDENTITY CONTEXT:\nThe following is the identity, personality, and demographic of the channel this content is generated for. You MUST adhere to these constraints to ensure channel consistency.\n{json.dumps(ai_identity, indent=2)}\n\n---\n\n" + prompt
            except:
                pass

        if getattr(request, "is_evaluation_mode", False):
            prompt += "\n\nEVALUATION OVERRIDE: Ignore any previous JSON schema requirements. Return ONLY a JSON object with strictly these keys (and no alternatives, no confidence, no analysis): 'title' (string), 'description' (string), 'tags' (array of strings)."

        async def _call_ai_and_parse(p_prompt):
            res = await AIEngineManager.generate(db=db, task="metadata generation", prompt=p_prompt)
            content = res.get("content", "").strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            return json.loads(content), res

        try:
            parsed, raw_res = await _call_ai_and_parse(prompt)
            if not isinstance(parsed, dict):
                raise ValueError(f"Expected dict, got {type(parsed).__name__}")
        except (json.JSONDecodeError, ValueError) as e:
            # 1-Time Repair
            repair_prompt = f"The previous output was invalid. Fix the error and return ONLY a valid JSON object (dict). Do not return a list.\nError: {str(e)}\nOriginal prompt: {prompt}"
            try:
                parsed, raw_res = await _call_ai_and_parse(repair_prompt)
                if not isinstance(parsed, dict):
                    raise ValueError("Still not a dict")
            except Exception as e2:
                return {"success": False, "message": "AI failed to return valid JSON object after repair."}
        except Exception as e:
            return {"success": False, "message": f"Failed to generate metadata: {str(e)}"}

        # Determine version
        latest_history = db.query(AIGenerationHistory).filter(
            AIGenerationHistory.task_id == task_id
        ).order_by(AIGenerationHistory.version.desc()).first()
        new_version = (latest_history.version + 1) if latest_history else 1

        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)

        # We do not override single-string fields if returning alternatives.
        # But for backward compatibility if the UI needs it, we leave them NULL or original.
        hist_title = request.current_title or task.title
        hist_desc = request.current_description or task.description
        hist_tags = request.current_tags or task.tags
        
        raw_json_str = json.dumps(parsed)


        settings = db.query(GlobalSettings).first()
        ai_provider = settings.ai_provider if settings else "gemini"
        model_name = settings.ai_model if settings else "gemini-1.5-pro-latest"
        ai_base_url = settings.ai_base_url if settings else None

        if not getattr(request, "is_evaluation_mode", False):
            new_history = AIGenerationHistory(
                task_id=task.id,
                version=new_version,
                provider=ai_provider,
                model=model_name,
                keyword=request.keyword,
                title=hist_title,
                description=hist_desc,
                tags=hist_tags,
                prompt_version=prompt_version,
                prompt_name=prompt_name,
                response_time_ms=response_time_ms,
                raw_response_json=raw_json_str
            )
            db.add(new_history)
            db.commit()
            db.refresh(new_history)
        
        parsed["_provider"] = ai_provider
        parsed["_model"] = model_name
        parsed["_timeMs"] = response_time_ms

        return {
            "success": True,
            "data": parsed,
            "history_version": new_version,
            "provider": ai_provider,
            "base_url": ai_base_url,
            "model": model_name,
            "response_time_ms": response_time_ms,
            "prompt_name": prompt_name
        }

    @staticmethod
    def validate_seo(db: Session, task_id: str, request: SEOValidationRequest) -> dict:
        from services.seo.manager import SEOManager
        from datetime import datetime

        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        try:
            if request.action == "copy":
                return SEOManager.copy_url(
                    mode=request.mode, 
                    keyword=request.keyword, 
                    video_id=task.youtube_video_id
                )
            else:
                result = SEOManager.validate(
                    mode=request.mode, 
                    keyword=request.keyword, 
                    video_id=task.youtube_video_id, 
                    provider_name=request.provider
                )
                
                # Update validation history
                task.last_seo_validation_at = datetime.utcnow()
                task.last_seo_provider = request.provider
                db.commit()
                
                return result
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"SEO Validation failed: {str(e)}")
