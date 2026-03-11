from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import time
from collections import defaultdict
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(list)

class SecurityMiddleware:
    @staticmethod
    def validate_input(data: str, max_length: int = 1000) -> str:
        """Validate and sanitize input data"""
        if not data:
            return ""
        
        # Remove potential XSS patterns
        xss_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe[^>]*>.*?</iframe>'
        ]
        
        cleaned_data = data
        for pattern in xss_patterns:
            cleaned_data = re.sub(pattern, '', cleaned_data, flags=re.IGNORECASE | re.DOTALL)
        
        # Limit length
        if len(cleaned_data) > max_length:
            cleaned_data = cleaned_data[:max_length]
        
        return cleaned_data.strip()
    
    @staticmethod
    def rate_limit(request: Request, max_requests: int = 100, window_seconds: int = 60):
        """Rate limiting implementation"""
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old requests
        rate_limit_storage[client_ip] = [
            req_time for req_time in rate_limit_storage[client_ip]
            if current_time - req_time < window_seconds
        ]
        
        # Check rate limit
        if len(rate_limit_storage[client_ip]) >= max_requests:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # Add current request
        rate_limit_storage[client_ip].append(current_time)
    
    @staticmethod
    def validate_admin_action(action: str, allowed_actions: list) -> bool:
        """Validate admin actions against whitelist"""
        return action in allowed_actions
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize file names to prevent path traversal"""
        if not filename:
            return "unknown"
        
        # Remove path separators and dangerous characters
        dangerous_chars = ['/', '\\', '..', '<', '>', ':', '"', '|', '?', '*']
        sanitized = filename
        
        for char in dangerous_chars:
            sanitized = sanitized.replace(char, '_')
        
        # Limit length
        if len(sanitized) > 255:
            sanitized = sanitized[:255]
        
        return sanitized or "unknown"

# Security headers middleware
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    
    return response

async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting to all requests"""
    try:
        # Skip rate limiting for health checks
        if request.url.path in ["/docs", "/redoc", "/openapi.json", "/health"]:
            return await call_next(request)
        
        SecurityMiddleware.rate_limit(request, max_requests=100, window_seconds=60)
    except HTTPException as e:
        return e
    
    return await call_next(request)