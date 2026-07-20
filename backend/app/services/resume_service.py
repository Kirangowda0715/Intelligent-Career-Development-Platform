import os
import uuid
import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.db.models import Resume, Role, Skill, RoleSkill, SkillGap
from app.db.schemas import SkillGapResponse
from app.repositories.resume_repository import resume_repository
from app.services.parser_service import ParserService

class ResumeService:
    @staticmethod
    def save_resume(db: Session, file: UploadFile, user_id: uuid.UUID) -> Resume:
        """Uploads a PDF resume, extracts/parses text, and saves it to the database."""
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only PDF files are allowed."
            )
            
        # Create unique file name and path
        unique_id = uuid.uuid4()
        filename = f"{unique_id}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        try:
            # Read file bytes
            file_bytes = file.file.read()
            
            # Save file to disk
            with open(file_path, "wb") as f:
                f.write(file_bytes)
                
            # Extract raw text from PDF
            raw_text = ParserService.extract_text_from_pdf(file_bytes)
            
            # Parse text into structured sections (deterministic spaCy matching)
            parsed_data = ParserService.parse_resume(raw_text)
            
            # Save Resume model
            resume_in = {
                "id": unique_id,
                "user_id": user_id,
                "filename": file.filename,
                "file_path": file_path,
                "raw_text": raw_text,
                "parsed_data": parsed_data
            }
            
            return resume_repository.create(db, obj_in=resume_in)
            
        except Exception as e:
            # Cleanup saved file on database error
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred while processing the resume: {str(e)}"
            )

    @staticmethod
    def get_resume(db: Session, resume_id: Any, user_id: Any) -> Optional[Resume]:
        if isinstance(resume_id, str):
            resume_id = uuid.UUID(resume_id)
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)
            
        resume = resume_repository.get(db, id=resume_id)
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found."
            )
        if resume.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this resume."
            )
        return resume

    @staticmethod
    def list_resumes(db: Session, user_id: uuid.UUID) -> List[Resume]:
        return resume_repository.get_by_user_id(db, user_id=user_id)

    @staticmethod
    def calculate_completeness(parsed_data: Dict[str, Any]) -> float:
        """
        Calculates resume completeness deterministically:
        - Name present: 15%
        - Skills non-empty: 25%
        - Education non-empty: 20%
        - Certifications non-empty: 15%
        - Projects non-empty: 25%
        Total: 100%
        """
        score = 0.0
        if parsed_data.get("name") and parsed_data.get("name") != "Unknown candidate":
            score += 15.0
        if parsed_data.get("skills"):
            score += 25.0
        if parsed_data.get("education"):
            score += 20.0
        if parsed_data.get("certifications"):
            score += 15.0
        if parsed_data.get("projects"):
            score += 25.0
        return score

    @staticmethod
    def get_role_skills_from_db(db: Session, target_role_name: str) -> List[str]:
        """Fetches standard required skills for a target role from DB, or falls back to seed JSON."""
        # Query role
        role = db.query(Role).filter(Role.name == target_role_name).first()
        if role:
            return [rs.skill.name for rs in role.role_skills if rs.skill]
            
        # Fallback to local file seed if database query is empty
        seed_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "seeds", "role_skills_seed.json")
        if os.path.exists(seed_path):
            with open(seed_path, "r") as f:
                data = json.load(f)
                return data.get(target_role_name, [])
        return []

    @staticmethod
    def get_all_roles_with_skills(db: Session) -> Dict[str, List[str]]:
        """Returns all roles and their skills for recommendation checks."""
        roles = db.query(Role).all()
        if roles:
            result = {}
            for r in roles:
                result[r.name] = [rs.skill.name for rs in r.role_skills if rs.skill]
            return result
            
        # Fallback to seed JSON
        seed_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "seeds", "role_skills_seed.json")
        if os.path.exists(seed_path):
            with open(seed_path, "r") as f:
                return json.load(f)
        return {}

    @staticmethod
    def analyze_skill_gap(db: Session, resume_id: uuid.UUID, target_role: str, user_id: uuid.UUID) -> SkillGapResponse:
        """Deterministic skill gap calculation and role recommendations."""
        resume = ResumeService.get_resume(db, resume_id=resume_id, user_id=user_id)
        parsed_data = resume.parsed_data or {"name": "", "skills": [], "education": [], "certifications": [], "projects": []}
        
        user_skills = parsed_data.get("skills", [])
        
        # 1. Fetch required skills for selected target role
        required_skills = ResumeService.get_role_skills_from_db(db, target_role)
        if not required_skills:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Target role '{target_role}' is not in the knowledge base."
            )
            
        # 2. Match skills (case-insensitive checks)
        user_skills_lower = [s.lower() for s in user_skills]
        matching_skills = [s for s in required_skills if s.lower() in user_skills_lower]
        missing_skills = [s for s in required_skills if s.lower() not in user_skills_lower]
        
        # 3. Calculate Scores
        match_score = (len(matching_skills) / len(required_skills) * 100) if required_skills else 0.0
        completeness_score = ResumeService.calculate_completeness(parsed_data)
        profile_strength = (completeness_score * 0.4) + (match_score * 0.6)
        
        # 4. Deterministic Recommendation Check (Test match score against all 10 roles)
        all_roles_skills = ResumeService.get_all_roles_with_skills(db)
        recommended_role = target_role
        highest_score = match_score
        
        for role_name, role_skills in all_roles_skills.items():
            if not role_skills:
                continue
            role_matching = [s for s in role_skills if s.lower() in user_skills_lower]
            role_score = (len(role_matching) / len(role_skills) * 100)
            if role_score > highest_score:
                highest_score = role_score
                recommended_role = role_name
                
        # 5. Persist Gap Analysis to DB for records
        role_obj = db.query(Role).filter(Role.name == target_role).first()
        if role_obj:
            # Delete any existing gap analysis for this resume + target role to avoid duplicates
            db.query(SkillGap).filter(
                SkillGap.user_id == user_id, 
                SkillGap.target_role_id == role_obj.id
            ).delete()
            
            gap_record = SkillGap(
                user_id=user_id,
                target_role_id=role_obj.id,
                match_score=match_score,
                missing_skills=missing_skills,
                completeness_score=completeness_score,
                profile_strength=profile_strength
            )
            db.add(gap_record)
            db.commit()
            
        return SkillGapResponse(
            target_role=target_role,
            match_score=round(match_score, 1),
            completeness_score=round(completeness_score, 1),
            profile_strength=round(profile_strength, 1),
            missing_skills=missing_skills,
            user_skills=user_skills,
            required_skills=required_skills,
            recommended_role=recommended_role
        )
