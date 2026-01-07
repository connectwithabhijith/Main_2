"""
Flask ML API for Waste Classification
Run with: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

# Model configuration
MODEL_PATH = os.environ.get('MODEL_PATH', 'model/waste_classifier.keras')
IMG_SIZE = (224, 224)
CLASS_NAMES = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']

# Load model
model = None

def load_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = keras.models.load_model(MODEL_PATH)
            print(f"Model loaded successfully from {MODEL_PATH}")
        else:
            print(f"Warning: Model file not found at {MODEL_PATH}")
            print("API will run in demo mode with random predictions")
    except Exception as e:
        print(f"Error loading model: {e}")
        print("API will run in demo mode with random predictions")

def preprocess_image(image_bytes):
    """Preprocess image for model prediction"""
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert('RGB')
    img = img.resize(IMG_SIZE)
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

def predict_waste(image_bytes):
    """Make prediction on waste image"""
    global model
    
    img_array = preprocess_image(image_bytes)
    
    if model is not None:
        # Real model prediction
        predictions = model.predict(img_array, verbose=0)
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx])
        predicted_class = CLASS_NAMES[predicted_idx]
        
        # Get all predictions with confidence scores
        all_predictions = [
            {"class": CLASS_NAMES[i], "confidence": float(predictions[0][i])}
            for i in range(len(CLASS_NAMES))
        ]
        all_predictions.sort(key=lambda x: x["confidence"], reverse=True)
    else:
        # Demo mode - generate realistic random predictions
        np.random.seed(hash(image_bytes[:100]) % 2**32)
        probs = np.random.dirichlet(np.ones(len(CLASS_NAMES)) * 0.5)
        predicted_idx = np.argmax(probs)
        confidence = float(probs[predicted_idx])
        predicted_class = CLASS_NAMES[predicted_idx]
        
        all_predictions = [
            {"class": CLASS_NAMES[i], "confidence": float(probs[i])}
            for i in range(len(CLASS_NAMES))
        ]
        all_predictions.sort(key=lambda x: x["confidence"], reverse=True)
    
    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "all_predictions": all_predictions
    }

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "classes": CLASS_NAMES
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict waste category from uploaded image"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Read and validate image
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        ext = file.filename.rsplit('.', 1)[-1].lower()
        
        if ext not in allowed_extensions:
            return jsonify({"error": f"Invalid file type. Allowed: {allowed_extensions}"}), 400
        
        image_bytes = file.read()
        
        # Make prediction
        result = predict_waste(image_bytes)
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    """API info endpoint"""
    return jsonify({
        "name": "Waste Classification ML API",
        "version": "1.0.0",
        "endpoints": {
            "/": "API info",
            "/health": "Health check",
            "/predict": "POST - Upload image for classification"
        },
        "classes": CLASS_NAMES,
        "model_loaded": model is not None
    })

if __name__ == '__main__':
    load_model()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    print(f"\n🚀 Waste Classification API running on http://localhost:{port}")
    print(f"📊 Classes: {CLASS_NAMES}")
    print(f"🔧 Debug mode: {debug}\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
