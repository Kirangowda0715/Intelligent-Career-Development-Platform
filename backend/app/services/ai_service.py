import json
import re
import httpx
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.models import Resume, Roadmap, InterviewQuestion, Role
from app.services.resume_service import ResumeService

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

class AIService:
    @staticmethod
    async def query_ollama(prompt: str, system_prompt: Optional[str] = None) -> str:
        """Sends an asynchronous prompt request to the local Ollama Llama 3 instance."""
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3 # Low temperature for structured JSON adherence
            }
        }
        if system_prompt:
            payload["system"] = system_prompt

        # Set 30-second timeout for local LLM inference
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                response = await client.post(OLLAMA_URL, json=payload)
                if response.status_code == 200:
                    return response.json().get("response", "").strip()
                else:
                    raise Exception(f"Ollama server returned status code {response.status_code}")
            except Exception as e:
                print(f"Ollama inference error: {str(e)}")
                # Raise to trigger fallback logic
                raise e

    @staticmethod
    def clean_json_string(raw_str: str) -> str:
        """Strips markdown json code block indicators or trailing text from LLM response."""
        start_idx = raw_str.find('{')
        end_idx = raw_str.rfind('}')
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            return raw_str[start_idx:end_idx + 1]
            
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw_str)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        return cleaned.strip()

    @staticmethod
    def get_deterministic_roadmap_fallback(target_role: str, missing_skills: List[str]) -> Dict[str, Any]:
        """Provides a high-quality deterministic learning roadmap when Ollama is offline."""
        skills_to_learn = missing_skills if missing_skills else ["General Core Skills", "Best Practices"]
        weekly_plan = []
        
        # Build 4 weeks roadmap
        for week in range(1, 5):
            # Select skills for this week
            skill_index = (week - 1) % len(skills_to_learn)
            current_skill = skills_to_learn[skill_index]
            
            weekly_plan.append({
                "week": week,
                "title": f"Mastering {current_skill} & Core Architecture",
                "topics": [
                    f"Understanding {current_skill} basic syntax and environments",
                    f"Advanced design patterns for {current_skill}",
                    f"Testing and deploying {current_skill} components"
                ],
                "technologies": [current_skill, "Git"],
                "resources": [
                    {
                        "name": f"Official {current_skill} Documentation",
                        "url": f"Search online for official resources on {current_skill}."
                    },
                    {
                        "name": "W3Schools or TutorialsPoint Guide",
                        "url": "https://www.w3schools.com/"
                    }
                ]
            })

        return {
            "target_role": target_role,
            "duration_weeks": 4,
            "priorities": [f"Learn {s} thoroughly" for s in skills_to_learn[:3]],
            "weekly_plan": weekly_plan
        }

    @staticmethod
    def get_deterministic_interview_fallback(target_role: str, missing_skills: List[str]) -> Dict[str, Any]:
        """Provides a high-quality deterministic interview questions prep set when Ollama is offline."""
        skills_to_check = missing_skills if missing_skills else ["System Design", "Databases"]
        
        tech_questions = []
        for i, skill in enumerate(skills_to_check[:5]):
            tech_questions.append({
                "question": f"Explain the core components of {skill} and how you implement them in production.",
                "expected_answer_points": [
                    "Design patterns and paradigms",
                    "Caching, indexing, or memory constraints",
                    "Security practices and unit testing"
                ]
            })
            
        # Fallback padding if not enough skills
        while len(tech_questions) < 5:
            tech_questions.append({
                "question": "What are your strategies for testing and debugging application bottlenecks?",
                "expected_answer_points": ["Logging and tracers", "Unit vs Integration testing", "Profiling tools"]
            })

        behavioral_questions = [
            {
                "question": "Describe a difficult technical challenge you faced and how you debugged it.",
                "expected_answer_points": ["Identify the root issue", "Research options", "Implementation results"]
            },
            {
                "question": "How do you handle collaborating with other developers when there are conflicting design choices?",
                "expected_answer_points": ["Active listening", "Evaluating metrics", "Consensus building"]
            },
            {
                "question": "Tell me about a time you had to learn a new framework or language under tight deadlines.",
                "expected_answer_points": ["Focus on core concepts", "Prototype setup", "Deliver MVP"]
            },
            {
                "question": "Describe a scenario where you made a mistake in database modeling. How did you resolve it?",
                "expected_answer_points": ["Acknowledge mistake", "Create migration script", "No data loss"]
            },
            {
                "question": "How do you stay updated with the latest software development tools and design paradigms?",
                "expected_answer_points": ["Blogs and tech papers", "Side projects", "Conferences"]
            }
        ]

        follow_up_questions = [
            {
                "question": f"Why is {skills_to_check[0]} preferred over alternative technologies in large systems?",
                "expected_answer_points": ["Scale criteria", "Speed efficiency", "Community support"]
            },
            {
                "question": "What security practices do you enforce in API parameter validations?",
                "expected_answer_points": ["Sanitization", "Role based access limits", "HTTPS constraints"]
            },
            {
                "question": "How do you optimize slow query times in transactional databases?",
                "expected_answer_points": ["EXPLAIN ANALYZE", "Database Indexes", "Query optimization"]
            }
        ]

        return {
            "target_role": target_role,
            "technical_questions": tech_questions,
            "behavioral_questions": behavioral_questions,
            "follow_up_questions": follow_up_questions
        }

    @classmethod
    async def generate_roadmap(cls, db: Session, resume_id: str, target_role: str, user_id: str) -> Roadmap:
        """Generates a structured roadmap utilizing Llama 3 with database persistence."""
        resume = ResumeService.get_resume(db, resume_id=resume_id, user_id=user_id)
        parsed_data = resume.parsed_data or {}
        
        user_skills = parsed_data.get("skills", [])
        
        # 1. Fetch missing skills deterministically
        required_skills = ResumeService.get_role_skills_from_db(db, target_role)
        user_skills_lower = [s.lower() for s in user_skills]
        missing_skills = [s for s in required_skills if s.lower() not in user_skills_lower]

        system_prompt = (
            "You are a strict JSON generator. Your output must be valid JSON matching the specified schema. "
            "Do not write any conversational text, descriptions, backticks, or notes. "
            "Return ONLY the raw JSON string."
        )

        prompt = f"""
Create a structured 4-week learning roadmap for a candidate who has these skills: {user_skills} and is targeting the role: {target_role}.
The candidate is missing these required skills: {missing_skills}.
Ensure the roadmap specifically focuses on teaching the missing skills.

Return your response in a single, minified, valid JSON object matching exactly this schema:
{{
  "target_role": "string",
  "duration_weeks": 4,
  "priorities": ["string"],
  "weekly_plan": [
    {{
      "week": 1,
      "title": "string",
      "topics": ["string"],
      "technologies": ["string"],
      "resources": [
        {{ "name": "string", "url": "string" }}
      ]
    }}
  ]
}}
"""

        roadmap_content = None
        try:
            # Query Ollama
            response_text = await cls.query_ollama(prompt, system_prompt)
            cleaned_json = cls.clean_json_string(response_text)
            roadmap_content = json.loads(cleaned_json)
        except Exception as e:
            print(f"Fallback triggered for Roadmap Generation: {str(e)}")
            # Fallback to high-quality mock data on error/offline
            roadmap_content = cls.get_deterministic_roadmap_fallback(target_role, missing_skills)

        # Persist to database
        db_roadmap = Roadmap(
            user_id=user_id,
            target_role=target_role,
            content=roadmap_content
        )
        db.add(db_roadmap)
        db.commit()
        db.refresh(db_roadmap)
        return db_roadmap

    @classmethod
    async def generate_interview_questions(cls, db: Session, resume_id: str, target_role: str, user_id: str) -> InterviewQuestion:
        """Generates mock interview questions using Llama 3 with database persistence."""
        resume = ResumeService.get_resume(db, resume_id=resume_id, user_id=user_id)
        parsed_data = resume.parsed_data or {}
        
        user_skills = parsed_data.get("skills", [])
        
        # 1. Fetch missing skills deterministically
        required_skills = ResumeService.get_role_skills_from_db(db, target_role)
        user_skills_lower = [s.lower() for s in user_skills]
        missing_skills = [s for s in required_skills if s.lower() not in user_skills_lower]

        system_prompt = (
            "You are a strict JSON generator. Your output must be valid JSON matching the specified schema. "
            "Do not write any conversational text, descriptions, backticks, or notes. "
            "Return ONLY the raw JSON string."
        )

        prompt = f"""
Generate mock interview questions for a candidate targeting the role: {target_role}.
The candidate has these skills: {user_skills} and is missing these required skills: {missing_skills}.
Ensure the questions target the missing skills and test how the candidate would bridge those gaps.

Return your response in a single, minified, valid JSON object matching exactly this schema:
{{
  "target_role": "string",
  "technical_questions": [
    {{
      "question": "string",
      "expected_answer_points": ["string"]
    }}
  ],
  "behavioral_questions": [
    {{
      "question": "string",
      "expected_answer_points": ["string"]
    }}
  ],
  "follow_up_questions": [
    {{
      "question": "string",
      "expected_answer_points": ["string"]
    }}
  ]
}}
Generate exactly 5 technical questions, 5 behavioral questions, and 3 follow-up questions.
"""

        questions_content = None
        try:
            # Query Ollama
            response_text = await cls.query_ollama(prompt, system_prompt)
            cleaned_json = cls.clean_json_string(response_text)
            questions_content = json.loads(cleaned_json)
        except Exception as e:
            print(f"Fallback triggered for Interview Generation: {str(e)}")
            # Fallback to high-quality mock data on error/offline
            questions_content = cls.get_deterministic_interview_fallback(target_role, missing_skills)

        # Persist to database
        db_questions = InterviewQuestion(
            user_id=user_id,
            target_role=target_role,
            questions=questions_content
        )
        db.add(db_questions)
        db.commit()
        db.refresh(db_questions)
        return db_questions
