import os
import json
from sqlalchemy.orm import Session
from app.db.models import Role, Skill, RoleSkill

def seed_roles_and_skills(db: Session) -> None:
    """Seeds predefined target roles and their required skills from JSON into the database."""
    # Find seed file path relative to this file
    seed_dir = os.path.dirname(os.path.abspath(__file__))
    seed_path = os.path.join(seed_dir, "role_skills_seed.json")
    
    if not os.path.exists(seed_path):
        print(f"Seed file not found at: {seed_path}")
        return

    try:
        with open(seed_path, "r") as f:
            role_data = json.load(f)
            
        for role_name, skill_names in role_data.items():
            # 1. Create or get Role
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=f"Standard skills and requirements profile for {role_name}.")
                db.add(role)
                db.flush()  # Populates role.id
                
            for skill_name in skill_names:
                # 2. Create or get Skill
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                if not skill:
                    skill = Skill(name=skill_name)
                    db.add(skill)
                    db.flush()  # Populates skill.id
                    
                # 3. Create or get RoleSkill mapping
                role_skill = db.query(RoleSkill).filter(
                    RoleSkill.role_id == role.id,
                    RoleSkill.skill_id == skill.id
                ).first()
                
                if not role_skill:
                    role_skill = RoleSkill(role_id=role.id, skill_id=skill.id, is_required=True)
                    db.add(role_skill)
                    
        db.commit()
        print("Database roles and skills successfully seeded.")
        
    except Exception as e:
        db.rollback()
        print(f"Failed to seed database: {str(e)}")
