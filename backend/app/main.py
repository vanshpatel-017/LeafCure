from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize logging
from app.core.logging_config import logger

# Import routers and services
from app.api.router import api_router
from app.api.simple_auth_router import router as simple_auth_router
from app.services.auth_service import initialize_firebase_app


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    """
    # Startup
    print("[INFO] Starting LeafCure API...")

    # Initialize Firebase
    firebase_success = initialize_firebase_app()
    if not firebase_success:
        print("[ERROR] Failed to initialize Firebase. Authentication features may not work.")

    # Defer ML model loading until first prediction request.
    # This keeps login and admin APIs responsive immediately after startup.
    print("[INFO] ML models will load on first prediction request.")

    print("[SUCCESS] LeafCure API started successfully!")

    yield

    # Shutdown
    print("[INFO] Shutting down LeafCure API...")


# Create FastAPI application
app = FastAPI(
    title="LeafCure API",
    description="Plant Disease Diagnosis and Treatment API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
import os
cors_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [o.strip() for o in cors_origins.split(",") if o.strip()]
allow_origin_regex = r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"
print(f"[CONFIG] CORS allowed origins: {allowed_origins}")
print(f"[CONFIG] CORS allow_origin_regex: {allow_origin_regex}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")
app.include_router(simple_auth_router, prefix="/api/v1")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to LeafCure API",
        "version": "1.0.0",
        "status": "healthy",
        "auth_modes": ["simple", "firebase"]
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "LeafCure API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
