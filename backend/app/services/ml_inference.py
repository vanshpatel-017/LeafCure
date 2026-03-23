import os
import torch
import torch.nn as nn
import timm
from PIL import Image
import torchvision.transforms as transforms
import io
import json
import cv2
import numpy as np
import base64

# Suppress torch compilation errors on Windows
try:
    import torch._dynamo
    torch._dynamo.config.suppress_errors = True
except:
    pass
from app.core.config import (
    VIT_WEIGHTS_PATH, SWIN_WEIGHTS_PATH,
    VIT_MODEL_NAME, SWIN_MODEL_NAME, NUM_CLASSES, CLASS_NAMES, DEVICE
)
from app.services.disease_service import get_disease_info
from app.core.auth_utils import validate_confidence_score
from app.middleware.rate_limiter import validate_image_file

# Global model instances
VIT_MODEL = None
SWIN_MODEL = None
KNOWLEDGE_BASE = {}

def remove_module_prefix(state_dict):
    """Remove 'module.' prefix from DataParallel model keys"""
    new_state_dict = {}
    for key, value in state_dict.items():
        if key.startswith('module.'):
            new_key = key[7:]  # Remove 'module.' prefix
            new_state_dict[new_key] = value
        else:
            new_state_dict[key] = value
    return new_state_dict

def load_models():
    """Load ViT and Swin Transformer models"""
    global VIT_MODEL, SWIN_MODEL, KNOWLEDGE_BASE
    
    try:
        print(f"[INFO] Loading models on device: {DEVICE}")
        print(f"[INFO] ViT weights path: {VIT_WEIGHTS_PATH}")
        print(f"[INFO] Swin weights path: {SWIN_WEIGHTS_PATH}")
        
        # Check if model files exist
        if not os.path.exists(VIT_WEIGHTS_PATH):
            print(f"[ERROR] ViT model file not found: {VIT_WEIGHTS_PATH}")
            return False
        if not os.path.exists(SWIN_WEIGHTS_PATH):
            print(f"[ERROR] Swin model file not found: {SWIN_WEIGHTS_PATH}")
            return False
        
        # Load ViT model
        print(f"[INFO] Loading ViT model...")
        vit_model = timm.create_model(VIT_MODEL_NAME, pretrained=False, num_classes=NUM_CLASSES)
        vit_state_dict = torch.load(VIT_WEIGHTS_PATH, map_location=DEVICE, weights_only=True)
        vit_state_dict = remove_module_prefix(vit_state_dict)
        vit_model.load_state_dict(vit_state_dict)
        vit_model.to(DEVICE)
        vit_model.eval()
        VIT_MODEL = vit_model
        print(f"[SUCCESS] ViT model loaded")
        
        # Load Swin model
        print(f"[INFO] Loading Swin model...")
        swin_model = timm.create_model(SWIN_MODEL_NAME, pretrained=False, num_classes=NUM_CLASSES)
        swin_state_dict = torch.load(SWIN_WEIGHTS_PATH, map_location=DEVICE, weights_only=True)
        swin_state_dict = remove_module_prefix(swin_state_dict)
        swin_model.load_state_dict(swin_state_dict)
        swin_model.to(DEVICE)
        swin_model.eval()
        SWIN_MODEL = swin_model
        print(f"[SUCCESS] Swin model loaded")
        
        print(f"[SUCCESS] All models loaded successfully")
        return True
            
    except Exception as e:
        print(f"[ERROR] Error loading models: {e}")
        import traceback
        traceback.print_exc()
        return False

def preprocess_image(image_bytes):
    """Preprocess image for model input with validation"""
    try:
        # Validate image file
        validate_image_file(image_bytes)
        
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        tensor = transform(image).unsqueeze(0).to(DEVICE)
        return tensor
        
    except Exception as e:
        raise ValueError(f"Failed to preprocess image: {e}")

def _normalize_plant_name(name: str) -> str:
    return ''.join(ch.lower() for ch in str(name) if ch.isalnum())

def run_inference(model, input_tensor, plant_type_filter=None):
    """Run inference on a single model with optional plant type filtering"""
    try:
        model.eval()
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)

            if plant_type_filter:
                normalized_filter = _normalize_plant_name(plant_type_filter)
                print(f"Applying plant type filter: {plant_type_filter} ({normalized_filter})")

                plant_mask = torch.zeros_like(probabilities)
                match_count = 0
                for idx, class_name in enumerate(CLASS_NAMES):
                    class_plant = class_name.split('___')[0]
                    normalized_class_plant = _normalize_plant_name(class_plant)
                    if (
                        normalized_filter in normalized_class_plant
                        or normalized_class_plant in normalized_filter
                    ):
                        plant_mask[0, idx] = 1.0
                        match_count += 1

                if match_count > 0:
                    filtered_probs = probabilities * plant_mask
                    filtered_sum = filtered_probs.sum()
                    if filtered_sum.item() > 0:
                        probabilities = filtered_probs / filtered_sum
                    print(f"Plant filter applied - {match_count} matching classes")
                else:
                    print(f"No classes match plant type '{plant_type_filter}', using all classes")

            confidence, predicted_idx = torch.max(probabilities, 1)
            idx = predicted_idx.item()
            predicted_class = CLASS_NAMES[idx] if idx < len(CLASS_NAMES) else f"Unknown_class_{idx}"
            confidence_score = max(0.0, min(1.0, float(confidence.item())))
            return predicted_class, confidence_score

    except Exception as e:
        raise RuntimeError(f"Inference failed: {e}")

def generate_gradcam(model, input_tensor, target_class_idx):
    """Generate Grad-CAM heatmap for Swin Transformer"""
    try:
        # Validate target class index
        if target_class_idx < 0 or target_class_idx >= NUM_CLASSES:
            print(f"Invalid target class index: {target_class_idx}")
            return None
        
        # Hook to capture feature maps and gradients
        features = []
        gradients = []
        
        def forward_hook(module, input, output):
            features.append(output)
        
        def backward_hook(module, grad_input, grad_output):
            gradients.append(grad_output[0])
        
        # Register hooks on the last layer before classification head
        # For Swin, hook the last norm layer
        target_layer = model.norm
        forward_handle = target_layer.register_forward_hook(forward_hook)
        backward_handle = target_layer.register_full_backward_hook(backward_hook)
        
        # Forward pass
        model.zero_grad()
        output = model(input_tensor)
        
        # Backward pass for target class
        target = output[0, target_class_idx]
        target.backward()
        
        # Remove hooks
        forward_handle.remove()
        backward_handle.remove()
        
        # Get feature maps and gradients
        feature_map = features[0].detach().cpu()
        gradient = gradients[0].detach().cpu()
        
        # Global average pooling of gradients
        weights = torch.mean(gradient, dim=(2, 3), keepdim=True)
        
        # Weighted combination of feature maps
        cam = torch.sum(weights * feature_map, dim=1, keepdim=True)
        cam = torch.relu(cam)
        
        # Normalize
        cam = cam.squeeze().numpy()
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max > cam_min:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)
        
        # Resize to input image size
        cam = cv2.resize(cam, (224, 224))
        
        return cam
        
    except Exception as e:
        print(f"Grad-CAM generation failed: {e}")
        return None

def create_heatmap_overlay(original_image_bytes, cam, alpha=0.4):
    """Create heatmap overlay on original image"""
    try:
        # Load original image
        image = Image.open(io.BytesIO(original_image_bytes))
        image = image.convert('RGB')
        image = image.resize((224, 224))
        image_np = np.array(image)
        
        # Apply colormap to CAM
        heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Overlay heatmap on image
        overlay = cv2.addWeighted(image_np, 1 - alpha, heatmap, alpha, 0)
        
        # Convert to base64
        _, buffer = cv2.imencode('.png', cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return img_base64
        
    except Exception as e:
        print(f"Heatmap overlay creation failed: {e}")
        return None

def get_knowledge_base_entry(disease_name):
    """Get treatment and prevention info from Firebase or fallback to local KB"""
    # Try Firebase first
    firebase_info = get_disease_info(disease_name)
    
    print(f"KB: Checking for {disease_name}")
    
    if firebase_info:
        print(f"KB: Firebase data found for {disease_name}:")
        print(f"    Treatment: {firebase_info.get('treatment', [])}")
        print(f"    Prevention: {firebase_info.get('prevention', [])}")
        return firebase_info
    
    # Only return minimal default if Firebase has no data
    plant_type = "Unknown"
    if '___' in disease_name:
        plant_type = disease_name.split('___')[0].replace('_', ' ').title()
    
    default_result = {
        "plant_type": plant_type,
        "disease_name": disease_name.replace('___', ' - ').replace('_', ' ').title(),
        "description": "Disease information not available in database",
        "treatment": [],
        "prevention": []
    }
    
    print(f"KB: No Firebase data found for {disease_name}, returning empty arrays")
    return default_result

