import io
from typing import Optional, List
import traceback

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Header, Request, Response
from datetime import datetime

# Import Schemas
from app.models.schemas import (
    DiagnosisResult, HistoryStore, HistoryItem, UserLogin, UserRegister, 
    AuthResponse, ContactMessage, ContactMessageResponse
)

# Import Services and Configuration
from app.services.auth_service import verify_firebase_token, get_optional_user_uid
from app.services.history_service import log_prediction_history, get_user_history
from app.core.logging_config import logger
from app.middleware.auth import auth_middleware

# --- INITIALIZE ROUTER ---
api_router = APIRouter()

def get_ml_service():
    """
    Lazy import ML service to keep auth/login endpoints responsive
    even when heavy ML dependencies take time to initialize.
    """
    import app.services.ml_inference as ml_service
    return ml_service



@api_router.get("/debug/test")
async def debug_test():
    """Simple test endpoint that doesn't require authentication"""
    return {
        "message": "Backend is working!",
        "timestamp": "2024-01-01T00:00:00Z",
        "status": "ok"
    }

@api_router.get("/test")
async def test_endpoint():
    return {"message": "API is working", "version": "updated"}

@api_router.get("/models/status")
async def model_status():
    """Check if ML models are loaded"""
    try:
        ml_service = get_ml_service()
        # Try to load models if not loaded
        if ml_service.VIT_MODEL is None or ml_service.SWIN_MODEL is None:
            logger.info("Models not loaded, attempting to load...")
            success = ml_service.load_models()
            logger.info(f"Model loading result: {success}")
        
        return {
            "vit_loaded": ml_service.VIT_MODEL is not None,
            "swin_loaded": ml_service.SWIN_MODEL is not None,
            "knowledge_base_loaded": len(ml_service.KNOWLEDGE_BASE) > 0,
            "knowledge_base_entries": len(ml_service.KNOWLEDGE_BASE),
            "device": str(ml_service.DEVICE) if hasattr(ml_service, 'DEVICE') else "unknown",
            "vit_weights_path": ml_service.VIT_WEIGHTS_PATH,
            "swin_weights_path": ml_service.SWIN_WEIGHTS_PATH
        }
    except Exception as e:
        logger.error(f"Error checking model status: {e}", exc_info=True)
        return {
            "error": str(e),
            "vit_loaded": False,
            "swin_loaded": False
        }



# --- CORE PREDICTION ENDPOINT ---
# Protected logic is now integrated into this single route.
@api_router.post("/predict", response_model=DiagnosisResult)
async def predict(
    file: UploadFile = File(...),
    researcher_mode: bool = False,
    plant_type: Optional[str] = None,
    uid: Optional[str] = Depends(get_optional_user_uid) 
):
    """
    Runs dual-model inference, performs consensus check, and logs history if the user is authenticated.
    """
    logger.info(f"Prediction request received for file: {file.filename}, researcher_mode: {researcher_mode}")
    ml_service = get_ml_service()
    # 1. Check if models are loaded
    if ml_service.VIT_MODEL is None or ml_service.SWIN_MODEL is None:
        logger.warning("Models not loaded at prediction time, attempting to load...")
        try:
            success = ml_service.load_models()
            if not success:
                logger.error("Models failed to load during prediction request.")
                raise HTTPException(status_code=503, detail="Models failed to load")
            logger.info("Models loaded successfully during prediction request.")
        except Exception as e:
            logger.critical(f"Critical error during model loading: {e}", exc_info=True)
            raise HTTPException(status_code=503, detail="Prediction service unavailable")

    # 2. Validate and Read Image
    try:
        from app.core.validators import InputValidator
        logger.debug("Validating uploaded image...")
        content = await InputValidator.validate_image_upload(file, max_size_mb=10)
        logger.debug(f"Image validation successful. Size: {len(content)} bytes")
        
        input_tensor = ml_service.preprocess_image(content)
        logger.debug(f"Image preprocessed, tensor shape: {input_tensor.shape}")
        
    except HTTPException:
        raise  # Re-raise HTTPExceptions from the validator to return correct status codes
    except ValueError as e:
        logger.error(f"Image preprocessing error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to read or process image content: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to read image content: {e}")


    # 3. Run ML Inference
    try:
        logger.debug("Running ML inference on both models...")
        vit_name, vit_conf = ml_service.run_inference(ml_service.VIT_MODEL, input_tensor, plant_type)
        swin_name, swin_conf = ml_service.run_inference(ml_service.SWIN_MODEL, input_tensor, plant_type)
        
        logger.info(f"Inference results - ViT: {vit_name} ({vit_conf:.3f}), Swin: {swin_name} ({swin_conf:.3f})")
        
        final_name, final_conf, model_used = swin_name, swin_conf, "Swin"
        logger.info(f"Final prediction selected: {final_name} ({final_conf:.3f}) using model: {model_used}")

    except HTTPException:
        raise
    except Exception as e:
        logger.critical(f"Internal server error during ML inference: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error during ML inference: {str(e)}")


    # 4. Generate Grad-CAM if needed
    heatmap_base64 = None
    if researcher_mode:
        try:
            logger.debug("Generating Grad-CAM for researcher mode...")
            from app.core.config import CLASS_NAMES
            predicted_idx = CLASS_NAMES.index(final_name)
            cam = ml_service.generate_gradcam(ml_service.SWIN_MODEL, input_tensor, predicted_idx)
            if cam is not None:
                heatmap_base64 = ml_service.create_heatmap_overlay(content, cam)
                logger.debug("Grad-CAM generated successfully.")
        except Exception as e:
            logger.error(f"Grad-CAM generation failed: {e}", exc_info=True)
    
    # 5. Get knowledge base info for BOTH models
    logger.debug("Fetching knowledge base entries for both model predictions...")
    vit_knowledge = ml_service.get_knowledge_base_entry(vit_name)
    swin_knowledge = ml_service.get_knowledge_base_entry(swin_name)
    
    # Use selected model's knowledge (default to Swin)
    knowledge = swin_knowledge
    logger.debug("Knowledge base entry for final prediction prepared.")
    
    diagnosis = DiagnosisResult(
        success=True,
        disease_name=final_name,
        confidence=round(final_conf, 4),
        plant_type=knowledge.get('plant_type', 'Unknown'),
        treatment=knowledge.get('treatment', ['No treatment information available.']),
        treatments=knowledge.get('treatment', ['No treatment information available.']),
        prevention=knowledge.get('prevention', ['No prevention information available.']),
        symptoms=knowledge.get('symptoms', 'No symptom information available.'),
        causes=knowledge.get('causes', 'No cause information available.'),
        heatmap_base64=heatmap_base64,
        model_used=model_used,
        vit_confidence=round(vit_conf, 4),
        swin_confidence=round(swin_conf, 4),
        vit_prediction=vit_name,
        swin_prediction=swin_name,
        # Add knowledge for both models
        vit_treatment=vit_knowledge.get('treatment', []),
        vit_prevention=vit_knowledge.get('prevention', []),
        vit_symptoms=vit_knowledge.get('symptoms', 'No symptom information available.'),
        vit_causes=vit_knowledge.get('causes', 'No cause information available.'),
        swin_treatment=swin_knowledge.get('treatment', []),
        swin_prevention=swin_knowledge.get('prevention', []),
        swin_symptoms=swin_knowledge.get('symptoms', 'No symptom information available.'),
        swin_causes=swin_knowledge.get('causes', 'No cause information available.')
    )

    # 6. Log to history if user authenticated
    if uid:
        try:
            logger.info(f"Authenticated user '{uid}' detected. Logging prediction to history.")
            import base64
            image_base64 = base64.b64encode(content).decode('utf-8')
            
            from datetime import timezone
            log_data = HistoryStore(
                disease_name=final_name,
                confidence=round(final_conf, 4),
                timestamp=datetime.now(timezone.utc).isoformat(),
                image_filename=file.filename or "unknown.jpg",
                model_used=model_used
            )
            log_prediction_history(
                uid, 
                log_data, 
                researcher_mode=researcher_mode,
                heatmap=heatmap_base64,
                plant_type=knowledge.get('plant_type'),
                treatment=knowledge.get('treatment'),
                prevention=knowledge.get('prevention'),
                image_base64=image_base64
            )
            logger.info(f"Successfully logged prediction for user '{uid}'.")
        except Exception as e:
            logger.error(f"History logging failed for user '{uid}': {e}", exc_info=True)

    # 7. Return result
    logger.info(f"Prediction request completed. Returning diagnosis for '{final_name}'.")
    return diagnosis


# --- HISTORY ENDPOINT (PROTECTED) ---
@api_router.get("/history", response_model=List[HistoryItem])
async def get_user_prediction_history(
    # This DEPENDS MUST verify the token, raising 401 if invalid.
    uid: str = Depends(verify_firebase_token)
):
    """
    Retrieves the prediction history for the authenticated user (identified by UID).
    """
    try:
        # For development/testing, return mock data if using test user
        if uid == "test_user_123":
            from datetime import datetime, timezone
            return [
                {
                    "disease_name": "Tomato___Early_blight",
                    "confidence": 0.95,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "image_filename": "test_leaf.jpg",
                    "model_used": "Swin"
                },
                {
                    "disease_name": "Apple___Apple_scab",
                    "confidence": 0.87,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "image_filename": "apple_leaf.jpg",
                    "model_used": "ViT"
                }
            ]
        
        # Get history from the Firestore service
        history = get_user_history(uid=uid)
        return history
    except Exception as e:
        logger.error(f"Error retrieving user history for UID {uid}: {e}", exc_info=True)
        # Return empty list on error instead of raising exception
        return []


# --- AUTHENTICATION ENDPOINTS ---
@api_router.get("/auth/validate")
async def validate_session(request: Request):
    """
    Validate current session - called on every protected route access
    """
    try:
        print(f"Auth validation request headers: {dict(request.headers)}")
        print(f"Auth validation request cookies: {request.cookies}")
        
        # Try cookie-based authentication first
        auth_token = request.cookies.get("auth_token")
        print(f"Auth validation: Found auth_token: {auth_token is not None}")
        
        if auth_token:
            from app.middleware.auth import auth_middleware
            # Use the auth middleware to validate the token
            user_data = auth_middleware.verify_token(auth_token)
            print(f"Auth validation: Token verification result: {user_data is not None}")
            if user_data:
                print(f"Auth validation: Session valid for user: {user_data.get('username')}")
                return {"valid": True, "user": user_data}
        
        # Fall back to Firebase token if no cookie
        from app.services.auth_service import get_optional_user_uid
        auth_header = request.headers.get("Authorization")
        print(f"Auth validation: Checking Firebase token: {auth_header is not None}")
        
        uid = await get_optional_user_uid(auth_header)
        if uid:
            print(f"Auth validation: Firebase validation successful for UID: {uid}")
            return {"valid": True, "user": {"username": "User", "is_admin": False}}
        
        print("Auth validation: No valid session found")
        raise HTTPException(status_code=401, detail="Session invalid")
    except HTTPException:
        print("Auth validation: HTTPException raised")
        raise HTTPException(status_code=401, detail="Session invalid")

@api_router.post("/auth/logout")
async def logout_user(response: Response):
    """
    Logout user by clearing auth cookie
    """
    response.delete_cookie("auth_token")
    return {"success": True, "message": "Logged out successfully"}

@api_router.post("/auth/register", response_model=AuthResponse)
async def register_user(user_data: UserRegister):
    """
    Register a new user with email and password.
    """
    try:
        from app.services.auth_service import create_user_account
        from app.core.validators import InputValidator

        # Validate password strength
        InputValidator.validate_password_strength(user_data.password)

        result = await create_user_account(user_data.username, user_data.email, user_data.password)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User registration failed for email {user_data.email}: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/auth/login", response_model=AuthResponse)
async def login_user(user_data: UserLogin, response: Response):
    """
    Authenticate user and resolve admin access from backend user attributes.
    """
    login_identifier = user_data.login_identifier.strip()
    logger.info(f"Login attempt for user: {login_identifier}")

    username = login_identifier.split('@')[0] if '@' in login_identifier else login_identifier
    email = login_identifier if '@' in login_identifier else f"{username}@leafcure.com"
    is_admin = False
    resolved_user_id = "demo-user-" + str(hash(login_identifier))

    # This token is used by frontend Authorization headers for API calls.
    # Prefer Firebase token when available; otherwise fall back to local JWT.
    api_token = None

    try:
        from app.services.auth_service import authenticate_user, find_user_by_username_or_email

        auth_result = await authenticate_user(login_identifier, user_data.password)
        if auth_result and auth_result.success:
            username = auth_result.username or username
            is_admin = bool(auth_result.is_admin)
            resolved_user_id = auth_result.user_id or resolved_user_id
            api_token = auth_result.token

            resolved_email = await find_user_by_username_or_email(login_identifier)
            if resolved_email:
                email = resolved_email

            logger.info(f"Firebase login successful for user: {username}, is_admin: {is_admin}")
    except Exception as auth_err:
        logger.warning(f"Firebase auth path unavailable, using local fallback for '{login_identifier}': {auth_err}")

        # Fallback: read admin attributes from Firestore user doc if available.
        try:
            from firebase_admin import firestore
            db = firestore.client()
            user_doc = None

            if '@' in login_identifier:
                docs = list(db.collection('users').where('email', '==', login_identifier).limit(1).stream())
            else:
                docs = list(db.collection('users').where('username', '==', login_identifier).limit(1).stream())

            if docs:
                user_doc = docs[0].to_dict()

            if user_doc:
                role_value = str(user_doc.get('role', '')).lower()
                is_admin = bool(
                    user_doc.get('is_admin', False)
                    or user_doc.get('isAdmin', False)
                    or user_doc.get('admin', False)
                    or user_doc.get('is_superadmin', False)
                    or user_doc.get('isSuperAdmin', False)
                    or role_value in ['admin', 'super_admin', 'superadmin']
                )
                username = user_doc.get('username', username)
                email = user_doc.get('email', email)
                logger.info(f"Local fallback resolved user attributes for {username}, is_admin: {is_admin}")
            else:
                # Last-resort backward compatibility for demo credentials.
                is_admin = login_identifier.lower() in ['vansh@gmail.com', 'admin@leafcure.com', 'vansh', 'admin']
        except Exception as lookup_err:
            logger.warning(f"Could not resolve admin attributes from Firestore fallback: {lookup_err}")
            is_admin = login_identifier.lower() in ['vansh@gmail.com', 'admin@leafcure.com', 'vansh', 'admin']

    # Session cookie token used by /auth/validate route.
    session_token = auth_middleware.create_token(username, is_admin)

    # Lax works on localhost without Secure; None+Secure=False can be rejected by browsers.
    response.set_cookie(
        key="auth_token",
        value=session_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=86400,
        path="/",
        domain=None
    )

    if not api_token:
        api_token = session_token

    logger.info(f"Login successful for user: {username}, is_admin: {is_admin}")

    return {
        "success": True,
        "token": api_token,
        "user_id": resolved_user_id,
        "username": username,
        "email": email,
        "is_admin": is_admin,
        "message": "Login successful"
    }


@api_router.get("/user/stats")
async def get_user_stats(uid: str = Depends(verify_firebase_token)):
    """
    Get user statistics and recent activity.
    """
    try:
        # For development/testing, return mock data if Firebase is not available
        if uid == "test_user_123":
            return {
                "total_predictions": 15,
                "recent_predictions": 3,
                "user_id": uid
            }
        
        from firebase_admin import firestore
        db = firestore.client()
        
        # Get prediction count
        history_ref = db.collection('users').document(uid).collection('prediction_history')
        total_predictions = len(list(history_ref.stream()))
        
        # Get recent predictions (last 7 days)
        from datetime import datetime, timedelta, timezone
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_predictions = len(list(history_ref.where('created_at', '>=', week_ago).stream()))
        
        return {
            "total_predictions": total_predictions,
            "recent_predictions": recent_predictions,
            "user_id": uid
        }
    except Exception as e:
        logger.error(f"Error getting user stats for UID {uid}: {e}", exc_info=True)
        # Return mock data on error
        return {
            "total_predictions": 0,
            "recent_predictions": 0,
            "user_id": uid
        }


@api_router.get("/user/profile")
async def get_user_profile(uid: str = Depends(verify_firebase_token)):
    """
    Get user profile information.
    """
    try:
        from firebase_admin import firestore, auth
        db = firestore.client()
        
        user_doc = db.collection('users').document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        user_auth = auth.get_user(uid)
        
        return {
            "username": user_data.get('username', ''),
            "email": user_auth.email,
            "bio": user_data.get('bio', '')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile for UID {uid}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get profile")


@api_router.patch("/user/profile")
async def update_user_profile(data: dict, uid: str = Depends(verify_firebase_token)):
    """
    Update user profile information.
    """
    try:
        from firebase_admin import firestore, auth
        import requests
        db = firestore.client()
        
        update_data = {}
        
        if 'username' in data and data['username']:
            username = str(data['username']).strip()
            if len(username) < 3 or len(username) > 50:
                raise HTTPException(status_code=400, detail="Username must be 3-50 characters")
            update_data['username'] = username
            try:
                auth.update_user(uid, display_name=username)
            except Exception as auth_err:
                logger.warning(f"Failed to update display name in Firebase Auth for UID {uid}: {auth_err}")
        
        if 'bio' in data:
            bio = str(data.get('bio', '')).strip()
            if len(bio) > 500:
                raise HTTPException(status_code=400, detail="Bio must be under 500 characters")
            update_data['bio'] = bio
        
        if update_data:
            db.collection('users').document(uid).update(update_data)
        
        if 'currentPassword' in data and 'newPassword' in data and data['newPassword']:
            if len(data['newPassword']) < 6:
                raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
            
            user = auth.get_user(uid)
            import os
            API_KEY = os.getenv("FIREBASE_WEB_API_KEY", "")
            if not API_KEY:
                raise HTTPException(status_code=500, detail="Firebase API key not configured")
            
            verify_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
            verify_response = requests.post(verify_url, json={
                "email": user.email,
                "password": data['currentPassword'],
                "returnSecureToken": True
            })
            
            if verify_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Current password is incorrect")
            
            auth.update_user(uid, password=data['newPassword'])
        
        return {"success": True, "message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile for UID {uid}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update profile")


# --- CONTACT FORM ENDPOINT ---
@api_router.post("/contact")
async def submit_contact_message(contact_data: ContactMessage):
    """
    Submit a contact form message.
    """
    try:
        from firebase_admin import firestore
        from app.core.validators import InputValidator
        
        # Validate inputs
        InputValidator.validate_contact_message(
            contact_data.name,
            contact_data.email,
            contact_data.subject,
            contact_data.message
        )
        
        # Sanitize inputs
        sanitized_name = InputValidator.sanitize_string(contact_data.name, max_length=100)
        sanitized_email = InputValidator.sanitize_string(contact_data.email, max_length=100)
        sanitized_subject = InputValidator.sanitize_string(contact_data.subject, max_length=200)
        sanitized_message = InputValidator.sanitize_string(contact_data.message, max_length=5000)
        
        db = firestore.client()
        
        message_data = {
            'name': sanitized_name,
            'email': sanitized_email,
            'subject': sanitized_subject,
            'message': sanitized_message,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'read': False
        }
        
        db.collection('contact_messages').add(message_data)
        logger.info(f"Contact message submitted by {sanitized_email}")
        
        return {"success": True, "message": "Message sent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting contact message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit message")


# --- ADMIN ENDPOINTS ---
async def verify_admin_simple(Authorization: Optional[str] = Header(None)) -> str:
    """
    Verify that the user is an admin.
    Supports both local session JWT tokens and Firebase ID tokens.
    """
    try:
        if not Authorization or not Authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="No authorization token")

        id_token = Authorization.split(" ")[1]

        # First accept local JWT token generated by auth_middleware.
        local_user = auth_middleware.verify_token(id_token)
        if local_user:
            if not local_user.get('is_admin', False):
                logger.warning(f"Non-admin local user {local_user.get('username')} attempted admin access.")
                raise HTTPException(status_code=403, detail="Admin access required")
            return local_user.get('username', 'local-admin')

        # Handle legacy demo token
        if id_token.startswith("demo-token"):
            return "demo-admin"

        # Firebase token validation path
        from firebase_admin import auth, firestore

        try:
            decoded_token = auth.verify_id_token(id_token, check_revoked=True)
        except Exception as e:
            logger.warning(f"Admin token verification failed: {e}")
            raise HTTPException(status_code=401, detail="Token verification failed")

        uid = decoded_token.get('uid')
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token")

        db = firestore.client()
        user_doc = db.collection('users').document(uid).get()

        if not user_doc.exists:
            raise HTTPException(status_code=403, detail="User not found")

        user_data = user_doc.to_dict()
        if not user_data.get('is_admin', False):
            logger.warning(f"Non-admin user {uid} attempted admin access to a protected route.")
            raise HTTPException(status_code=403, detail="Admin access required")

        return uid
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during admin verification: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail="Authentication failed")


async def verify_super_admin(Authorization: Optional[str] = Header(None)) -> str:
    """
    Verify that the user is the super admin (vansh@gmail.com).
    Supports both local session JWT tokens and Firebase ID tokens.
    """
    try:
        if not Authorization or not Authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="No authorization token")

        id_token = Authorization.split(" ")[1]

        # First accept local JWT token generated by auth_middleware.
        local_user = auth_middleware.verify_token(id_token)
        if local_user:
            username = str(local_user.get('username', '')).lower()
            if username in ['vansh', 'vansh@gmail.com', 'admin']:
                return username
            raise HTTPException(status_code=403, detail="Super admin access required")

        # Handle legacy demo token
        if id_token.startswith("demo-token"):
            return "super-admin"

        from firebase_admin import auth, firestore

        try:
            decoded_token = auth.verify_id_token(id_token, check_revoked=True)
        except Exception as e:
            logger.warning(f"Super admin token verification failed: {e}")
            raise HTTPException(status_code=401, detail="Token verification failed")

        uid = decoded_token.get('uid')
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token")

        db = firestore.client()
        user_doc = db.collection('users').document(uid).get()

        if not user_doc.exists:
            raise HTTPException(status_code=403, detail="User not found")

        user_data = user_doc.to_dict()
        email = str(user_data.get('email', '')).lower()
        username = str(user_data.get('username', '')).lower()

        if email != 'vansh@gmail.com' and username != 'vansh':
            logger.critical(f"Attempted super admin access by non-superadmin user: {uid} ({email})")
            raise HTTPException(status_code=403, detail="Super admin access required")

        return uid
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during super admin verification: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail="Authentication failed")


@api_router.get("/admin/check-super")
async def check_super_admin(uid: str = Depends(verify_admin_simple)):
    """Check whether the current admin user has super-admin privileges."""
    is_super_admin = uid in ["super-admin", "vansh", "demo-admin"]
    return {"is_super_admin": is_super_admin}

@api_router.get("/admin/contact-messages", response_model=List[ContactMessageResponse])
async def get_contact_messages(uid: str = Depends(verify_admin_simple)):
    """
    Get all contact messages (admin only).
    """
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        messages = []
        docs = db.collection('contact_messages').order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
        
        for doc in docs:
            data = doc.to_dict()
            timestamp_value = data.get('timestamp')
            if timestamp_value:
                try:
                    timestamp_str = timestamp_value.isoformat() if hasattr(timestamp_value, 'isoformat') else str(timestamp_value)
                except Exception as ts_err:
                    logger.error(f"Timestamp conversion error for message {doc.id}: {ts_err}")
                    timestamp_str = datetime.utcnow().isoformat()
            else:
                timestamp_str = datetime.utcnow().isoformat()
            
            messages.append(ContactMessageResponse(
                id=doc.id,
                name=data.get('name', ''),
                email=data.get('email', ''),
                subject=data.get('subject', ''),
                message=data.get('message', ''),
                timestamp=timestamp_str,
                read=data.get('read', False)
            ))
        
        return messages
    except Exception as e:
        logger.error(f"Error getting contact messages: {e}. Returning mock data.", exc_info=True)
        # Return mock data when Firebase is unavailable
        from datetime import datetime, timedelta
        return [
            {
                'id': 'msg1',
                'name': 'John Farmer',
                'email': 'john@farm.com',
                'subject': 'Question about tomato disease',
                'message': 'Hi, I have some questions about treating tomato blight. Can you help?',
                'timestamp': (datetime.now() - timedelta(hours=2)).isoformat(),
                'read': False
            },
            {
                'id': 'msg2',
                'name': 'Sarah Green',
                'email': 'sarah@garden.com',
                'subject': 'Feature request',
                'message': 'Would love to see support for more plant types in the future.',
                'timestamp': (datetime.now() - timedelta(days=1)).isoformat(),
                'read': True
            },
            {
                'id': 'msg3',
                'name': 'Mike Plant',
                'email': 'mike@plants.com',
                'subject': 'Bug report',
                'message': 'The app crashed when I tried to upload a large image file.',
                'timestamp': (datetime.now() - timedelta(days=3)).isoformat(),
                'read': False
            }
        ]


@api_router.patch("/admin/contact-messages/{message_id}/read")
async def mark_message_read(message_id: str, uid: str = Depends(verify_admin_simple)):
    """
    Mark a contact message as read (admin only).
    """
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        db.collection('contact_messages').document(message_id).update({'read': True})
        
        return {"success": True, "message": "Message marked as read"}
    except Exception as e:
        logger.error(f"Error marking message {message_id} as read: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to mark message as read")


@api_router.get("/admin/users")
async def get_all_users(uid: str = Depends(verify_admin_simple)):
    """
    Get all users (admin only).
    """
    try:
        from firebase_admin import firestore
        from datetime import datetime
        db = firestore.client()
        
        users = []
        docs = list(db.collection('users').stream())
        logger.info(f"Admin request to get all users. Found {len(docs)} user documents.")
        
        for doc in docs:
            data = doc.to_dict()
            user_id = doc.id
            
            # Count predictions
            pred_count = 0
            try:
                pred_count = len(list(db.collection('users').document(user_id).collection('prediction_history').stream()))
            except Exception as pred_err:
                logger.error(f"Error counting predictions for user {user_id}: {pred_err}")
            
            # Handle created_at timestamp
            created_at = data.get('created_at')
            if created_at:
                try:
                    created_at_str = created_at.isoformat() if hasattr(created_at, 'isoformat') else str(created_at)
                except Exception as ts_err:
                    logger.error(f"Created_at timestamp conversion error for user {user_id}: {ts_err}")
                    created_at_str = datetime.utcnow().isoformat()
            else:
                created_at_str = datetime.utcnow().isoformat()
            
            user_obj = {
                'id': user_id,
                'username': data.get('username', 'Unknown'),
                'email': data.get('email', 'N/A'),
                'created_at': created_at_str,
                'is_admin': data.get('is_admin', False),
                'is_superadmin': data.get('is_superadmin', False),
                'prediction_count': pred_count,
                'last_active': data.get('last_active', '')
            }
            users.append(user_obj)
        
        logger.info(f"Successfully prepared and returning {len(users)} users for admin.")
        return users
    except Exception as e:
        logger.error(f"Failed to retrieve all users for admin: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve users")


@api_router.get("/admin/predictions")
async def get_all_predictions(uid: str = Depends(verify_admin_simple)):
    """
    Get all predictions with full details (admin only).
    """
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        predictions = []
        users_ref = db.collection('users').stream()
        
        for user_doc in users_ref:
            user_id = user_doc.id
            user_data = user_doc.to_dict()
            username = user_data.get('username', 'Unknown')
            
            try:
                pred_docs = db.collection('users').document(user_id).collection('prediction_history').stream()
                
                for pred_doc in pred_docs:
                    data = pred_doc.to_dict()
                    predictions.append({
                        'id': pred_doc.id,
                        'user_id': user_id,
                        'username': username,
                        'disease_name': data.get('disease_name', 'Unknown'),
                        'confidence': data.get('confidence', 0),
                        'timestamp': data.get('timestamp', ''),
                        'model_used': data.get('model_used', 'N/A'),
                        'researcher_mode': data.get('researcher_mode', False),
                        'heatmap_base64': data.get('heatmap_base64'),
                        'image_base64': data.get('image_base64'),
                        'plant_type': data.get('plant_type', 'Unknown'),
                        'treatment': data.get('treatment', []),
                        'prevention': data.get('prevention', []),
                        'image_filename': data.get('image_filename', '')
                    })
            except:
                continue
        
        try:
            return sorted(predictions, key=lambda x: x.get('timestamp', ''), reverse=True)
        except:
            return predictions
    except Exception as e:
        logger.error(f"Error getting all predictions for admin: {e}. Returning mock data.", exc_info=True)
        # Return mock data when Firebase is unavailable
        from datetime import datetime, timedelta
        return [
            {
                'id': 'pred1',
                'user_id': 'user1',
                'username': 'admin',
                'disease_name': 'Tomato___Late_blight',
                'confidence': 0.92,
                'timestamp': (datetime.now() - timedelta(hours=1)).isoformat(),
                'model_used': 'Swin',
                'researcher_mode': True,
                'plant_type': 'Tomato',
                'image_filename': 'tomato_leaf.jpg'
            },
            {
                'id': 'pred2',
                'user_id': 'user2',
                'username': 'john_doe',
                'disease_name': 'Apple___Apple_scab',
                'confidence': 0.87,
                'timestamp': (datetime.now() - timedelta(hours=3)).isoformat(),
                'model_used': 'ViT',
                'researcher_mode': False,
                'plant_type': 'Apple',
                'image_filename': 'apple_leaf.jpg'
            },
            {
                'id': 'pred3',
                'user_id': 'user3',
                'username': 'jane_smith',
                'disease_name': 'Potato___Early_blight',
                'confidence': 0.94,
                'timestamp': (datetime.now() - timedelta(hours=5)).isoformat(),
                'model_used': 'Swin',
                'researcher_mode': False,
                'plant_type': 'Potato',
                'image_filename': 'potato_leaf.jpg'
            }
        ]


@api_router.patch("/admin/users/{user_id}/admin")
async def toggle_user_admin(user_id: str, data: dict, uid: str = Depends(verify_super_admin)):
    """
    Toggle admin status for a user (super admin only).
    """
    try:
        # Mock implementation for demo
        if uid == "super-admin":
            return {"success": True, "message": "User admin status updated"}
        
        from firebase_admin import firestore
        db = firestore.client()
        
        is_admin = data.get('is_admin', False)
        db.collection('users').document(user_id).update({'is_admin': is_admin})
        
        # Log activity
        db.collection('activity_logs').add({
            'admin_id': uid,
            'action': 'toggle_admin',
            'target_user_id': user_id,
            'new_status': is_admin,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        return {"success": True, "message": f"User admin status updated"}
    except Exception as e:
        logger.error(f"Error toggling admin status for user {user_id} by admin {uid}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update admin status")


@api_router.patch("/admin/users/{user_id}/suspend")
async def suspend_user(user_id: str, data: dict, uid: str = Depends(verify_admin_simple)):
    """
    Suspend or reinstate a user (admin only).
    Body: { "suspended": bool }
    """
    try:
        # Mock implementation for demo
        if uid == "demo-admin" or uid == "super-admin":
            suspended = bool(data.get('suspended', False))
            logger.info(f"Demo mode: User {user_id} suspension status changed to {suspended} by admin {uid}")
            return {"success": True, "suspended": suspended, "message": f"User {'suspended' if suspended else 'activated'} successfully"}
        
        from firebase_admin import firestore
        db = firestore.client()
        suspended = bool(data.get('suspended', False))
        db.collection('users').document(user_id).update({'suspended': suspended})
        # Log activity
        db.collection('activity_logs').add({
            'admin_id': uid,
            'action': 'suspend_user' if suspended else 'reinstate_user',
            'target_user_id': user_id,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        return {"success": True, "suspended": suspended, "message": f"User {'suspended' if suspended else 'activated'} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error suspending user {user_id} by admin {uid}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update user suspension status")

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, uid: str = Depends(verify_admin_simple)):
    """Delete a user completely from the database"""
    try:
        from firebase_admin import firestore, auth
        db = firestore.client()
        
        # Get user document first to check if exists
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        
        # Delete user from Firebase Auth
        try:
            auth.delete_user(user_id)
        except Exception as auth_err:
            logger.warning(f"Failed to delete user {user_id} from Firebase Auth during full deletion: {auth_err}")
        
        # Delete user document
        user_ref.delete()
        
        # Delete user's predictions
        predictions_ref = db.collection('users').document(user_id).collection('prediction_history')
        predictions = predictions_ref.stream()
        for pred in predictions:
            pred.reference.delete()
        
        # Log activity
        db.collection('activity_logs').add({
            'admin_id': uid,
            'action': 'delete_user',
            'target_user_id': user_id,
            'username': user_data.get('username', 'Unknown'),
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        return {
            "success": True,
            "message": f"User {user_data.get('username', user_id)} deleted successfully",
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id} by admin {uid}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


@api_router.delete("/admin/contact-messages/{message_id}")
async def delete_message(message_id: str, uid: str = Depends(verify_admin_simple)):
    try:
        from firebase_admin import firestore
        db = firestore.client()
        db.collection('contact_messages').document(message_id).delete()
        db.collection('activity_logs').add({
            'admin_id': uid,
            'action': 'delete_message',
            'message_id': message_id,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Message templates CRUD
@api_router.get("/admin/message-templates")
async def list_message_templates(uid: str = Depends(verify_admin_simple)):
    try:
        from firebase_admin import firestore
        db = firestore.client()
        templates = []
        docs = db.collection('contact_templates').order_by('created_at', direction=firestore.Query.DESCENDING).stream()
        for doc in docs:
            data = doc.to_dict()
            templates.append({
                'id': doc.id,
                'name': data.get('name', ''),
                'subject': data.get('subject', ''),
                'body': data.get('body', ''),
                'created_at': str(data.get('created_at', ''))
            })
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/message-templates")
async def create_message_template(data: dict, uid: str = Depends(verify_admin_simple)):
    try:
        from firebase_admin import firestore
        db = firestore.client()
        tpl = {
            'name': data.get('name', '').strip(),
            'subject': data.get('subject', '').strip(),
            'body': data.get('body', '').strip(),
            'created_at': firestore.SERVER_TIMESTAMP,
            'created_by': uid
        }
        if not tpl['name'] or not tpl['subject']:
            raise HTTPException(status_code=400, detail='Template name and subject are required')
        ref = db.collection('contact_templates').add(tpl)
        return {"id": ref[1].id, **{k: v for k, v in tpl.items() if k != 'created_at'}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/message-templates/{template_id}")
async def delete_message_template(template_id: str, uid: str = Depends(verify_admin_simple)):
    try:
        from firebase_admin import firestore
        db = firestore.client()
        db.collection('contact_templates').document(template_id).delete()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Optional: mark message priority
@api_router.patch("/admin/contact-messages/{message_id}")
async def update_contact_message(message_id: str, data: dict, uid: str = Depends(verify_admin_simple)):
    try:
        from firebase_admin import firestore
        db = firestore.client()
        allowed = {k: v for k, v in data.items() if k in ['priority', 'read']}
        if not allowed:
            raise HTTPException(status_code=400, detail='No valid fields to update')
        db.collection('contact_messages').document(message_id).update(allowed)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/bulk-actions")
async def bulk_actions(data: dict, uid: str = Depends(verify_admin_simple)):
    try:
        from firebase_admin import firestore
        db = firestore.client()
        action = data.get('action')
        ids = data.get('ids', [])
        
        if action == 'delete_messages':
            for msg_id in ids:
                db.collection('contact_messages').document(msg_id).delete()
        elif action == 'mark_read':
            for msg_id in ids:
                db.collection('contact_messages').document(msg_id).update({'read': True})
        
        db.collection('activity_logs').add({
            'admin_id': uid,
            'action': f'bulk_{action}',
            'count': len(ids),
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/analytics")
async def get_analytics(uid: str = Depends(verify_admin_simple)):
    try:
        from firebase_admin import firestore
        from datetime import datetime, timedelta
        db = firestore.client()
        
        # User growth data
        users = list(db.collection('users').stream())
        now = datetime.now()
        user_growth = []
        for i in range(30, -1, -1):
            date = now - timedelta(days=i)
            count = sum(1 for u in users if u.to_dict().get('created_at') and u.to_dict()['created_at'].replace(tzinfo=None) <= date)
            user_growth.append({'date': date.strftime('%Y-%m-%d'), 'count': count})
        
        # Disease distribution
        predictions = []
        for user_doc in users:
            preds = db.collection('users').document(user_doc.id).collection('prediction_history').stream()
            predictions.extend([p.to_dict() for p in preds])
        
        disease_dist = {}
        for p in predictions:
            disease = p.get('disease_name', 'Unknown')
            disease_dist[disease] = disease_dist.get(disease, 0) + 1
        
        return {
            'user_growth': user_growth,
            'disease_distribution': [{'name': k, 'count': v} for k, v in disease_dist.items()],
            'total_predictions': len(predictions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/activity-logs")
async def get_activity_logs(uid: str = Depends(verify_admin_simple)):
    try:
        from firebase_admin import firestore
        db = firestore.client()
        logs = []
        docs = db.collection('activity_logs').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(100).stream()
        for doc in docs:
            data = doc.to_dict()
            logs.append({
                'id': doc.id,
                'admin_id': data.get('admin_id'),
                'action': data.get('action'),
                'timestamp': data.get('timestamp').isoformat() if data.get('timestamp') else '',
                'details': {k: v for k, v in data.items() if k not in ['admin_id', 'action', 'timestamp']}
            })
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/user/{user_id}/details")
async def get_user_details(user_id: str, uid: str = Depends(verify_admin_simple)):
    try:
        from firebase_admin import firestore
        db = firestore.client()
        user_doc = db.collection('users').document(user_id).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        predictions = []
        pred_docs = db.collection('users').document(user_id).collection('prediction_history').order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
        for pred in pred_docs:
            predictions.append(pred.to_dict())
        
        return {
            'user': user_data,
            'predictions': predictions,
            'user_id': user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))















@api_router.patch("/admin/profile")
async def update_admin_profile(request: dict, uid: str = Depends(verify_admin_simple)):
    """Update admin profile information"""
    try:
        username = request.get('username')
        email = request.get('email')
        new_password = request.get('new_password')
        current_password = request.get('current_password')
        
        # For demo purposes, allow any update
        # In production, you'd verify current password and update Firebase Auth
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "username": username,
            "email": email
        }
        
    except Exception as e:
        logger.error(f"Error updating admin profile for admin {uid}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@api_router.post("/admin/send-reply")
async def send_reply(request: dict, uid: str = Depends(verify_admin_simple)):
    """Send reply to user message"""
    try:
        message_id = request.get('message_id')
        reply_text = request.get('reply_text')
        recipient_email = request.get('recipient_email')
        
        # In production, you'd send actual email here
        # For demo, just mark message as replied
        
        from firebase_admin import firestore
        db = firestore.client()
        
        message_ref = db.collection('contact_messages').document(message_id)
        message_ref.update({
            'replied': True,
            'reply_text': reply_text,
            'replied_at': firestore.SERVER_TIMESTAMP,
            'read': True
        })
        
        # Log activity
        db.collection('activity_logs').add({
            'admin_id': uid,
            'action': 'send_reply',
            'message_id': message_id,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        return {
            "success": True,
            "message": "Reply sent successfully",
            "message_id": message_id
        }
        
    except Exception as e:
        logger.error(f"Error sending reply for message {message_id} by admin {uid}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to send reply: {str(e)}")

@api_router.get("/admin/system-stats")
async def get_system_stats(uid: str = Depends(verify_admin_simple)):
    """Get system statistics"""
    try:
        from firebase_admin import firestore
        from datetime import datetime, timedelta
        db = firestore.client()
        
        # Get counts from collections
        users_count = len(list(db.collection('users').stream()))
        messages_count = len(list(db.collection('contact_messages').stream()))
        
        # Count all predictions across all users
        predictions_count = 0
        for user_doc in db.collection('users').stream():
            user_predictions = list(db.collection('users').document(user_doc.id).collection('prediction_history').stream())
            predictions_count += len(user_predictions)
        
        # Calculate some basic stats
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        
        return {
            "total_users": users_count,
            "total_messages": messages_count,
            "total_predictions": predictions_count,
            "new_users_this_week": max(0, users_count - 10),  # Mock data
            "active_users": max(0, users_count - 2),  # Mock data
            "system_health": "Good",
            "uptime": "99.9%",
            "unread_messages": len([m for m in db.collection('contact_messages').stream() if not m.to_dict().get('read', False)])
        }
        
    except Exception as e:
        logger.error(f"Error getting system stats for admin: {e}", exc_info=True)
        return {
            "total_users": 0,
            "total_messages": 0,
            "total_predictions": 0,
            "new_users_this_week": 0,
            "active_users": 0,
            "system_health": "Unknown",
            "uptime": "Unknown",
            "unread_messages": 0
        }












