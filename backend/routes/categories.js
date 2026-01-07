const express = require('express');
const router = express.Router();
const WASTE_CATEGORIES = require('../config/categories');

// @desc    Get all waste categories
// @route   GET /api/categories
// @access  Public
router.get('/', (req, res) => {
  res.json(WASTE_CATEGORIES);
});

module.exports = router;
