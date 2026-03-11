import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from typing import Optional, Dict

class SimpleAuthService:
    def __init__(self):
        self.secret_key = "leafcure-simple-auth-2024"
        self.algorithm = "HS256"
        self.token_expiry_hours = 24
    
    def create_token(self, username: str, is_admin: bool = False) -> str:
        """Create JWT token for user"""
        payload = {
            "username": username,
            "is_admin": is_admin,
            "exp": datetime.utcnow() + timedelta(hours=self.token_expiry_hours),
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token and return user data"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Simple user authentication (demo mode)"""
        # In demo mode, accept any credentials
        return {
            "username": username,
            "is_admin": username.lower() in ['vansh', 'admin', 'vansh@gmail.com'],
            "user_id": f"demo-user-{hash(username)}"
        }

# Global auth service instance
auth_service = SimpleAuthService()
