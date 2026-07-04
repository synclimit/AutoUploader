from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.db import get_db
from services.history_service import HistoryService

router = APIRouter(prefix="/api/v1/history", tags=["History"])

@router.get("")
def get_history(db: Session = Depends(get_db)):
    return HistoryService.get_history(db)
