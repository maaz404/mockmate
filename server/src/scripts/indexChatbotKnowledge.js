const ragService = require("../src/services/ragService");
const chatbotKnowledge = require("../src/data/chatbotKnowledge.js");
const questionTemplates = require("../src/data/questionTemplates.json");
require("dotenv").config();

function flattenQuestions(templates) {
  const result = [];
  for (const [role, levels] of Object.entries(templates)) {
    for (const [difficulty, types] of Object.entries(levels)) {
      for (const [type, questions] of Object.entries(types)) {
        questions.forEach((q, i) => {
          result.push({
            id: `question_${role}_${difficulty}_${type}_${i}`,
            title: `Interview Question (${role}, ${difficulty}, ${type})`,
            content: q.text,
            category: q.category,
            source: "Question Bank",
            tags: q.tags,
            difficulty: q.difficulty,
            type: q.type,
          });
        });
      }
    }
  }
  return result;
}

async function indexKnowledge() {
  try {
    const questions = flattenQuestions(questionTemplates);
    const allDocs = [...chatbotKnowledge, ...questions];

    console.log(`📚 Indexing ${allDocs.length} documents...`);
    await ragService.indexDocuments(allDocs);

    const stats = await ragService.getStats();
    console.log("\n📊 Index Statistics:");
    console.log(`   Total Vectors: ${stats.totalVectorCount || 0}`);
    console.log(`   Dimensions: ${stats.dimension || 1536}`);
    console.log(
      `   Index Fullness: ${((stats.indexFullness || 0) * 100).toFixed(2)}%`
    );
    console.log("\n✅ Knowledge base indexing complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Indexing failed:", error);
    process.exit(1);
  }
}

indexKnowledge();
