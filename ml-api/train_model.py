"""
Bootstrap LightGBM recommendation model.
Run once: python train_model.py
"""
import lightgbm as lgb
import numpy as np
import os

MODEL_DIR  = os.path.join(os.path.dirname(__file__), "model")
MODEL_PATH = os.path.join(MODEL_DIR, "lgbm_recommendation.txt")
FEATURE_NAMES = [
    "search_count","matched_term_count","title_match_score",
    "category_match_score","ad_age_days","search_frequency"
]
np.random.seed(42)
n = 300

X_pos = np.column_stack([
    np.random.randint(3,20,n), np.random.randint(2,8,n),
    np.random.randint(20,80,n), np.random.randint(10,40,n),
    np.random.randint(0,30,n), np.random.uniform(0.4,1.0,n),
])
X_neg = np.column_stack([
    np.random.randint(1,5,n), np.zeros(n), np.zeros(n), np.zeros(n),
    np.random.randint(60,365,n), np.random.uniform(0.0,0.2,n),
])
X = np.vstack([X_pos,X_neg]).astype(np.float32)
y = np.array([1]*n+[0]*n, dtype=np.float32)
idx = np.random.permutation(len(X)); X,y = X[idx],y[idx]

ds = lgb.Dataset(X, label=y, feature_name=FEATURE_NAMES)
params = {"objective":"binary","metric":"binary_logloss","boosting_type":"gbdt",
          "num_leaves":15,"learning_rate":0.05,"feature_fraction":0.9,
          "bagging_fraction":0.8,"bagging_freq":5,"verbose":-1,"min_data_in_leaf":5}

print("Training LightGBM...")
model = lgb.train(params, ds, num_boost_round=150, valid_sets=[ds],
    callbacks=[lgb.early_stopping(20,verbose=False), lgb.log_evaluation(period=50)])

os.makedirs(MODEL_DIR, exist_ok=True)
model.save_model(MODEL_PATH)
print(f"\nSaved to {MODEL_PATH}")
print("Feature importance:")
for n,i in zip(FEATURE_NAMES, model.feature_importance()):
    print(f"  {n:<30} {i}")