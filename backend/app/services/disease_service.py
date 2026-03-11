import firebase_admin
from firebase_admin import firestore
from app.core.auth_utils import validate_confidence_score
import logging

logger = logging.getLogger(__name__)

def normalize_prediction_to_db_key(prediction: str) -> str:
    """Convert model prediction format to database key format"""
    # Convert from 'Apple___Apple_scab' to 'apple_apple_scab'
    # Handle special cases like 'Pepper,_bell___healthy' -> 'pepper_healthy'
    
    # Remove commas and extra spaces
    normalized = prediction.replace(',', '').replace(' ', '_')
    
    # Convert triple underscores to single underscore
    normalized = normalized.replace('___', '_')
    
    # Convert to lowercase
    normalized = normalized.lower()
    
    # Handle specific plant type variations
    plant_replacements = {
        'pepper_bell_': 'pepper_',  # Pepper,_bell -> pepper
        'cherry_(including_sour)_': 'cherry_',  # Cherry_(including_sour) -> cherry
        'corn_(maize)_': 'corn_',  # Corn_(maize) -> corn
    }
    
    for old, new in plant_replacements.items():
        normalized = normalized.replace(old, new)
    
    # Clean up specific disease name patterns
    disease_replacements = {
        'cercospora_leaf_spot_gray_leaf_spot': 'gray_leaf_spot',
        'common_rust_': 'common_rust',
        'northern_leaf_blight': 'northern_leaf_blight',
        'esca_(black_measles)': 'esca_black_measles',
        'leaf_blight_(isariopsis_leaf_spot)': 'leaf_blight',
        'haunglongbing_(citrus_greening)': 'haunglongbing',
        'spider_mites_two-spotted_spider_mite': 'spider_mites',
        'tomato_yellow_leaf_curl_virus': 'yellow_leaf_curl_virus',
        'two-spotted': 'two_spotted'
    }
    
    for old, new in disease_replacements.items():
        normalized = normalized.replace(old, new)
    
    return normalized

def get_disease_info(disease_name: str) -> dict:
    try:
        print(f"Disease Service: Looking for {disease_name} in Firebase")
        
        # Get Firestore client
        db = firestore.client()
        
        # Try exact match first
        doc_ref = db.collection('plantDiseases').document(disease_name)
        doc = doc_ref.get()
        
        if doc.exists:
            result = doc.to_dict()
            print(f"Disease Service: Found exact match - treatments: {len(result.get('treatment', []))}, prevention: {len(result.get('prevention', []))}")
            return result
        
        # Try normalized version (ML output format to Firestore format)
        normalized_name = normalize_prediction_to_db_key(disease_name)
        print(f"Disease Service: Trying normalized key: {normalized_name}")
        
        doc_ref = db.collection('plantDiseases').document(normalized_name)
        doc = doc_ref.get()
        
        if doc.exists:
            result = doc.to_dict()
            print(f"Disease Service: Found normalized match ({normalized_name}) - treatments: {len(result.get('treatment', []))}, prevention: {len(result.get('prevention', []))}")
            return result
        
        # Try searching by class_name field
        query = db.collection('plantDiseases').where('class_name', '==', disease_name).limit(1)
        docs = list(query.stream())
        
        if docs:
            result = docs[0].to_dict()
            print(f"Disease Service: Found by class_name - treatments: {len(result.get('treatment', []))}, prevention: {len(result.get('prevention', []))}")
            return result
        
        # Try searching by normalized class_name
        query = db.collection('plantDiseases').where('class_name', '==', normalized_name).limit(1)
        docs = list(query.stream())
        
        if docs:
            result = docs[0].to_dict()
            print(f"Disease Service: Found by normalized class_name - treatments: {len(result.get('treatment', []))}, prevention: {len(result.get('prevention', []))}")
            return result
        
        # List some documents to debug
        all_docs = db.collection('plantDiseases').limit(5).stream()
        print(f"Disease Service: Available documents (first 5):")
        for doc in all_docs:
            print(f"  - {doc.id}")
        
        print(f"Disease Service: No data found for {disease_name} or {normalized_name}")
        return {}
            
    except Exception as e:
        print(f"Disease Service: Error loading disease info: {e}")
        import traceback
        traceback.print_exc()
        return {}

def add_disease_info(disease_name: str, disease_data: dict):
    """Add disease information to Firebase Firestore"""
    try:
        db = firestore.client()
        
        doc_ref = db.collection('plantDiseases').document(disease_name)
        doc_ref.set(disease_data)
        print(f"Disease added to Firebase: {disease_name}")
        
    except Exception as e:
        print(f"Error saving disease info to Firebase: {e}")