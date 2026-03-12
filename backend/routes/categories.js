const express = require('express');
const router = express.Router();
const WASTE_CATEGORIES = require('../config/categories');
const Ad = require('../models/Ad');

// @desc    Get all waste categories (including custom ones from ads)
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const knownIds = WASTE_CATEGORIES.map(c => c.id);

    // Get distinct categories from active ads
    const customCategories = await Ad.distinct('category', {
      status: 'active',
      category: { $nin: knownIds }
    });

    // Build custom category objects
    const customEntries = customCategories.map(cat => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      description: 'Custom category',
      recyclable: null
    }));

    res.json([...WASTE_CATEGORIES, ...customEntries]);
  } catch (err) {
    // Fallback to just the hardcoded categories
    res.json(WASTE_CATEGORIES);
  }
});

module.exports = router;
