const express = require("express");
const router = express.Router();
const rc = require("../controllers/recommendationController");

// Record a user's search query
// POST /api/recommendations/search
router.post("/search", rc.recordSearch);

// Get recommendations for a user (profile page)
// GET /api/recommendations/:userId
router.get("/:userId", rc.getRecommendations);

// Called after a new ad is posted to notify matching searchers
// POST /api/recommendations/on-ad-posted/:adId
router.post("/on-ad-posted/:adId", rc.onAdPosted);

// Notifications
// GET /api/recommendations/notifications/:userId
router.get("/notifications/:userId", rc.getNotifications);

// POST /api/recommendations/notifications/:userId/read
router.post("/notifications/:userId/read", rc.markNotificationsRead);

// Trigger model re-train
// POST /api/recommendations/train
router.post("/train", rc.triggerTrain);

module.exports = router;

// GET /api/recommendations/history/:userId
router.get("/history/:userId", rc.getSearchHistory);