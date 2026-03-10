const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// Helper: AI vision fallback
const detectWasteWithAI = async (imagePath) => {
  try {
    const base64Image = fs.readFileSync(imagePath, { encoding: "base64" });

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content:
              'Identify the waste object in the image. Respond ONLY with valid JSON in this format: {"item": "specific item name", "recyclable": true/false}. No extra text.'
          },
          {
            role: "user",
            content: [
              { type: "text", text: "What waste item is this?" },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.choices[0].message.content.trim();

    try {
      const json = JSON.parse(
        text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)
      );
      return json;
    } catch {
      // If JSON parsing fails, treat the raw text as the item name
      return { item: text, recyclable: null };
    }
  } catch (error) {
    console.error("Groq AI detection error:", error.message);
    return null;
  }
};

// @desc    Classify waste image using ML API
// @route   POST /api/ml/predict
// @access  Private
const predictWaste = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    const imagePath = req.file.path;

    const formData = new FormData();
    formData.append("file", fs.createReadStream(imagePath));

    const mlApiUrl =
      process.env.ML_API_URL || "http://localhost:5001/predict";

    const response = await axios.post(mlApiUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000
    });

    const mlResult = response.data;

    const predictedClass =
      mlResult.predicted_class || mlResult.class || "unknown";

    const confidence =
      mlResult.confidence || mlResult.probability || 0;

    const prediction = {
      predictedCategory: predictedClass,
      confidence,
      source: "ml",
      allPredictions: mlResult.all_predictions || [],
      recyclability: getRecyclability(predictedClass),
      suggestedUsage: getSuggestedUsage(predictedClass)
    };

    // AI fallback if confidence low or generic "trash" detected
    if (confidence < 0.85 || predictedClass.toLowerCase() === "trash") {
      console.log(
        predictedClass.toLowerCase() === "trash"
          ? "Generic 'trash' detected, using AI for specific identification..."
          : "Low ML confidence, using AI vision fallback..."
      );

      const aiResult = await detectWasteWithAI(imagePath);

      if (aiResult && aiResult.item) {
        prediction.predictedCategory = aiResult.item;
        prediction.source = "ai";
        prediction.confidence = null;
        prediction.recyclability =
          aiResult.recyclable === true
            ? "Recyclable"
            : aiResult.recyclable === false
              ? "Non-recyclable"
              : "Unknown";
        prediction.suggestedUsage = null;
      }
    }

    // Clean up uploaded file
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    res.json({
      success: true,
      prediction
    });

  } catch (error) {
    console.error("ML Prediction error:", error.message);

    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        message:
          "ML service is not available. Please ensure Flask API is running.",
        error: "ML_SERVICE_UNAVAILABLE"
      });
    }

    res.status(500).json({
      message: "Error processing image prediction",
      error: error.message
    });
  }
};

// Helper function to determine recyclability
const getRecyclability = (category) => {
  const recyclable = ["cardboard", "glass", "metal", "paper", "plastic"];

  if (recyclable.includes(category?.toLowerCase())) {
    return "Recyclable";
  }

  return "Non-recyclable";
};

// Helper function to get suggested usage
const getSuggestedUsage = (category) => {
  const usageMap = {
    cardboard:
      "Can be recycled into new cardboard products, paper bags, or used for composting",
    glass:
      "Can be recycled indefinitely into new glass containers or used in construction materials",
    metal:
      "Can be melted down and recycled into new metal products, reducing mining needs",
    paper:
      "Can be recycled into new paper products, tissues, or cardboard",
    plastic:
      "Can be recycled into new plastic products, textiles, or construction materials",
    trash:
      "Should be disposed of properly. Consider separating any recyclable components"
  };

  return (
    usageMap[category?.toLowerCase()] ||
    "Please consult local recycling guidelines"
  );
};

module.exports = { predictWaste };