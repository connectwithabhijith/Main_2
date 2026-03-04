const express = require("express");
const router = express.Router();
const SearchHistory = require("../models/SearchHistory");

router.post("/", async (req, res) => {
  try {
    const { userId, query, category } = req.body;

    const search = await SearchHistory.create({
      userId,
      query,
      category
    });

    res.json(search);
  } catch (err) {
    res.status(500).json({ error: "Search save failed" });
  }
});

module.exports = router;