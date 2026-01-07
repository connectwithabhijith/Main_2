# Waste Classification ML API

Flask API for waste image classification using TensorFlow/Keras.

## Setup

### 1. Create virtual environment
```bash
cd ml-api
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Add your model (optional)
Place your trained model file at:
```
ml-api/model/waste_classifier.h5
```

**Note:** If no model is found, the API runs in **demo mode** with simulated predictions.

### 4. Run the API
```bash
python app.py
```

API will be available at `http://localhost:5000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/health` | GET | Health check |
| `/predict` | POST | Upload image for classification |

## Usage Example

### cURL
```bash
curl -X POST -F "file=@your_image.jpg" http://localhost:5000/predict
```

### Python
```python
import requests

with open('image.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:5000/predict',
        files={'file': f}
    )
print(response.json())
```

## Response Format

```json
{
  "predicted_class": "plastic",
  "confidence": 0.92,
  "all_predictions": [
    {"class": "plastic", "confidence": 0.92},
    {"class": "trash", "confidence": 0.04},
    {"class": "metal", "confidence": 0.02},
    {"class": "glass", "confidence": 0.01},
    {"class": "paper", "confidence": 0.005},
    {"class": "cardboard", "confidence": 0.005}
  ]
}
```

## Classes

- `cardboard`
- `glass`
- `metal`
- `paper`
- `plastic`
- `trash`

## Training Your Own Model

To train a custom model, use a CNN architecture like:
- ResNet50
- MobileNetV2
- EfficientNet

Train on the [TrashNet dataset](https://github.com/garythung/trashnet) or similar waste classification datasets.

Save as `.h5` format and place in `model/waste_classifier.h5`.
