import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.db.schemas import ResumeResponse, SkillGapRequest, SkillGapResponse
from app.services.auth_service import AuthService
from app.services.resume_service import ResumeService
from app.db.models import User

router = APIRouter()

@router.post("/upload", response_model=ResumeResponse)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Uploads a PDF resume, parses its sections, and persists details in the database."""
    return ResumeService.save_resume(db, file=file, user_id=current_user.id)

@router.get("/", response_model=List[ResumeResponse])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Lists all resumes uploaded by the current user."""
    return ResumeService.list_resumes(db, user_id=current_user.id)

@router.get("/{id}", response_model=ResumeResponse)
def get_resume_details(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Retrieves standard parsed info of a specific resume."""
    return ResumeService.get_resume(db, resume_id=id, user_id=current_user.id)

@router.post("/{id}/analyze", response_model=SkillGapResponse)
def analyze_resume_gap(
    id: uuid.UUID,
    payload: SkillGapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Runs a deterministic skill gap analysis and recommendations check against the target role."""
    return ResumeService.analyze_skill_gap(
        db, 
        resume_id=id, 
        target_role=payload.target_role, 
        user_id=current_user.id
    )
