import lightgbm as lgb
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load trained LightGBM model
model = lgb.Booster(model_file="recommendation_model.txt")


@app.route("/rank", methods=["POST"])
def rank_ads():

    data = request.json
    ads = data["ads"]

    features = []

    for ad in ads:
        features.append([
            ad.get("views", 0),
            ad.get("price", {}).get("amount", 0),
            len(ad.get("title", ""))
        ])

    preds = model.predict(np.array(features))

    ranked = sorted(
        zip(ads, preds),
        key=lambda x: x[1],
        reverse=True
    )

    ranked_ads = [a[0] for a in ranked]

    return jsonify(ranked_ads)


@app.route("/health")
def health():
    return jsonify({"status": "ML API running"})


if __name__ == "__main__":
    app.run(port=5000, debug=True)