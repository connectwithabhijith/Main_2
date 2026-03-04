const mongoose = require("mongoose");

const SearchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  query: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  count: {
    type: Number,
    default: 1
  },
  // true = a matching ad exists in DB; false = no match yet (pending)
  resolved: {
    type: Boolean,
    default: false
  },
  // When resolved, store the matched adId so we can surface it
  matchedAdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ad",
    default: null
  },
  lastSearchedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index so we can upsert by (userId, query)
SearchHistorySchema.index({ userId: 1, query: 1 }, { unique: true });
SearchHistorySchema.index({ resolved: 1 });
SearchHistorySchema.index({ userId: 1, count: -1 });

module.exports = mongoose.model("SearchHistory", SearchHistorySchema);