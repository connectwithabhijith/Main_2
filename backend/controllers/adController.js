const Ad = require('../models/Ad');

// @desc    Create new ad
// @route   POST /api/ads
// @access  Private
const createAd = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      images,
      mlPrediction,
      quantity,
      condition,
      price,
      location
    } = req.body;

    // Validation
    if (!title || !description || !category || !location) {
      return res.status(400).json({ 
        message: 'Please provide title, description, category, and location' 
      });
    }

    const ad = await Ad.create({
      title,
      description,
      category,
      images: images || [],
      mlPrediction,
      quantity,
      condition,
      price,
      location,
      seller: req.user._id
    });

    const populatedAd = await Ad.findById(ad._id).populate('seller', 'name email phone location');

    res.status(201).json(populatedAd);
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ message: 'Server error creating ad' });
  }
};

// @desc    Get all ads with filtering
// @route   GET /api/ads
// @access  Public
const getAds = async (req, res) => {
  try {
    const { category, city, state, search, sort, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { status: 'active' };

    if (category) {
      query.category = category.toLowerCase();
    }

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    if (state) {
      query['location.state'] = new RegExp(state, 'i');
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'price-low') sortOption = { 'price.amount': 1 };
    if (sort === 'price-high') sortOption = { 'price.amount': -1 };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const ads = await Ad.find(query)
      .populate('seller', 'name location')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ad.countDocuments(query);

    res.json({
      ads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({ message: 'Server error fetching ads' });
  }
};

// @desc    Get single ad
// @route   GET /api/ads/:id
// @access  Public
const getAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id)
      .populate('seller', 'name email phone location createdAt');

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Increment view count
    ad.views += 1;
    await ad.save();

    res.json(ad);
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({ message: 'Server error fetching ad' });
  }
};

// @desc    Get ads by logged in user
// @route   GET /api/ads/my-ads
// @access  Private
const getMyAds = async (req, res) => {
  try {
    const ads = await Ad.find({ seller: req.user._id })
      .sort({ createdAt: -1 });

    res.json(ads);
  } catch (error) {
    console.error('Get my ads error:', error);
    res.status(500).json({ message: 'Server error fetching your ads' });
  }
};

// @desc    Update ad
// @route   PUT /api/ads/:id
// @access  Private
const updateAd = async (req, res) => {
  try {
    let ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Check ownership
    if (ad.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ad' });
    }

    ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('seller', 'name email phone location');

    res.json(ad);
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ message: 'Server error updating ad' });
  }
};

// @desc    Delete ad
// @route   DELETE /api/ads/:id
// @access  Private
const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Check ownership
    if (ad.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this ad' });
    }

    // Soft delete by updating status
    ad.status = 'deleted';
    await ad.save();

    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ message: 'Server error deleting ad' });
  }
};

// @desc    Upload ad images
// @route   POST /api/ads/upload
// @access  Private
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one image' });
    }

    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    res.json({ images: imageUrls });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'Server error uploading images' });
  }
};

module.exports = {
  createAd,
  getAds,
  getAd,
  getMyAds,
  updateAd,
  deleteAd,
  uploadImages
};
