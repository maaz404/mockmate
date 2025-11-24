// Load environment variables FIRST so downstream services (embeddingService) see OPENAI_API_KEY
require("dotenv").config();

// Validate required env before requiring services that instantiate clients
if (!process.env.OPENAI_API_KEY) {
  console.error(
    "❌ Missing OPENAI_API_KEY. Please add it to server/.env before indexing."
  );
  process.exit(1);
}
if (!process.env.PINECONE_API_KEY) {
  console.error(
    "❌ Missing PINECONE_API_KEY. Please add it to server/.env before indexing."
  );
  process.exit(1);
}

const ragService = require("../services/ragService");
const chatbotKnowledge = require("../data/chatbotKnowledge.js");
const questionTemplates = require("../data/questionTemplates.json");

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
