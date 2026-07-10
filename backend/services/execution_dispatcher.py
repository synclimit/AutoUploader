import logging
from sqlalchemy.orm import Session
from schemas import UploadTaskCreate
from models import UploadTask
from services.upload_service import UploadService
from services.events import get_event_bus

logger = logging.getLogger("execution_dispatcher")

class ExecutionDispatcher:
    """
    Universal gateway for ALL UploadTask creation.
    Abstracts UploadService creation behind a formal interface.
    """
    @staticmethod
    def dispatch(db: Session, task_data: UploadTaskCreate) -> UploadTask:
        try:
            logger.info(f"[DISPATCHER] Preparing dispatch for source {task_data.source_id}")
            
            # Use the existing upload service to persist the task
            task = UploadService.create(db, task_data)
            
            # Publish event
            get_event_bus().publish("campaign.task.created", {
                "task_id": task.id,
                "source_id": task.source_id,
                "correlation_id": task.correlation_id,
                "execution_no": task.execution_no
            })
            
            logger.info(f"[DISPATCHER] Dispatched UploadTask {task.id} (Correlation: {task.correlation_id})")
            return task
        except Exception as e:
            logger.error(f"[DISPATCHER] Error dispatching task: {e}")
            raise
    
    @staticmethod
    def cancel(db: Session, task_id: str):
        # Currently no explicit cancel method on UploadService for queued tasks,
        # but abstracting it for future queues
        logger.info(f"[DISPATCHER] Cancelling task {task_id}")
        get_event_bus().publish("campaign.task.cancelled", {"task_id": task_id})
