from .exceptions import DuplicateProjectException
from sqlalchemy.orm import Session
from sqlalchemy import text

class ProjectValidator:
    """
    Tanggung jawab:
    Memastikan project_id belum pernah digunakan oleh channel lain.
    """
    
    @staticmethod
    def validate_unique(db: Session, project_id: str, exclude_channel_id: str = None) -> None:
        """
        Validates if the project_id is unique across all channels.
        Raises DuplicateProjectException if a duplicate is found.
        """
        # Using raw SQL to avoid dependency on model changes until Phase 3 is completed.
        # It assumes 'project_id' column will exist in the channels/channels table.
        
        query = "SELECT id FROM channels WHERE project_id = :project_id"
        params = {"project_id": project_id}
        
        if exclude_channel_id:
            query += " AND id != :exclude_id"
            params["exclude_id"] = exclude_channel_id
            
        result = db.execute(text(query), params).fetchone()
        
        if result:
            raise DuplicateProjectException(f"Project ID '{project_id}' is already used by another channel.")
