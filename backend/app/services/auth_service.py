import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.db.models import User
from app.repositories.user_repository import user_repository
from app.core.database import get_db

# JWT OAuth2 password scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class AuthService:
    @staticmethod
    def register_user(db: Session, email: str, password: str) -> User:
        # Check if email is already registered
        existing_user = user_repository.get_by_email(db, email=email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )
        
        hashed_password = get_password_hash(password)
        user_in = {
            "email": email,
            "hashed_password": hashed_password,
            "is_active": True
        }
        return user_repository.create(db, obj_in=user_in)

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> str:
        user = user_repository.get_by_email(db, email=email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Returns signed JWT access token
        return create_access_token(subject=str(user.id))

    @staticmethod
    def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
        except InvalidTokenError:
            raise credentials_exception
            
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise credentials_exception

        user = user_repository.get(db, id=user_uuid)
        if user is None:
            raise credentials_exception
        return user
