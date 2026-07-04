from sqlalchemy import Column, Integer, String
from database.base import Base


class UploadTask(Base):

    __tablename__ = "upload_tasks"

    id = Column(Integer, primary_key=True, index=True)

    video_id = Column(String, unique=True)

    title = Column(String)

    platform = Column(String)

    status = Column(String)
