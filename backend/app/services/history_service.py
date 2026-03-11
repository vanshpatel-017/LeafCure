import os
from firebase_admin import firestore
from app.models.schemas import HistoryStore, HistoryItem
from typing import List
from datetime import datetime

def log_prediction_history(uid: str, log_data: HistoryStore, researcher_mode: bool = False, heatmap: str = None, plant_type: str = None, treatment: list = None, prevention: list = None, image_base64: str = None):
    """Log prediction history to Firestore with full details including image"""
    try:
        db = firestore.client()
        
        # Add to user's prediction history subcollection with enhanced metadata
        history_ref = db.collection('users').document(uid).collection('prediction_history')
        history_doc = {
            'disease_name': log_data.disease_name,
            'confidence': log_data.confidence,
            'timestamp': log_data.timestamp,
            'image_filename': log_data.image_filename,
            'model_used': log_data.model_used,
            'researcher_mode': researcher_mode,
            'heatmap_base64': heatmap,
            'image_base64': image_base64,
            'plant_type': plant_type,
            'treatment': treatment or [],
            'prevention': prevention or [],
            'created_at': firestore.SERVER_TIMESTAMP,
            'session_id': f"{uid}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
        
        # Add to both user's history and global analytics
        history_ref.add(history_doc)
        
        # Also add to global analytics collection (anonymized)
        analytics_ref = db.collection('analytics').document('predictions')
        analytics_ref.collection('daily').add({
            'disease_name': log_data.disease_name,
            'confidence': log_data.confidence,
            'model_used': log_data.model_used,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        print(f"Logged history for user {uid}: {log_data.disease_name}")
        
    except Exception as e:
        print(f"Failed to log history: {e}")
        raise

def get_user_history(uid: str) -> List[HistoryItem]:
    """Get user's prediction history from Firestore"""
    try:
        db = firestore.client()
        
        # Get user's prediction history
        history_ref = db.collection('users').document(uid).collection('prediction_history')
        docs = history_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(50).stream()
        
        history_items = []
        for doc in docs:
            data = doc.to_dict()
            history_items.append(HistoryItem(
                disease_name=data.get('disease_name', ''),
                confidence=data.get('confidence', 0.0),
                timestamp=data.get('timestamp', ''),
                image_filename=data.get('image_filename', '')
            ))
        
        return history_items
        
    except Exception as e:
        print(f"Failed to get history: {e}")
        return []