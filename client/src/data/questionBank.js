// Pre-seeded static question sets per category.
// These are intentionally generic and original (not copied from proprietary sources) to avoid copyright issues.

export const CATEGORY_QUESTION_SETS = {
  behavioral: [
    {
      text: "Tell me about a time you had to overcome a significant challenge at work.",
      category: "behavioral",
      difficulty: "intermediate",
      tags: ["teamwork", "problem-solving"],
      source: "static",
    },
    {
      text: "Describe a situation where you received constructive feedback. How did you respond?",
      category: "behavioral",
      difficulty: "beginner",
      tags: ["feedback", "growth"],
      source: "static",
    },
    {
      text: "Give an example of a time you had to persuade others to adopt your idea.",
      category: "behavioral",
      difficulty: "intermediate",
      tags: ["influence", "communication"],
      source: "static",
    },
    {
      text: "Tell me about a time you made a mistake. What did you learn?",
      category: "behavioral",
      difficulty: "beginner",
      tags: ["ownership", "learning"],
      source: "static",
    },
    {
      text: "Describe a time you balanced conflicting priorities under a tight deadline.",
      category: "behavioral",
      difficulty: "advanced",
      tags: ["prioritization", "time-management"],
      source: "static",
    },
  ],
  technical: [
    {
      text: "Explain the difference between synchronous and asynchronous programming.",
      category: "technical",
      difficulty: "beginner",
      tags: ["fundamentals", "async"],
      source: "static",
    },
    {
      text: "How does a hash table work and what are common collision resolution strategies?",
      category: "technical",
      difficulty: "intermediate",
      tags: ["data-structures", "hashing"],
      source: "static",
    },
    {
      text: "Walk through how an HTTP request flows from browser to backend and back.",
      category: "technical",
      difficulty: "intermediate",
      tags: ["networking", "web"],
      source: "static",
    },
    {
      text: "What are the trade-offs between horizontal and vertical scaling?",
      category: "technical",
      difficulty: "advanced",
      tags: ["scalability", "architecture"],
      source: "static",
    },
    {
      text: "Describe how garbage collection works in a managed runtime (e.g., JVM / V8).",
      category: "technical",
      difficulty: "advanced",
      tags: ["memory", "runtime"],
      source: "static",
    },
  ],
  "system-design": [
    {
      text: "Design a URL shortening service (like bit.ly). Outline components and scaling considerations.",
      category: "system-design",
      difficulty: "intermediate",
      tags: ["caching", "datamodel"],
      source: "static",
    },
    {
      text: "How would you design a real-time chat system for millions of concurrent users?",
      category: "system-design",
      difficulty: "advanced",
      tags: ["realtime", "scalability"],
      source: "static",
    },
    {
      text: "Design a rate limiting mechanism for an API gateway.",
      category: "system-design",
      difficulty: "intermediate",
      tags: ["limits", "api"],
      source: "static",
    },
    {
      text: "Describe an architecture to process and index large volumes of log data for search.",
      category: "system-design",
      difficulty: "advanced",
      tags: ["streaming", "indexing"],
      source: "static",
    },
    {
      text: "How would you design a feature flag service used across multiple applications?",
      category: "system-design",
      difficulty: "intermediate",
      tags: ["control", "platform"],
      source: "static",
    },
  ],
};

export function normalizeCategory(val) {
  return (val || "").trim().toLowerCase().replace(/\s+/g, "-");
}

export function getAllCategoryMeta(generated = []) {
  // generated: user-generated questions (array)
  return Object.entries(CATEGORY_QUESTION_SETS).map(([slug, list]) => {
    const dynCount = generated.filter(
      (q) => normalizeCategory(q.category || q.type || "") === slug
    ).length;
    return {
      slug,
      staticCount: list.length,
      dynamicCount: dynCount,
      totalCount: list.length + dynCount,
    };
  });
}
