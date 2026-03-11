from fastapi import APIRouter, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import BaseModel
from app.services.simple_auth import auth_service
from app.models.schemas import AuthResponse

class LoginRequest(BaseModel):
    username: str
    password: str

router = APIRouter()

@router.post("/auth/simple/login", response_model=AuthResponse)
async def simple_login(request: LoginRequest):
    """Simple login endpoint that returns JWT token in response body"""
    username = request.username
    password = request.password
    
    user_data = auth_service.authenticate_user(username, password)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth_service.create_token(user_data["username"], user_data["is_admin"])
    
    return AuthResponse(
        success=True,
        message="Login successful",
        user_id=user_data["user_id"],
        username=user_data["username"],
        token=token,
        is_admin=user_data["is_admin"]
    )

@router.get("/auth/simple/validate")
async def simple_validate(request: Request):
    """Validate JWT token from Authorization header"""
    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    
    token = auth_header.split(" ")[1]
    user_data = auth_service.verify_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {
        "valid": True,
        "user": {
            "username": user_data["username"],
            "is_admin": user_data["is_admin"],
            "exp": user_data["exp"],
            "iat": user_data["iat"]
        }
    }

@router.post("/auth/simple/logout")
async def simple_logout():
    """Simple logout (client should clear token)"""
    return {"success": True, "message": "Logged out successfully"}
