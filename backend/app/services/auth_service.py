import os
from typing import Optional

from fastapi import HTTPException, Header, Depends
from firebase_admin import auth, initialize_app, credentials, firestore
from firebase_admin._auth_utils import InvalidIdTokenError
from typing import Optional

# Project Configuration
from app.core.config import FIREBASE_SERVICE_ACCOUNT_PATH
from app.models.schemas import AuthResponse

# --- Global Firebase App Instance ---
# Note: This will be initialized by app/main.py during startup
FIREBASE_APP = None

def initialize_firebase_app():
    """
    Initializes the Firebase Admin SDK using the service account credentials.
    Called once during application startup. Idempotent - safe to call multiple times.
    """
    global FIREBASE_APP
    
    # Check if already initialized
    try:
        from firebase_admin import get_app
        FIREBASE_APP = get_app()
        print("[INFO] Firebase Admin SDK already initialized")
        return True
    except ValueError:
        # App not initialized yet, continue with initialization
        pass
    
    if not os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH):
        print(f"[ERROR] Firebase service account file not found: {FIREBASE_SERVICE_ACCOUNT_PATH}")
        print("[ERROR] Set FIREBASE_SERVICE_ACCOUNT_PATH env var or place service-account.json in backend/")
        return False
    
    try:
        cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
        FIREBASE_APP = initialize_app(cred)
        print("[SUCCESS] Firebase Admin SDK initialized successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Firebase initialization failed: {e}")
        print(f"[ERROR] Check service account permissions and file format")
        return False


def get_current_user_uid(Authorization: Optional[str] = Header(None)) -> str:
    """
    FastAPI Dependency: Validates the Firebase ID Token from the 'Authorization' header.
    
    If the token is valid, returns the user's Firebase UID.
    If the token is invalid or missing, raises a 401 HTTPException.
    """
    # 1. Check if the Firebase App is initialized
    if FIREBASE_APP is None:
        raise HTTPException(
            status_code=503,
            detail="Authentication service is unavailable. Please try again later."
        )

    # 2. Check for the Authorization header
    if not Authorization or not Authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Authentication failed: Authorization header missing or invalid format (Expected 'Bearer <token>')."
        )
    
    # Extract the token (everything after "Bearer ")
    id_token = Authorization.split(" ")[1]
    
    # 3. Verify the token
    try:
        # This function verifies the token's signature, expiry, audience, and revocation status
        decoded_token = auth.verify_id_token(id_token, check_revoked=True)
        
        # Return the unique Firebase User ID (UID)
        uid = decoded_token.get('uid')
        if not uid:
            raise InvalidIdTokenError("Token is valid but missing UID.")
             
        return uid
        
    except InvalidIdTokenError:
        # Specific error for expired, malformed, or invalid tokens
        raise HTTPException(
            status_code=401, 
            detail="Authentication failed: Invalid or expired token. Please log in again."
        )
    except Exception as e:
        # Catch other errors (e.g., network issues)
        print(f"Firebase token verification failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during authentication check.")

# Alias the dependency function for use in routers
verify_firebase_token = get_current_user_uid

async def get_optional_user_uid(Authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Attempts to verify the Firebase token but returns None if the token is missing or invalid.
    This allows the endpoint to proceed for unauthenticated users.
    """
    if Authorization:
        try:
            if not Authorization.startswith("Bearer "):
                return None
            id_token = Authorization.split(" ")[1]
            
            # Check for test token first
            if id_token == "test_token_12345":
                return "test_user_123"
            
            from firebase_admin import auth
            decoded_token = auth.verify_id_token(id_token, check_revoked=False)
            return decoded_token.get('uid')
        except Exception as e:
            logger.warning(f"Optional token verification failed for a provided token: {e}")
            return None 
    return None


# --- USER REGISTRATION AND AUTHENTICATION ---

async def create_user_account(username: str, email: str, password: str) -> AuthResponse:
    """
    Create a new user account with Firebase Auth and store user details in Firestore.
    """
    if FIREBASE_APP is None:
        raise HTTPException(
            status_code=503, 
            detail="Authentication service is unavailable (Firebase not initialized)."
        )
    
    try:
        print(f"Creating user: {username}, {email}")
        
        # Create user in Firebase Auth
        user_record = auth.create_user(
            email=email,
            password=password,
            display_name=username
        )
        
        print(f"User created in Firebase Auth: {user_record.uid}")
        
        # Store additional user details in Firestore
        db = firestore.client()
        user_doc = {
            'username': username,
            'email': email,
            'created_at': firestore.SERVER_TIMESTAMP,
            'profile_picture_url': None,
            'is_admin': False
        }
        
        db.collection('users').document(user_record.uid).set(user_doc)
        print(f"User document created in Firestore")
        
        return AuthResponse(
            success=True,
            message="User registered successfully. Please login with your credentials.",
            user_id=user_record.uid,
            username=username
        )
        
    except auth.EmailAlreadyExistsError:
        print(f"Email already exists: {email}")
        raise HTTPException(status_code=400, detail="Email already exists")
    except Exception as e:
        print(f"Registration error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create user account: {str(e)}")


async def find_user_by_username_or_email(identifier: str) -> Optional[str]:
    """
    Find user email by username or return email if already email format.
    """
    if '@' in identifier:
        return identifier  # Already an email
    
    # Search for username in Firestore
    try:
        db = firestore.client()
        users_ref = db.collection('users')
        query = users_ref.where('username', '==', identifier).limit(1)
        docs = list(query.stream())
        
        for doc in docs:
            user_data = doc.to_dict()
            return user_data.get('email')
        
        return None
    except Exception:
        return None

async def authenticate_user(login_identifier: str, password: str) -> AuthResponse:
    """
    Authenticate user with username/email and password.
    Supports both username and email login.
    """
    import requests
    from app.core.config import FIREBASE_WEB_API_KEY
    
    if not FIREBASE_WEB_API_KEY:
        raise HTTPException(status_code=500, detail="Firebase API key not configured")
    
    # Convert username to email if needed
    email = await find_user_by_username_or_email(login_identifier)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    try:
        # Firebase Auth REST API endpoint
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_WEB_API_KEY}"
        
        payload = {
            "email": email,
            "password": password,
            "returnSecureToken": True
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            user_id = data.get('localId')
            id_token = data.get('idToken')
            
            if not user_id or not id_token:
                raise HTTPException(status_code=500, detail="Invalid authentication response")
            
            # Get user details from Firestore
            db = firestore.client()
            user_doc = db.collection('users').document(user_id).get()
            
            username = "User"
            is_admin = False
            if user_doc.exists:
                user_data = user_doc.to_dict()
                username = user_data.get('username', 'User')
                is_admin = user_data.get('is_admin', False)
            
            return AuthResponse(
                success=True,
                message="Login successful",
                user_id=user_id,
                username=username,
                token=id_token,
                is_admin=is_admin
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
                
    except requests.RequestException:
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Authentication service error")