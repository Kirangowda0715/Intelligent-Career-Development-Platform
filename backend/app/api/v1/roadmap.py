import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.db.schemas import RoadmapRequest, RoadmapResponse
from app.services.auth_service import AuthService
from app.services.ai_service import AIService
from app.db.models import User, Roadmap

router = APIRouter()

@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap(
    payload: RoadmapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Generates a learning roadmap using AI/fallback for missing skills."""
    return await AIService.generate_roadmap(
        db,
        resume_id=str(payload.resume_id),
        target_role=payload.target_role,
        user_id=str(current_user.id)
    )

@router.get("/", response_model=List[RoadmapResponse])
def list_roadmaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Lists all generated roadmaps for the user."""
    return db.query(Roadmap).filter(Roadmap.user_id == current_user.id).order_by(Roadmap.created_at.desc()).all()

@router.get("/{id}", response_model=RoadmapResponse)
def get_roadmap(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Retrieves a specific generated roadmap."""
    roadmap = db.query(Roadmap).filter(Roadmap.id == id, Roadmap.user_id == current_user.id).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )
    return roadmap
