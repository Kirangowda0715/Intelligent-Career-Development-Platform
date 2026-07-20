from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.db.schemas import UserCreate, UserResponse, Token
from app.services.auth_service import AuthService
from app.db.models import User

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user with email and hashed password."""
    return AuthService.register_user(db, email=user_in.email, password=user_in.password)

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticates user credentials and returns a JWT access token."""
    access_token = AuthService.authenticate_user(db, email=form_data.username, password=form_data.password)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(AuthService.get_current_user)):
    """Retrieves current user details based on active JWT session."""
    return current_user
