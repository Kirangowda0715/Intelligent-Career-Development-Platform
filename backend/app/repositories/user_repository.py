from sqlalchemy.orm import Session
from app.db.models import User
from app.repositories.base_repository import BaseRepository

class UserRepository(BaseRepository[User]):
    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

user_repository = UserRepository(User)
