import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict

# --- Auth Schemas ---

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# --- Resume Schemas ---

class ResumeParsedData(BaseModel):
    name: str
    skills: List[str]
    education: List[str]
    certifications: List[str]
    projects: List[str]

class ResumeResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    file_path: str
    parsed_data: Optional[ResumeParsedData] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Analysis Schemas ---

class SkillGapRequest(BaseModel):
    target_role: str

class SkillGapResponse(BaseModel):
    target_role: str
    match_score: float
    completeness_score: float
    profile_strength: float
    missing_skills: List[str]
    user_skills: List[str]
    required_skills: List[str]
    recommended_role: str

    model_config = ConfigDict(from_attributes=True)

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    skills: List[str]

    model_config = ConfigDict(from_attributes=True)

# --- Roadmap Schemas ---

class RoadmapRequest(BaseModel):
    resume_id: uuid.UUID
    target_role: str

class RoadmapResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    target_role: str
    content: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Interview Prep Schemas ---

class InterviewRequest(BaseModel):
    resume_id: uuid.UUID
    target_role: str

class InterviewResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    target_role: str
    questions: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
