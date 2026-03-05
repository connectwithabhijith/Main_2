const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["search_match", "message", "general"],
    default: "search_match"
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ad",
    default: null
  },
  query: {
    type: String,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);