import pytest
import time
import io
import fitz  # PyMuPDF
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_resume_upload_and_analysis():
    email = f"resume_test_{int(time.time())}@example.com"
    password = "securePassword123"

    # 1. Sign up and authenticate
    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    login_res = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Generate a valid PDF resume dynamically
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (50, 50), 
        "Kiran Kumar\n\n"
        "Skills:\nPython, FastAPI, PostgreSQL, Git, Docker\n\n"
        "Education:\nBachelor of Technology in Computer Science, University of Madras\n\n"
        "Certifications:\nAWS Certified Solutions Architect\n\n"
        "Projects:\n- Portfolio Project: Career AI Platform using FastAPI and React"
    )
    pdf_bytes = doc.write()
    doc.close()

    # 3. Test PDF Resume Upload Endpoint
    upload_res = client.post(
        "/api/v1/resume/upload",
        headers=headers,
        files={"file": ("resume.pdf", pdf_bytes, "application/pdf")}
    )
    assert upload_res.status_code == 200
    resume_data = upload_res.json()
    assert resume_data["filename"] == "resume.pdf"
    
    parsed = resume_data["parsed_data"]
    assert parsed["name"] == "Kiran Kumar"
    assert "Python" in parsed["skills"]
    assert "FastAPI" in parsed["skills"]
    assert len(parsed["education"]) > 0
    assert "AWS Certified Solutions Architect" in parsed["certifications"]
    
    resume_id = resume_data["id"]

    # 4. Test Deterministic Skill Gap Analysis Endpoint
    analyze_res = client.post(
        f"/api/v1/resume/{resume_id}/analyze",
        headers=headers,
        json={"target_role": "Backend Engineer"}
    )
    assert analyze_res.status_code == 200
    analysis = analyze_res.json()
    assert analysis["target_role"] == "Backend Engineer"
    assert "match_score" in analysis
    assert "completeness_score" in analysis
    assert "profile_strength" in analysis
    assert "recommended_role" in analysis
    assert "missing_skills" in analysis
