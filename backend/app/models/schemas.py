from typing import List, Optional, Union, Any
from pydantic import BaseModel

# --- 1. CORE API RESPONSE MODEL ---
class DiagnosisResult(BaseModel):
    """
    The structured response returned by the /predict endpoint upon success.
    """
    model_config = {'protected_namespaces': ()}
    
    success: bool
    disease_name: str
    confidence: float
    plant_type: str
    treatment: Union[List[str], List[Any]]  # Can be simple strings or complex objects
    treatments: Optional[Union[List[str], List[Any]]] = None  # Firebase treatments data
    prevention: List[str]
    symptoms: Optional[str] = None  # Disease symptoms
    causes: Optional[str] = None    # Disease causes
    heatmap_base64: Optional[str] = None  # Placeholder for Grad-CAM output
    model_used: Optional[str] = None      # 'ViT' or 'Swin' (or None if unauthenticated)
    vit_confidence: Optional[float] = None # ViT model confidence score
    swin_confidence: Optional[float] = None # Swin model confidence score
    vit_prediction: Optional[str] = None  # ViT prediction class name
    swin_prediction: Optional[str] = None # Swin prediction class name
    # Treatment and prevention for both models
    vit_treatment: Optional[Union[List[str], List[Any]]] = None
    vit_prevention: Optional[List[str]] = None
    swin_treatment: Optional[Union[List[str], List[Any]]] = None
    swin_prevention: Optional[List[str]] = None
    # Symptoms and causes for both models
    vit_symptoms: Optional[str] = None
    vit_causes: Optional[str] = None
    swin_symptoms: Optional[str] = None
    swin_causes: Optional[str] = None

# --- 2. HISTORY DATA MODELS ---

class HistoryStore(BaseModel):
    """
    Schema for data stored in the Firestore 'prediction_history' subcollection.
    This is what the backend SAVES after a successful prediction.
    """
    model_config = {'protected_namespaces': ()}
    
    disease_name: str
    confidence: float
    timestamp: str # Stored as ISO 8601 string or Firestore timestamp object
    image_filename: str # Reference to the original filename (or storage URL if saved)
    model_used: str

class HistoryItem(BaseModel):
    """
    Schema for history items returned to the Frontend via the /history endpoint.
    """
    disease_name: str
    confidence: float
    timestamp: str
    image_filename: str
    
# --- 3. (Optional) User Detail Schemas ---
# While Firebase Auth handles credentials, we need a way to read/store optional user details.

class UserDetail(BaseModel):
    """
    Schema for saving/retrieving non-authentication user data from Firestore.
    """
    username: str
    email: str
    # Add other required fields here
    profile_picture_url: Optional[str] = None

# --- 4. AUTHENTICATION SCHEMAS ---

class UserLogin(BaseModel):
    """
    Schema for user login request.
    """
    login_identifier: str
    password: str

class UserRegister(BaseModel):
    """
    Schema for user registration request.
    """
    username: str
    email: str
    password: str

class AuthResponse(BaseModel):
    """
    Schema for authentication response.
    """
    success: bool
    message: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    token: Optional[str] = None
    is_admin: Optional[bool] = False

# --- 5. CONTACT MESSAGE SCHEMAS ---

class ContactMessage(BaseModel):
    """
    Schema for contact form submission.
    """
    name: str
    email: str
    subject: str
    message: str

class ContactMessageResponse(BaseModel):
    """
    Schema for contact message stored in Firestore.
    """
    id: str
    name: str
    email: str
    subject: str
    message: str
    timestamp: str
    read: bool = False