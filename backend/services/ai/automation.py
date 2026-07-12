import time
import logging
import threading
import json
import asyncio
from datetime import datetime

from database.db import SessionLocal
from models import UploadTask, Channel, UploadLog
from schemas import QueueStatusEnum
from core.engine_base import EngineBase

from services.ai.context_builder import ContextBuilder
from services.ai_engine.manager import AIEngineManager

logger = logging.getLogger("ai_automation")

POLL_INTERVAL_SECONDS = 15

class AIAutomationEngine(EngineBase):
    def __init__(self):
        self._thread = None
        self._running = False
        self._loop = None
        logger.info("[AI_AUTOMATION] Initialized")

    def start(self):
        if self._thread and self._thread.is_alive():
            logger.warning("[AI_AUTOMATION] Already running")
            return

        self._running = True
        self._thread = threading.Thread(
            target=self._run_loop,
            name="AIAutomationEngine",
            daemon=True,
        )
        self._thread.start()
        logger.info(f"[AI_AUTOMATION] Started — polling interval: {POLL_INTERVAL_SECONDS}s")

    def stop(self):
        logger.info("[AI_AUTOMATION] Stop signal received")
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=10)

    def restart(self):
        self.stop()
        self.start()

    def status(self) -> dict:
        return {"status": "running" if self._running else "stopped"}

    def health(self) -> dict:
        return {
            "status": "running" if self._running else "stopped",
            "polling_interval_seconds": POLL_INTERVAL_SECONDS
        }

    def _run_loop(self):
        logger.info("[AI_AUTOMATION] Background thread started")
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        
        while self._running:
            self._process_tasks()
            
            for _ in range(POLL_INTERVAL_SECONDS * 2):
                if not self._running:
                    break
                time.sleep(0.5)
                
        self._loop.close()
        logger.info("[AI_AUTOMATION] Background thread stopped")

    def _process_tasks(self):
        db = SessionLocal()
        try:
            # Find WATCHED tasks that need AI generation but haven't generated yet
            tasks = (
                db.query(UploadTask)
                .filter(UploadTask.status == QueueStatusEnum.watched)
                .filter(UploadTask.ai_metadata_generated == False)
                .all()
            )
            
            for task in tasks:
                if not self._running:
                    break
                    
                channel = db.query(Channel).filter(Channel.id == task.channel_id).first()
                if not channel:
                    continue
                    
                logger.info(f"[AI_AUTOMATION] Processing AI Metadata for Task {task.id}")
                
                # Context Builder
                context = ContextBuilder.build(task, channel)
                prompt_text = context.get_prompt()
                
                try:
                    # Run AI Generation
                    ai_response = self._loop.run_until_complete(
                        AIEngineManager.generate(
                            db=db,
                            task="metadata",
                            prompt=prompt_text,
                            context=None
                        )
                    )
                    
                    if ai_response and "content" in ai_response:
                        response_data = ai_response.get("content", "")
                        if isinstance(response_data, str):
                            import re
                            match = re.search(r'\{.*\}', response_data, re.DOTALL)
                            if match:
                                response_data = match.group(0)
                            else:
                                response_data = response_data.strip()
                            
                            try:
                                response_data = json.loads(response_data)
                            except:
                                pass
                                
                        if isinstance(response_data, dict):
                            # Helper to find keys case-insensitively or with common prefixes
                            def get_val(keys):
                                for k in keys:
                                    for d_key in response_data.keys():
                                        if d_key.lower() == k.lower() or d_key.lower() == f"seo {k}".lower():
                                            return response_data[d_key]
                                return None

                            title_val = get_val(["title"])
                            if title_val: task.title = title_val
                            
                            desc_val = get_val(["description", "desc"])
                            if desc_val: task.description = desc_val
                            
                            tags_list = get_val(["tags", "tag"])
                            if isinstance(tags_list, list):
                                task.tags = ",".join(tags_list)
                            elif isinstance(tags_list, str):
                                task.tags = tags_list
                                
                            task.ai_use = "GENERATED"
                            msg = "AI Metadata generated successfully."
                            logger.info(f"[AI_AUTOMATION] {msg}")
                        else:
                            msg = "AI Metadata parsing failed. Used raw response."
                            logger.warning(f"[AI_AUTOMATION] {msg}")
                    else:
                        msg = f"AI Metadata generation failed: No content returned."
                        logger.error(f"[AI_AUTOMATION] {msg}")
                        
                except Exception as e:
                    import traceback
                    msg = f"AI Metadata generation error: {str(e)}"
                    logger.error(f"[AI_AUTOMATION] {msg}\n{traceback.format_exc()}")
                
                # Set flag to True regardless of success to avoid infinite loop
                task.ai_metadata_generated = True
                
                # We always leave it in WATCHED state.
                # The upload_scheduler Engine is responsible for picking up (WATCHED + Auto Upload + ai_metadata_generated=True) 
                # and transitioning them to SCHEDULED (and applying the humanize delay).
                msg += " AI generation finished, task ready for Scheduler or Manual Approval."
                    
                status_val = task.status.value if hasattr(task.status, 'value') else task.status
                db.add(UploadLog(task_id=task.id, status=status_val, message=msg))
                db.commit()
                
        except Exception as e:
            logger.error(f"[AI_AUTOMATION] Fatal error in cycle: {e}")
            db.rollback()
        finally:
            db.close()

_ai_automation_instance = None

def get_ai_automation_engine() -> AIAutomationEngine:
    global _ai_automation_instance
    if _ai_automation_instance is None:
        _ai_automation_instance = AIAutomationEngine()
    return _ai_automation_instance
