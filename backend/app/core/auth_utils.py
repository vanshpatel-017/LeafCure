"""
Admin verification and security utilities
"""
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify admin token and permissions"""
    try:
        # Verify the token
        decoded_token = auth.verify_id_token(credentials.credentials)
        
        # Check if user is admin
        if not decoded_token.get('admin', False):
            logger.warning(f"Non-admin user {decoded_token.get('uid')} attempted admin access")
            raise HTTPException(
                status_code=403, 
                detail="Admin access required. This incident has been logged."
            )
        
        return decoded_token
    
    except auth.InvalidIdTokenError:
        logger.error("Invalid admin token provided")
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        logger.error(f"Admin verification error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def verify_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify user token"""
    try:
        decoded_token = auth.verify_id_token(credentials.credentials)
        return decoded_token
    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        logger.error(f"User verification error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

def validate_confidence_score(confidence: float) -> float:
    """Validate and clamp confidence score"""
    if confidence is None:
        return 0.0
    
    # Clamp between 0 and 100
    confidence = max(0.0, min(100.0, float(confidence)))
    
    # Round to 2 decimal places
    return round(confidence, 2)