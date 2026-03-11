"""
Server-side authentication middleware
Validates every request to protected routes
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import RedirectResponse
import jwt
from datetime import datetime, timedelta
from typing import Optional

class AuthMiddleware:
    def __init__(self):
        self.secret_key = "leafcure-secret-key-2024"  # Use a consistent secret key
        self.protected_routes = ["/dashboard", "/admin", "/history", "/results"]
    
    def create_token(self, username: str, is_admin: bool = False) -> str:
        """Create JWT token for authenticated user"""
        payload = {
            "username": username,
            "is_admin": is_admin,
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token and return user data"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            print(f"AuthMiddleware: Token verified successfully for user: {payload.get('username')}")
            return payload
        except jwt.ExpiredSignatureError:
            print("AuthMiddleware: Token expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"AuthMiddleware: Invalid token: {e}")
            return None
    
    def is_protected_route(self, path: str) -> bool:
        """Check if route requires authentication"""
        return any(path.startswith(route) for route in self.protected_routes)
    
    async def authenticate_request(self, request: Request):
        """Main authentication check for every request"""
        path = str(request.url.path)
        
        # Skip authentication for public routes
        if not self.is_protected_route(path):
            return True
        
        # Get token from Authorization header or cookie
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            token = request.cookies.get("auth_token")
        
        # No token = unauthorized
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        # Verify token
        user_data = self.verify_token(token)
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        # Add user data to request state
        request.state.user = user_data
        return True

# Global auth middleware instance
auth_middleware = AuthMiddleware()