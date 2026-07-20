import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import Resume
from app.repositories.base_repository import BaseRepository

class ResumeRepository(BaseRepository[Resume]):
    def get_by_user_id(self, db: Session, user_id: uuid.UUID) -> List[Resume]:
        return db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).all()

    def get_latest_by_user_id(self, db: Session, user_id: uuid.UUID) -> Optional[Resume]:
        return db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).first()

resume_repository = ResumeRepository(Resume)
