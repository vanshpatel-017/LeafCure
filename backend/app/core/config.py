import os
import torch
from typing import List

# --- BASE CONFIGURATION ---
# Determine the device for PyTorch (GPU if available, otherwise CPU)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# --- FILE PATHS (Relative to the 'backend/' directory for consistency) ---
# NOTE: Ensure these paths accurately reflect your file system!
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ML Model Paths
VIT_WEIGHTS_PATH = os.path.join(BASE_DIR, "assets", "vit_model.pth")
SWIN_WEIGHTS_PATH = os.path.join(BASE_DIR, "assets", "swin_model.pth")

# Data Paths - Now using Firebase instead of local JSON
# KNOWLEDGE_BASE_PATH removed - using Firebase Firestore

# Firebase Service Account Path (used for authentication and database access)
FIREBASE_SERVICE_ACCOUNT_PATH = os.path.join(BASE_DIR, "service-account.json")
print(f"[CONFIG] Firebase service account path: {FIREBASE_SERVICE_ACCOUNT_PATH}")
print(f"[CONFIG] Service account exists: {os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH)}")

# --- BACKWARD COMPATIBILITY ---
# For imports that expect 'settings'
class Settings:
    def __init__(self):
        self.device = DEVICE
        self.vit_weights_path = VIT_WEIGHTS_PATH
        self.swin_weights_path = SWIN_WEIGHTS_PATH
        self.firebase_service_account_path = FIREBASE_SERVICE_ACCOUNT_PATH

settings = Settings()


# --- MODEL METADATA ---
# Model names used by the 'timm' library
VIT_MODEL_NAME = "vit_tiny_patch16_224"
SWIN_MODEL_NAME = "swin_tiny_patch4_window7_224"
NUM_CLASSES = 38
ACCEPTED_IMAGE_SIZE = 224 # (Height and Width)


# --- CLASS NAMES (38 Total) ---
CLASS_NAMES: List[str] = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 
    'Apple___healthy', 'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 
    'Cherry_(including_sour)___healthy', 'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 
    'Corn_(maize)___Common_rust_', 'Corn_(maize)___Northern_Leaf_Blight', 
    'Corn_(maize)___healthy', 'Grape___Black_rot', 'Grape___Esca_(Black_Measles)', 
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy', 
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 
    'Peach___healthy', 'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 
    'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy', 
    'Raspberry___healthy', 'Soybean___healthy', 'Squash___Powdery_mildew', 
    'Strawberry___Leaf_scorch', 'Strawberry___healthy', 'Tomato___Bacterial_spot', 
    'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold', 
    'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite', 
    'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 
    'Tomato___Tomato_mosaic_virus', 'Tomato___healthy'
]

# --- FIREBASE CONFIGURATION ---
FIREBASE_HISTORY_COLLECTION = "users"
FIREBASE_HISTORY_SUBCOLLECTION = "prediction_history"
# Read sensitive values from environment variables
FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY", "your_firebase_web_api_key_here")