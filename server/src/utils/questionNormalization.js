// Utility helpers for normalizing question objects across services
// Central place to map legacy or external difficulty labels and ensure
// Interview / Question model compatibility.

const DIFFICULTY_MAP = {
  easy: "beginner",
  beginner: "beginner",
  medium: "intermediate",
  intermediate: "intermediate",
  hard: "advanced",
  advanced: "advanced",
};

function mapDifficulty(raw) {
  if (!raw || typeof raw !== "string") return "intermediate";
  const key = raw.toLowerCase().trim();
  return DIFFICULTY_MAP[key] || "intermediate";
}

// Normalize a raw (fallback / AI / template) question shape prior to
// creating a persisted Question document OR embedding into Interview.questions
// This does NOT create mongoose ObjectIds; caller is responsible for that when needed.
function normalizeRawQuestion(raw, index = 0, defaults = {}) {
  if (!raw || typeof raw !== "object") raw = {};
  const difficulty = mapDifficulty(raw.difficulty || defaults.difficulty);
  const baseText =
    raw.text || raw.questionText || raw.question || `Question ${index + 1}`;
  const category =
    raw.category ||
    defaults.category ||
    (raw.type && raw.type.includes("behavior")
      ? "communication"
      : "web-development");
  return {
    text: baseText,
    category,
    difficulty,
    type:
      raw.type && raw.type !== "mixed"
        ? raw.type
        : category === "communication"
        ? "behavioral"
        : "technical",
    estimatedTime: normalizeTime(raw, defaults),
    tags: raw.tags || [],
    source: raw.source || defaults.source || "generated",
  };
}

function normalizeTime(raw, defaults) {
  const SEC_PER_MIN = 60; // eslint-disable-line no-magic-numbers
  const FIVE_MIN_SEC = 5 * SEC_PER_MIN; // eslint-disable-line no-magic-numbers
  const fallback = defaults.estimatedTime || FIVE_MIN_SEC;
  if (!raw) return fallback;
  if (raw.estimatedTime && Number.isFinite(raw.estimatedTime))
    return raw.estimatedTime;
  if (raw.timeEstimate && Number.isFinite(raw.timeEstimate))
    return raw.timeEstimate * SEC_PER_MIN;
  if (raw.timeLimit && Number.isFinite(raw.timeLimit))
    return raw.timeLimit * SEC_PER_MIN;
  return fallback;
}

module.exports = {
  mapDifficulty,
  normalizeRawQuestion,
};
