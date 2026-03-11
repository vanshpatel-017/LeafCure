"""
Rate limiting and security middleware
"""
import time
from collections import defaultdict
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.upload_requests = defaultdict(list)
    
    def is_allowed(self, key: str, limit: int = 60, window: int = 60) -> bool:
        """Check if request is within rate limit"""
        now = time.time()
        # Clean old requests
        self.requests[key] = [req_time for req_time in self.requests[key] if now - req_time < window]
        
        if len(self.requests[key]) >= limit:
            return False
        
        self.requests[key].append(now)
        return True
    
    def is_upload_allowed(self, key: str, limit: int = 10, window: int = 300) -> bool:
        """Check if upload request is within rate limit (stricter)"""
        now = time.time()
        self.upload_requests[key] = [req_time for req_time in self.upload_requests[key] if now - req_time < window]
        
        if len(self.upload_requests[key]) >= limit:
            return False
        
        self.upload_requests[key].append(now)
        return True

rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    client_ip = request.client.host
    path = request.url.path
    
    # Different limits for different endpoints
    if "/predict" in path or "/upload" in path:
        if not rate_limiter.is_upload_allowed(client_ip, limit=5, window=300):  # 5 uploads per 5 minutes
            return JSONResponse(
                status_code=429,
                content={"error": "Too many upload requests. Please wait before trying again."}
            )
    else:
        if not rate_limiter.is_allowed(client_ip, limit=100, window=60):  # 100 requests per minute
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded. Please slow down."}
            )
    
    response = await call_next(request)
    return response

def validate_image_file(file_content: bytes, max_size: int = 10 * 1024 * 1024) -> bool:
    """Validate uploaded image file"""
    if len(file_content) > max_size:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
    
    # Check file signature for common image formats
    image_signatures = [
        b'\xff\xd8\xff',  # JPEG
        b'\x89PNG\r\n\x1a\n',  # PNG
        b'GIF87a',  # GIF87a
        b'GIF89a',  # GIF89a
        b'RIFF',  # WebP (starts with RIFF)
    ]
    
    if not any(file_content.startswith(sig) for sig in image_signatures):
        raise HTTPException(status_code=400, detail="Invalid image format. Please upload JPEG, PNG, GIF, or WebP.")
    
    return True