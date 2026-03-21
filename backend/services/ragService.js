/**
 * RAG Service — Retrieval-Augmented Generation for waste recycling knowledge
 *
 * Uses TF-IDF based similarity search over a curated knowledge base
 * to provide grounded context to the Groq LLM.
 *
 * No external dependencies (no vector DB, no embedding API).
 */

const fs = require("fs");
const path = require("path");

// ─── Load knowledge base ────────────────────────────────────────────────────

const KB_PATH = path.join(__dirname, "..", "data", "waste_knowledge_base.json");

let knowledgeBase = null;
let chunks = [];         // { id, text, wasteType, section }
let idfMap = {};         // term → IDF score
let chunkVectors = [];   // TF-IDF vectors for each chunk

/**
 * Tokenize text into lowercase terms, removing punctuation.
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s₹%]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/**
 * Build a TF (term frequency) map for a list of tokens.
 */
function buildTF(tokens) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  // Normalize
  const max = Math.max(...Object.values(tf), 1);
  for (const t of Object.keys(tf)) {
    tf[t] /= max;
  }
  return tf;
}

/**
 * Compute cosine similarity between two sparse vectors (objects).
 */
function cosineSimilarity(vecA, vecB) {
  let dot = 0, magA = 0, magB = 0;
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  for (const k of allKeys) {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Convert a waste type entry into multiple text chunks (one per section).
 */
function chunkWasteEntry(entry) {
  const result = [];
  const type = entry.type;

  // Description chunk
  result.push({
    wasteType: type,
    section: "description",
    text: `Waste type: ${type}. Aliases: ${(entry.aliases || []).join(", ")}. ${entry.description || ""} Recyclable: ${entry.recyclable}. Grade: ${entry.recyclingGrade || "N/A"}. Decomposition time: ${entry.decompositionTime || "unknown"}.`
  });

  // Recycling methods chunk
  if (entry.recyclingMethods && entry.recyclingMethods.length > 0) {
    for (const method of entry.recyclingMethods) {
      result.push({
        wasteType: type,
        section: "recyclingMethod",
        text: `Recycling method for ${type}: ${method.method}. Steps: ${(method.steps || []).join(". ")}. Tip: ${method.tip || ""}`
      });
    }
  }

  // Industries & uses chunk
  if (entry.industries || entry.uses) {
    result.push({
      wasteType: type,
      section: "industries_uses",
      text: `${type} recycling industries: ${(entry.industries || []).join(", ")}. Recycled into: ${(entry.uses || []).join(", ")}.`
    });
  }

  // Environmental facts chunk
  if (entry.environmentalFacts) {
    const facts = Object.entries(entry.environmentalFacts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(". ");
    result.push({
      wasteType: type,
      section: "environmentalFacts",
      text: `Environmental impact of ${type}: ${facts}.`
    });
  }

  // Market price chunk
  if (entry.marketPrice) {
    result.push({
      wasteType: type,
      section: "marketPrice",
      text: `Market price for ${type} waste in India: ₹${entry.marketPrice.amount} ${entry.marketPrice.unit}. ${entry.marketPrice.notes || ""}`
    });
  }

  // Common items chunk
  if (entry.commonItems) {
    result.push({
      wasteType: type,
      section: "commonItems",
      text: `Common items classified as ${type}: ${entry.commonItems.join(", ")}.`
    });
  }

  // Eco tips chunk
  if (entry.ecoTips) {
    result.push({
      wasteType: type,
      section: "ecoTips",
      text: `Eco tips for ${type}: ${entry.ecoTips.join(". ")}.`
    });
  }

  // Government regulations chunk
  if (entry.governmentRegulations) {
    const reg = entry.governmentRegulations;
    result.push({
      wasteType: type,
      section: "governmentRegulations",
      text: `Government regulations for ${type}: Applicable rules: ${reg.applicableRules}. Key provisions: ${(reg.keyProvisions || []).join(". ")}. Citizen duty: ${reg.citizenDuty || ""}. Penalty: ${reg.penalty || ""}. EPR notes: ${reg.eprNotes || ""}.`
    });
  }

  return result;
}

/**
 * Index all chunks — compute IDF and TF-IDF vectors.
 */
function buildIndex() {
  if (!knowledgeBase) return;

  chunks = [];

  // Chunk all waste type entries
  for (const entry of knowledgeBase.wasteTypes || []) {
    const entryChunks = chunkWasteEntry(entry);
    for (const c of entryChunks) {
      c.id = chunks.length;
      chunks.push(c);
    }
  }

  // Chunk general guidelines
  const general = knowledgeBase.generalRecyclingGuidelines;
  if (general) {
    // Segregation bins
    if (general.segregationBins) {
      chunks.push({
        id: chunks.length,
        wasteType: "general",
        section: "segregationBins",
        text: `Waste segregation bins under SWM Rules 2016: ${general.segregationBins.description}. Green bin: ${general.segregationBins.greenBin}. Blue bin: ${general.segregationBins.blueBin}. Red bin: ${general.segregationBins.redBin}.`
      });
    }

    // Swachh Bharat guidelines
    if (general.swachhBharatGuidelines) {
      chunks.push({
        id: chunks.length,
        wasteType: "general",
        section: "swachhBharat",
        text: `Swachh Bharat Mission guidelines: ${general.swachhBharatGuidelines.join(". ")}.`
      });
    }

    // Unknown waste
    if (general.unknownWasteGuidelines) {
      chunks.push({
        id: chunks.length,
        wasteType: "general",
        section: "unknownWaste",
        text: `Guidelines for unknown or unclassified waste: ${general.unknownWasteGuidelines.description}. Steps: ${general.unknownWasteGuidelines.steps.join(". ")}.`
      });
    }

    // Three Rs
    if (general.threeRs) {
      chunks.push({
        id: chunks.length,
        wasteType: "general",
        section: "threeRs",
        text: `The 3Rs of waste management: Reduce: ${general.threeRs.reduce}. Reuse: ${general.threeRs.reuse}. Recycle: ${general.threeRs.recycle}.`
      });
    }
  }

  // ─── Compute IDF ────────────────────────────────────────────────────────

  const docCount = chunks.length;
  const docFreq = {}; // term → number of chunks containing it

  const chunkTokens = chunks.map(c => tokenize(c.text));

  for (const tokens of chunkTokens) {
    const uniqueTerms = new Set(tokens);
    for (const term of uniqueTerms) {
      docFreq[term] = (docFreq[term] || 0) + 1;
    }
  }

  idfMap = {};
  for (const [term, df] of Object.entries(docFreq)) {
    idfMap[term] = Math.log((docCount + 1) / (df + 1)) + 1; // smoothed IDF
  }

  // ─── Compute TF-IDF vectors for each chunk ──────────────────────────────

  chunkVectors = chunkTokens.map(tokens => {
    const tf = buildTF(tokens);
    const tfidf = {};
    for (const [term, tfVal] of Object.entries(tf)) {
      tfidf[term] = tfVal * (idfMap[term] || 1);
    }
    return tfidf;
  });

  console.log(`[RAG] Indexed ${chunks.length} knowledge chunks from ${(knowledgeBase.wasteTypes || []).length} waste types`);
}

/**
 * Load the knowledge base and build the index.
 */
function initialize() {
  try {
    const raw = fs.readFileSync(KB_PATH, "utf-8");
    knowledgeBase = JSON.parse(raw);
    buildIndex();
    console.log(`[RAG] Knowledge base loaded from ${KB_PATH}`);
  } catch (err) {
    console.error(`[RAG] Failed to load knowledge base: ${err.message}`);
    knowledgeBase = null;
    chunks = [];
  }
}

/**
 * Retrieve top-K relevant chunks for a given query.
 *
 * @param {string} query — the waste type or item name
 * @param {number} topK — number of chunks to return (default 8)
 * @returns {{ context: string, sources: Array<{wasteType: string, section: string, score: number}> }}
 */
function retrieve(query, topK = 8) {
  if (!chunks.length) {
    return { context: "", sources: [] };
  }

  // Build query vector
  const queryTokens = tokenize(query);
  const queryTF = buildTF(queryTokens);
  const queryVec = {};
  for (const [term, tfVal] of Object.entries(queryTF)) {
    queryVec[term] = tfVal * (idfMap[term] || 1);
  }

  // Score all chunks
  const scored = chunks.map((chunk, i) => ({
    index: i,
    wasteType: chunk.wasteType,
    section: chunk.section,
    score: cosineSimilarity(queryVec, chunkVectors[i]),
    text: chunk.text
  }));

  // Also boost chunks that belong to a waste type matching the query
  const queryLower = query.toLowerCase().trim();
  for (const item of scored) {
    // Exact type match gets a boost
    if (item.wasteType === queryLower) {
      item.score += 0.5;
    }
    // Check aliases
    const wasteEntry = (knowledgeBase.wasteTypes || []).find(w => w.type === item.wasteType);
    if (wasteEntry && wasteEntry.aliases) {
      for (const alias of wasteEntry.aliases) {
        if (queryLower.includes(alias) || alias.includes(queryLower)) {
          item.score += 0.3;
          break;
        }
      }
    }
  }

  // Sort by score descending, take top K
  scored.sort((a, b) => b.score - a.score);
  const topChunks = scored.slice(0, topK).filter(s => s.score > 0);

  // Always include general guidelines if there's room
  const hasGeneral = topChunks.some(c => c.wasteType === "general");
  if (!hasGeneral && scored.some(c => c.wasteType === "general")) {
    const generalChunks = scored.filter(c => c.wasteType === "general").slice(0, 2);
    topChunks.push(...generalChunks);
  }

  // Format context string
  const context = topChunks
    .map((c, i) => `[Source ${i + 1} — ${c.wasteType}/${c.section}]\n${c.text}`)
    .join("\n\n");

  const sources = topChunks.map(c => ({
    wasteType: c.wasteType,
    section: c.section,
    score: Math.round(c.score * 100) / 100
  }));

  return { context, sources };
}

/**
 * Get the knowledge base metadata.
 */
function getMetadata() {
  if (!knowledgeBase) return null;
  return knowledgeBase.metadata || null;
}

/**
 * Check if the RAG service is initialized.
 */
function isReady() {
  return chunks.length > 0;
}

// Auto-initialize on require
initialize();

module.exports = { retrieve, getMetadata, isReady, initialize };
