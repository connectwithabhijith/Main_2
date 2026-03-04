const SearchHistory = require("../models/SearchHistory");
const Notification = require("../models/Notification");
const Ad = require("../models/Ad");
const axios = require("axios");

const ML_API = process.env.ML_API_URL || "http://localhost:5001";

// ─── helpers ────────────────────────────────────────────────────────────────

function tokenize(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(" ").filter(Boolean);
}

function adMatchesQuery(ad, query) {
  const adText = `${ad.title} ${ad.category} ${ad.description}`.toLowerCase();
  const terms = tokenize(query);
  return terms.some((t) => adText.includes(t));
}

// ─── 1. Record / upsert a search query for a user ───────────────────────────

exports.recordSearch = async (req, res) => {
  try {
    const { userId, query } = req.body;
    if (!userId || !query?.trim()) {
      return res.status(400).json({ message: "userId and query are required" });
    }

    const normalised = query.trim().toLowerCase();

    // Check whether any current ad matches this query
    const matchingAd = await Ad.findOne({
      status: "active",
      $or: [
        { title: { $regex: normalised, $options: "i" } },
        { description: { $regex: normalised, $options: "i" } },
        { category: { $regex: normalised, $options: "i" } }
      ]
    });

    // Upsert: increment count if exists, create otherwise
    const entry = await SearchHistory.findOneAndUpdate(
      { userId, query: normalised },
      {
        $inc: { count: 1 },
        $set: {
          lastSearchedAt: new Date(),
          resolved: !!matchingAd,
          matchedAdId: matchingAd ? matchingAd._id : null
        }
      },
      { upsert: true, new: true }
    );

    return res.json({ recorded: true, resolved: entry.resolved });
  } catch (err) {
    console.error("recordSearch error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── 2. Get recommendations for a user's profile page ───────────────────────
//
//  Logic:
//    a) Pull user's top-searched queries (sorted by count desc)
//    b) Find all active ads
//    c) Send to ML-API /rank with search history → get scored list
//    d) Ads with score > threshold → "recommended"; others → "normal"

exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId required" });

    // User's search history sorted by frequency
    const history = await SearchHistory.find({ userId }).sort({ count: -1 }).limit(20);

    if (!history.length) {
      return res.json({ recommended: [], normal: [], method: "no_history" });
    }

    // All active ads
    const ads = await Ad.find({ status: "active" }).sort({ createdAt: -1 }).limit(100).lean();

    if (!ads.length) {
      return res.json({ recommended: [], normal: [], method: "no_ads" });
    }

    // Build payload for ML API
    const historyPayload = history.map((h) => ({ query: h.query, count: h.count }));

    let scored = [];
    let method = "rule_based";

    try {
      const mlRes = await axios.post(
        `${ML_API}/rank`,
        { userId, searchHistory: historyPayload, ads },
        { timeout: 5000 }
      );
      scored = mlRes.data.recommendations || [];
      method = mlRes.data.method || "lightgbm";
    } catch (mlErr) {
      console.warn("ML API unavailable, using rule-based fallback:", mlErr.message);
      // Fallback: compute relevance inline
      scored = ads.map((ad) => {
        let score = 0;
        for (const h of history) {
          if (adMatchesQuery(ad, h.query)) score += h.count * 10;
        }
        return { adId: String(ad._id), score };
      });
      scored.sort((a, b) => b.score - a.score);
    }

    // Build a map for quick lookup
    const adMap = {};
    for (const ad of ads) adMap[String(ad._id)] = ad;

    // Also include matched pending searches (resolved ads) at top
    const matchedAdIds = history
      .filter((h) => h.resolved && h.matchedAdId)
      .map((h) => String(h.matchedAdId));

    const RECOMMENDED_THRESHOLD = 5; // score cutoff

    const recommended = [];
    const normal = [];
    const seen = new Set();

    // Always put search-matched ads first
    for (const adId of matchedAdIds) {
      if (seen.has(adId)) continue;
      seen.add(adId);
      const ad = adMap[adId];
      if (ad) recommended.push({ ...ad, _recommendedReason: "search_match" });
    }

    // Then LightGBM/rule-based scored
    for (const { adId, score } of scored) {
      if (seen.has(adId)) continue;
      seen.add(adId);
      const ad = adMap[adId];
      if (!ad) continue;
      if (score >= RECOMMENDED_THRESHOLD) {
        recommended.push({ ...ad, _score: score, _recommendedReason: "lightgbm" });
      } else {
        normal.push({ ...ad, _score: score });
      }
    }

    return res.json({ recommended, normal, method });
  } catch (err) {
    console.error("getRecommendations error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── 3. Called after a new ad is posted ─────────────────────────────────────
//
//  - Find all UNRESOLVED searches that match this ad
//  - Create notifications for those users
//  - Mark those searches as resolved

exports.onAdPosted = async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await Ad.findById(adId).lean();
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    // Find unresolved searches that could match this ad
    const pendingSearches = await SearchHistory.find({ resolved: false });

    const toNotify = pendingSearches.filter((s) => adMatchesQuery(ad, s.query));

    if (!toNotify.length) {
      return res.json({ notified: 0 });
    }

    // Create notifications & mark resolved in parallel
    const notifDocs = toNotify.map((s) => ({
      userId: s.userId,
      type: "search_match",
      title: "Item you searched is now available!",
      body: `"${ad.title}" matches your search for "${s.query}"`,
      adId: ad._id,
      query: s.query
    }));

    await Promise.all([
      Notification.insertMany(notifDocs),
      SearchHistory.updateMany(
        { _id: { $in: toNotify.map((s) => s._id) } },
        { $set: { resolved: true, matchedAdId: ad._id } }
      )
    ]);

    return res.json({ notified: toNotify.length });
  } catch (err) {
    console.error("onAdPosted error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── 4. Get notifications for a user ────────────────────────────────────────

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("adId", "title images category price");

    return res.json(notifications);
  } catch (err) {
    console.error("getNotifications error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── 5. Mark notification(s) as read ────────────────────────────────────────

exports.markNotificationsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    return res.json({ success: true });
  } catch (err) {
    console.error("markNotificationsRead error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── 6. Trigger LightGBM re-train with interaction data ─────────────────────

exports.triggerTrain = async (req, res) => {
  try {
    // Gather training data: resolved searches = positive labels
    const resolved = await SearchHistory.find({ resolved: true, matchedAdId: { $ne: null } })
      .populate("matchedAdId")
      .lean();

    const unresolved = await SearchHistory.find({ resolved: false }).limit(resolved.length).lean();

    if (resolved.length < 10) {
      return res.json({ success: false, message: "Not enough data to train yet" });
    }

    const trainingData = [];

    for (const s of resolved) {
      const ad = s.matchedAdId;
      if (!ad) continue;
      trainingData.push({
        userId: String(s.userId),
        adId: String(ad._id),
        features: buildFeatureRow(s, ad),
        label: 1
      });
    }

    for (const s of unresolved) {
      // Pair with a random active ad as negative example
      const ad = await Ad.findOne({ status: "active" }).lean();
      if (!ad) continue;
      trainingData.push({
        userId: String(s.userId),
        adId: String(ad._id),
        features: buildFeatureRow(s, ad),
        label: 0
      });
    }

    const mlRes = await axios.post(`${ML_API}/train`, { trainingData }, { timeout: 30000 });
    return res.json(mlRes.data);
  } catch (err) {
    console.error("triggerTrain error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Feature builder matching the ML API's expected feature order
function buildFeatureRow(searchEntry, ad) {
  const searchCount = searchEntry.count || 1;
  const adTokens = tokenize(`${ad.title} ${ad.category} ${ad.description}`);
  const queryTokens = tokenize(searchEntry.query || "");
  const matched = queryTokens.filter((t) => adTokens.includes(t)).length;
  const titleScore = queryTokens.filter((t) => tokenize(ad.title || "").includes(t)).length * 10;
  const catScore = queryTokens.filter((t) => tokenize(ad.category || "").includes(t)).length * 10;
  const ageDays = Math.min(
    Math.floor((Date.now() - new Date(ad.createdAt).getTime()) / 86400000),
    365
  );
  const freq = Math.min(searchCount / 10, 1);
  return [searchCount, matched, titleScore, catScore, ageDays, freq];
}


// ─── 7. Get raw search history for profile display ───────────────────────────

exports.getSearchHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await SearchHistory.find({ userId })
      .sort({ count: -1 })
      .limit(20)
      .lean();
    return res.json(history);
  } catch (err) {
    console.error("getSearchHistory error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};