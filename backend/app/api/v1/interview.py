import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.db.schemas import InterviewRequest, InterviewResponse
from app.services.auth_service import AuthService
from app.services.ai_service import AIService
from app.db.models import User, InterviewQuestion

router = APIRouter()

@router.post("/generate", response_model=InterviewResponse)
async def generate_interview_questions(
    payload: InterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Generates mock interview questions using AI/fallback for missing skills."""
    return await AIService.generate_interview_questions(
        db,
        resume_id=str(payload.resume_id),
        target_role=payload.target_role,
        user_id=str(current_user.id)
    )

@router.get("/", response_model=List[InterviewResponse])
def list_interview_questions(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Lists all generated interview prep sessions for the user."""
    return db.query(InterviewQuestion).filter(InterviewQuestion.user_id == current_user.id).order_by(InterviewQuestion.created_at.desc()).all()

@router.get("/{id}", response_model=InterviewResponse)
def get_interview_question(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Retrieves a specific mock interview session."""
    questions = db.query(InterviewQuestion).filter(InterviewQuestion.id == id, InterviewQuestion.user_id == current_user.id).first()
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview prep session not found"
        )
    return questions
