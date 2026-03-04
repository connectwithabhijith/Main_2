"""
EcoSwap ML API
- Waste classification (existing)
- LightGBM-based ad recommendation (new)

Run: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import re, os, pickle
from datetime import datetime

# ── optional tensorflow (only for waste classifier) ─────────────────────────
try:
    import tensorflow as tf
    from tensorflow import keras
    from PIL import Image
    import io
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

import lightgbm as lgb

app = Flask(__name__)
CORS(app)

# ─── paths ───────────────────────────────────────────────────────────────────
MODEL_DIR          = os.path.join(os.path.dirname(__file__), "model")
WASTE_MODEL_PATH   = os.environ.get("MODEL_PATH", os.path.join(MODEL_DIR, "waste_classifier.keras"))
LGBM_MODEL_PATH    = os.path.join(MODEL_DIR, "lgbm_recommendation.txt")

IMG_SIZE     = (224, 224)
CLASS_NAMES  = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]

waste_model = None

# ─── waste classifier helpers ────────────────────────────────────────────────

def load_waste_model():
    global waste_model
    if not TF_AVAILABLE:
        return
    try:
        if os.path.exists(WASTE_MODEL_PATH):
            waste_model = keras.models.load_model(WASTE_MODEL_PATH)
            print(f"Waste model loaded from {WASTE_MODEL_PATH}")
        else:
            print(f"Waste model not found at {WASTE_MODEL_PATH} - demo mode")
    except Exception as e:
        print(f"Waste model load error: {e}")


def predict_waste(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(IMG_SIZE)
    arr = np.expand_dims(np.array(img) / 255.0, 0)
    if waste_model:
        preds = waste_model.predict(arr, verbose=0)[0]
    else:
        np.random.seed(hash(image_bytes[:100]) % 2**32)
        preds = np.random.dirichlet(np.ones(len(CLASS_NAMES)) * 0.5)
    idx = int(np.argmax(preds))
    all_preds = sorted(
        [{"class": CLASS_NAMES[i], "confidence": float(preds[i])} for i in range(len(CLASS_NAMES))],
        key=lambda x: x["confidence"], reverse=True
    )
    return {"predicted_class": CLASS_NAMES[idx], "confidence": float(preds[idx]), "all_predictions": all_preds}

# ─── LightGBM helpers ────────────────────────────────────────────────────────

def load_lgbm():
    if os.path.exists(LGBM_MODEL_PATH):
        return lgb.Booster(model_file=LGBM_MODEL_PATH)
    return None


def tokenize(text):
    if not text:
        return []
    return re.sub(r"[^a-z0-9 ]", " ", text.lower()).split()


def rule_score(query_terms, ad):
    title = tokenize(ad.get("title", ""))
    cat   = tokenize(ad.get("category", ""))
    desc  = tokenize(ad.get("description", ""))
    score = 0
    for t in query_terms:
        if t in title: score += 40
        if t in cat:   score += 30
        if t in desc:  score += 10
    return min(score, 100)


def build_features(search_history, ad):
    """
    6 features (must match train_model.py):
      0  search_count
      1  matched_term_count
      2  title_match_score
      3  category_match_score
      4  ad_age_days
      5  search_frequency   (0-1)
    """
    if not search_history:
        return [0, 0, 0, 0, 30, 0.0]

    term_freq = {}
    for item in search_history:
        cnt = item.get("count", 1)
        for t in tokenize(item.get("query", "")):
            term_freq[t] = term_freq.get(t, 0) + cnt

    search_count = len(search_history)
    top_count    = max(item.get("count", 1) for item in search_history)
    max_freq     = max(term_freq.values()) if term_freq else 1
    norm_freq    = top_count / max(max_freq, 1)

    title_tokens = tokenize(ad.get("title", ""))
    cat_tokens   = tokenize(ad.get("category", ""))
    desc_tokens  = tokenize(ad.get("description", ""))
    all_tokens   = title_tokens + cat_tokens + desc_tokens

    matched     = sum(1 for t in term_freq if t in all_tokens)
    title_score = sum(term_freq.get(t, 0) for t in title_tokens)
    cat_score   = sum(term_freq.get(t, 0) for t in cat_tokens)

    try:
        created  = ad.get("createdAt", "")
        age_days = (datetime.utcnow() - datetime.fromisoformat(created.replace("Z", ""))).days if created else 30
    except Exception:
        age_days = 30
    age_days = min(max(age_days, 0), 365)

    return [search_count, matched, title_score, cat_score, age_days, norm_freq]

# ─── waste routes (preserved) ────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    return jsonify({"name": "EcoSwap ML API", "version": "2.0.0",
                    "waste_model": waste_model is not None,
                    "lgbm_model": os.path.exists(LGBM_MODEL_PATH)})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy",
                    "waste_model_loaded": waste_model is not None,
                    "lgbm_model_loaded": os.path.exists(LGBM_MODEL_PATH),
                    "classes": CLASS_NAMES})

@app.route("/predict", methods=["POST"])
def predict():
    if not TF_AVAILABLE:
        return jsonify({"error": "TensorFlow not installed"}), 500
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    ext  = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in {"png", "jpg", "jpeg", "gif", "webp"}:
        return jsonify({"error": "Invalid file type"}), 400
    try:
        return jsonify(predict_waste(file.read()))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─── LightGBM recommendation routes ─────────────────────────────────────────

@app.route("/rank", methods=["POST"])
def rank():
    """
    POST { userId, searchHistory: [{query, count}], ads: [{_id, title, ...}] }
    Returns { recommendations: [{adId, score}], method }
    """
    data           = request.get_json(force=True)
    search_history = data.get("searchHistory", [])
    ads            = data.get("ads", [])

    if not ads:
        return jsonify({"recommendations": [], "method": "no_ads"})

    model = load_lgbm()
    scored = []

    if model:
        X = np.array([build_features(search_history, ad) for ad in ads])
        preds = model.predict(X)
        for ad, score in zip(ads, preds):
            scored.append({"adId": str(ad.get("_id", "")), "score": float(score) * 100})
        method = "lightgbm"
    else:
        # Rule-based fallback until model is trained
        all_terms = []
        for item in search_history:
            all_terms.extend(tokenize(item.get("query", "")) * item.get("count", 1))
        for ad in ads:
            scored.append({"adId": str(ad.get("_id", "")), "score": rule_score(all_terms, ad)})
        method = "rule_based"

    scored.sort(key=lambda x: x["score"], reverse=True)
    return jsonify({"recommendations": scored, "method": method})


@app.route("/train", methods=["POST"])
def train():
    """
    POST { trainingData: [{features:[...], label: 0|1}] }
    Trains LightGBM and saves model to model/lgbm_recommendation.txt
    """
    data          = request.get_json(force=True)
    training_data = data.get("trainingData", [])

    if len(training_data) < 10:
        return jsonify({"success": False, "message": f"Need at least 10 samples, got {len(training_data)}"})

    X = np.array([d["features"] for d in training_data], dtype=np.float32)
    y = np.array([d["label"]    for d in training_data], dtype=np.float32)

    feature_names = [
        "search_count", "matched_term_count",
        "title_match_score", "category_match_score",
        "ad_age_days", "search_frequency"
    ]

    train_ds = lgb.Dataset(X, label=y, feature_name=feature_names)

    params = {
        "objective":        "binary",
        "metric":           "binary_logloss",
        "boosting_type":    "gbdt",
        "num_leaves":       15,
        "learning_rate":    0.05,
        "feature_fraction": 0.9,
        "bagging_fraction": 0.8,
        "bagging_freq":     5,
        "verbose":         -1,
        "min_data_in_leaf": 3,
    }

    model = lgb.train(
        params, train_ds, num_boost_round=100,
        valid_sets=[train_ds],
        callbacks=[lgb.early_stopping(10, verbose=False), lgb.log_evaluation(period=-1)]
    )

    os.makedirs(MODEL_DIR, exist_ok=True)
    model.save_model(LGBM_MODEL_PATH)

    importance = dict(zip(feature_names, model.feature_importance().tolist()))
    return jsonify({"success": True, "samples": len(training_data), "feature_importance": importance})


@app.route("/match-search", methods=["POST"])
def match_search():
    """
    POST { ad: {...}, pendingSearches: [{userId, query}] }
    Returns { notify: [{userId, query, score}] }
    """
    data    = request.get_json(force=True)
    ad      = data.get("ad", {})
    pending = data.get("pendingSearches", [])

    ad_tokens = (tokenize(ad.get("title","")) +
                 tokenize(ad.get("category","")) +
                 tokenize(ad.get("description","")))

    notify = []
    for s in pending:
        q_tokens = tokenize(s.get("query",""))
        if any(t in ad_tokens for t in q_tokens):
            notify.append({"userId": s.get("userId"), "query": s.get("query"),
                           "score": rule_score(q_tokens, ad)})
    return jsonify({"notify": notify})


if __name__ == "__main__":
    load_waste_model()
    port  = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    print(f"\nEcoSwap ML API on http://localhost:{port}")
    print(f"Waste classes: {CLASS_NAMES}")
    lgbm_status = "loaded" if os.path.exists(LGBM_MODEL_PATH) else "not found (rule-based fallback active)"
    print(f"LightGBM model: {lgbm_status}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)