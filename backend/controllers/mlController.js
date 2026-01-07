const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// @desc    Classify waste image using ML API
// @route   POST /api/ml/predict
// @access  Private
const predictWaste = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const imagePath = req.file.path;
    
    // Create form data to send to Flask ML API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    // Call Flask ML API
    const mlApiUrl = process.env.ML_API_URL || 'http://localhost:5000/predict';
    
    const response = await axios.post(mlApiUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000 // 30 second timeout
    });

    // Clean up uploaded file after prediction
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    // Process ML response
    const mlResult = response.data;
    
    // Map ML response to our format
    const prediction = {
      predictedCategory: mlResult.predicted_class || mlResult.class || 'unknown',
      confidence: mlResult.confidence || mlResult.probability || 0,
      allPredictions: mlResult.all_predictions || [],
      recyclability: getRecyclability(mlResult.predicted_class || mlResult.class),
      suggestedUsage: getSuggestedUsage(mlResult.predicted_class || mlResult.class)
    };

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('ML Prediction error:', error.message);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        message: 'ML service is not available. Please ensure Flask API is running.',
        error: 'ML_SERVICE_UNAVAILABLE'
      });
    }

    res.status(500).json({ 
      message: 'Error processing image prediction',
      error: error.message 
    });
  }
};

// Helper function to determine recyclability
const getRecyclability = (category) => {
  const recyclable = ['cardboard', 'glass', 'metal', 'paper', 'plastic'];
  if (recyclable.includes(category?.toLowerCase())) {
    return 'Recyclable';
  }
  return 'Non-recyclable';
};

// Helper function to get suggested usage
const getSuggestedUsage = (category) => {
  const usageMap = {
    cardboard: 'Can be recycled into new cardboard products, paper bags, or used for composting',
    glass: 'Can be recycled indefinitely into new glass containers or used in construction materials',
    metal: 'Can be melted down and recycled into new metal products, reducing mining needs',
    paper: 'Can be recycled into new paper products, tissues, or cardboard',
    plastic: 'Can be recycled into new plastic products, textiles, or construction materials',
    trash: 'Should be disposed of properly. Consider separating any recyclable components'
  };
  return usageMap[category?.toLowerCase()] || 'Please consult local recycling guidelines';
};

module.exports = { predictWaste };
