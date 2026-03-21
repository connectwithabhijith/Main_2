/**
 * Test script for RAG Service
 *
 * Run: node test-rag.js
 */

const ragService = require("./services/ragService");

console.log("=== RAG Service Test ===\n");

// 1. Check initialization
console.log("1. Initialization check:");
console.log(`   RAG Ready: ${ragService.isReady()}`);
console.log(`   KB Metadata:`, ragService.getMetadata());
console.log();

// 2. Test known waste types
const knownTypes = ["cardboard", "glass", "metal", "paper", "plastic", "trash"];
console.log("2. Testing known waste types:\n");

for (const type of knownTypes) {
  const result = ragService.retrieve(type, 5);
  console.log(`   [${type.toUpperCase()}]`);
  console.log(`   → ${result.sources.length} sources retrieved`);
  console.log(`   → Top sources: ${result.sources.slice(0, 3).map(s => `${s.wasteType}/${s.section} (${s.score})`).join(", ")}`);
  console.log(`   → Context length: ${result.context.length} chars`);
  console.log();
}

// 3. Test extended waste types (beyond ML classes)
const extendedTypes = ["e-waste", "battery", "textile", "organic", "hazardous"];
console.log("3. Testing extended waste types (beyond ML classes):\n");

for (const type of extendedTypes) {
  const result = ragService.retrieve(type, 5);
  console.log(`   [${type.toUpperCase()}]`);
  console.log(`   → ${result.sources.length} sources retrieved`);
  console.log(`   → Top sources: ${result.sources.slice(0, 3).map(s => `${s.wasteType}/${s.section} (${s.score})`).join(", ")}`);
  console.log();
}

// 4. Test specific items (unknown to ML but should match via aliases/similarity)
const specificItems = ["rubber tire", "styrofoam cup", "old smartphone", "cotton shirt", "paint can", "aluminum can", "PET bottle"];
console.log("4. Testing specific item queries (alias matching):\n");

for (const item of specificItems) {
  const result = ragService.retrieve(item, 3);
  console.log(`   [${item}]`);
  console.log(`   → ${result.sources.length} sources, top: ${result.sources.slice(0, 2).map(s => `${s.wasteType}/${s.section} (${s.score})`).join(", ")}`);
}

console.log("\n5. Sample context for 'plastic':\n");
const plasticResult = ragService.retrieve("plastic", 3);
console.log(plasticResult.context.substring(0, 500) + "...\n");

// 6. Check government regulation content
console.log("6. Government regulation keywords check:");
const regTest = ragService.retrieve("plastic", 8);
const hasGovtReg = regTest.context.includes("Plastic Waste Management Rules");
const hasSWMRules = ragService.retrieve("cardboard", 8).context.includes("SWM Rules");
const hasEWaste = ragService.retrieve("e-waste", 8).context.includes("E-Waste");
console.log(`   Plastic rules in context: ${hasGovtReg ? "✅" : "❌"}`);
console.log(`   SWM Rules in cardboard context: ${hasSWMRules ? "✅" : "❌"}`);
console.log(`   E-Waste rules in e-waste context: ${hasEWaste ? "✅" : "❌"}`);

console.log("\n=== All tests complete ===");
