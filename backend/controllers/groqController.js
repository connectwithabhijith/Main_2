const axios = require("axios");
const ragService = require("../services/ragService");

exports.getWasteDetails = async (req, res) => {
  const { wasteType } = req.body;

  if (!wasteType) {
    return res.status(400).json({ error: "wasteType is required" });
  }

  // ─── RAG Retrieval Step ─────────────────────────────────────────────────
  const { context, sources } = ragService.retrieve(wasteType, 8);

  const ragAvailable = context && context.length > 0;

  // ─── Build RAG-augmented prompt ─────────────────────────────────────────
  const prompt = `
You are an API. Respond ONLY with valid JSON.

${ragAvailable ? `REFERENCE DATA (use this as your PRIMARY source — base your response on this verified information):
${context}

IMPORTANT: You MUST use the reference data above as the primary basis for your response. Only supplement with your own knowledge where the reference data has gaps. Include any applicable Indian government regulations, rules, and penalties mentioned in the reference data.` : ""}

Waste type: ${wasteType}

Return JSON in this exact structure:
{
  "description": "",
  "industries": [],
  "uses": [],
  "price": {
    "amount": "",
    "unit": "",
    "currency": "INR"
  },
  "recyclingSteps": [
    { "step": "", "tip": "" }
  ],
  "ecoTip": "",
  "governmentRegulations": {
    "applicableRules": "",
    "keyProvisions": [],
    "citizenDuty": "",
    "penalty": ""
  }
}

Rules:
- Price should be realistic Indian market value from the reference data if available.
- Amount should be numeric only.
- Unit example: "per kg", "per piece".
- recyclingSteps must reference applicable Indian government regulations (SWM Rules, Plastic Waste Management Rules, E-Waste Rules, etc.) where relevant.
- governmentRegulations must include the specific rule names, key provisions, citizen duties, and penalties from the reference data.
- Do NOT return anything except JSON.
`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: ragAvailable
              ? "You are a waste recycling expert API. Return only JSON. Base your response on the REFERENCE DATA provided — it contains verified information from Indian government regulations and curated recycling knowledge."
              : "Return only JSON."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.choices[0].message.content;

    // Safe JSON extraction
    const json = JSON.parse(
      text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)
    );

    // Attach RAG metadata to the response
    json.ragMetadata = {
      ragUsed: ragAvailable,
      sourcesCount: sources.length,
      sources: sources.map(s => ({
        wasteType: s.wasteType,
        section: s.section,
        relevanceScore: s.score
      })),
      knowledgeBaseVersion: ragService.getMetadata()?.version || "unknown",
      lastUpdated: ragService.getMetadata()?.lastUpdated || "unknown"
    };

    res.json(json);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Groq AI failed" });
  }
};
