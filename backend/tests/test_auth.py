import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Ensure database is configured
    Base.metadata.create_all(bind=engine)
    yield

def test_register_login():
    email = f"test_user_{int(time.time())}@example.com"
    password = "securePassword123"

    # 1. Test Registration
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password}
    )
    assert reg_response.status_code == 200
    assert reg_response.json()["email"] == email
    assert "id" in reg_response.json()

    # 2. Test Login
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
    assert login_response.json()["token_type"] == "bearer"

    token = login_response.json()["access_token"]

    # 3. Test Validate Session Profile
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email
