const express = require('express');
const router = express.Router();
const { predictWaste } = require('../controllers/mlController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/ml/predict
// @desc    Classify waste image
// @access  Private
router.post('/predict', protect, upload.single('image'), predictWaste);

module.exports = router;
