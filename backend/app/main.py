from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.auth import router as auth_router
from app.api.v1.resume import router as resume_router
from app.api.v1.roadmap import router as roadmap_router
from app.api.v1.interview import router as interview_router
from app.db.seeds.seeder import seed_roles_and_skills

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize tables and seed database
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_roles_and_skills(db)
    finally:
        db.close()
    yield
    # Shutdown: Cleanups (if any)

app = FastAPI(
    title="Intelligent Career Development Platform API",
    description="Backend API for Resume upload, deterministic gap scoring, and profile intelligence.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local portfolio development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(resume_router, prefix="/api/v1/resume", tags=["Resume Analysis"])
app.include_router(roadmap_router, prefix="/api/v1/roadmap", tags=["Learning Roadmaps"])
app.include_router(interview_router, prefix="/api/v1/interview", tags=["Interview Prep"])

@app.get("/health")
def health():
    return {"status": "healthy", "database": "PostgreSQL connection success"}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
