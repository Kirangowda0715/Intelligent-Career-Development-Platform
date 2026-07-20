import pytest
import time
import uuid
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base
from app.db.models import Resume, User
from app.core.database import SessionLocal

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_roadmap_and_interview_generation():
    email = f"ai_test_{int(time.time())}@example.com"
    password = "securePassword123"

    # 1. Sign up and authenticate
    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    login_res = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create user resume manually in database to avoid PDF generation overhead
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    resume = Resume(
        user_id=user.id,
        filename="dummy.pdf",
        file_path="/dummy/path",
        raw_text="Test resume with some skills",
        parsed_data={
            "name": "AI Tester",
            "skills": ["Python", "Git"],
            "education": ["BS CS"],
            "certifications": [],
            "projects": []
        }
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    resume_id = str(resume.id)
    db.close()

    # 2. Test generating roadmap WITH query_ollama success (mocked)
    mock_roadmap_json = """
    {
      "target_role": "Backend Engineer",
      "duration_weeks": 4,
      "priorities": ["Learn PostgreSQL indexing", "Learn FastAPI Middleware"],
      "weekly_plan": [
        {
          "week": 1,
          "title": "Database Optimization",
          "topics": ["PostgreSQL indexing"],
          "technologies": ["PostgreSQL"],
          "resources": [
            { "name": "Postgres Tutorial", "url": "https://example.com" }
          ]
        }
      ]
    }
    """
    
    with patch("app.services.ai_service.AIService.query_ollama", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = mock_roadmap_json
        res = client.post(
            "/api/v1/roadmap/generate",
            headers=headers,
            json={"resume_id": resume_id, "target_role": "Backend Engineer"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["target_role"] == "Backend Engineer"
        assert data["content"]["duration_weeks"] == 4
        assert "weekly_plan" in data["content"]
        assert len(data["content"]["weekly_plan"]) == 1
        roadmap_id = data["id"]

    # Test listing roadmaps
    list_res = client.get("/api/v1/roadmap/", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Test getting roadmap by ID
    get_res = client.get(f"/api/v1/roadmap/{roadmap_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == roadmap_id

    # 3. Test generating roadmap WITH fallback (query_ollama exception)
    with patch("app.services.ai_service.AIService.query_ollama", new_callable=AsyncMock) as mock_query:
        mock_query.side_effect = Exception("Ollama offline")
        res = client.post(
            "/api/v1/roadmap/generate",
            headers=headers,
            json={"resume_id": resume_id, "target_role": "Backend Engineer"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["target_role"] == "Backend Engineer"
        assert data["content"]["duration_weeks"] == 4
        # Fallback generates a 4-week roadmap
        assert len(data["content"]["weekly_plan"]) == 4

    # 4. Test generating interview questions WITH success (mocked)
    mock_interview_json = """
    {
      "target_role": "Backend Engineer",
      "technical_questions": [
        {
          "question": "What is connection pooling?",
          "expected_answer_points": ["PgBouncer", "Connection overhead"]
        }
      ],
      "behavioral_questions": [
        {
          "question": "Tell me about a bug you solved.",
          "expected_answer_points": ["Logging", "Resolution"]
        }
      ],
      "follow_up_questions": [
        {
          "question": "How do you handle migrations?",
          "expected_answer_points": ["Alembic"]
        }
      ]
    }
    """
    with patch("app.services.ai_service.AIService.query_ollama", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = mock_interview_json
        res = client.post(
            "/api/v1/interview/generate",
            headers=headers,
            json={"resume_id": resume_id, "target_role": "Backend Engineer"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["target_role"] == "Backend Engineer"
        assert "questions" in data
        assert len(data["questions"]["technical_questions"]) == 1
        interview_id = data["id"]

    # Test listing interview preps
    list_res = client.get("/api/v1/interview/", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Test getting interview prep by ID
    get_res = client.get(f"/api/v1/interview/{interview_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == interview_id

    # 5. Test generating interview questions WITH fallback
    with patch("app.services.ai_service.AIService.query_ollama", new_callable=AsyncMock) as mock_query:
        mock_query.side_effect = Exception("Ollama offline")
        res = client.post(
            "/api/v1/interview/generate",
            headers=headers,
            json={"resume_id": resume_id, "target_role": "Backend Engineer"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["target_role"] == "Backend Engineer"
        # Fallback has 5 tech questions
        assert len(data["questions"]["technical_questions"]) >= 5
