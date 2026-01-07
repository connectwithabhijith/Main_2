const express = require('express');
const router = express.Router();
const {
  createAd,
  getAds,
  getAd,
  getMyAds,
  updateAd,
  deleteAd,
  uploadImages
} = require('../controllers/adController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAds);
router.get('/:id', getAd);

// Protected routes
router.post('/', protect, createAd);
router.get('/user/my-ads', protect, getMyAds);
router.put('/:id', protect, updateAd);
router.delete('/:id', protect, deleteAd);
router.post('/upload', protect, upload.array('images', 5), uploadImages);

module.exports = router;
