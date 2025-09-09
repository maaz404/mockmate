const mongoose = require("mongoose");
const Question = require("../models/Question");
require("dotenv").config();

const sampleQuestions = [
  // Technical - JavaScript
  {
    text: "Explain the difference between let, const, and var in JavaScript.",
    category: "javascript",
    type: "technical",
    difficulty: "beginner",
    experienceLevel: ["entry", "junior"],
    estimatedTime: 180,
    tags: ["variables", "scope", "hoisting"],
    idealAnswer: {
      keyPoints: [
        "var has function scope, let and const have block scope",
        "var is hoisted and initialized with undefined",
        "let and const are hoisted but not initialized",
        "const cannot be reassigned after declaration",
        "let can be reassigned but not redeclared in same scope",
      ],
      sampleAnswer:
        "The main differences are in scope, hoisting behavior, and reassignment rules...",
      commonMistakes: [
        "Confusing scope rules",
        "Not understanding hoisting differences",
        "Thinking const makes objects immutable",
      ],
    },
    evaluationCriteria: {
      technical: { required: true, weight: 0.6 },
      communication: { required: true, weight: 0.4 },
      problemSolving: { required: false, weight: 0.0 },
    },
  },

  {
    text: "What is a closure in JavaScript? Provide an example.",
    category: "javascript",
    type: "technical",
    difficulty: "intermediate",
    experienceLevel: ["junior", "mid", "senior"],
    estimatedTime: 300,
    tags: ["closures", "functions", "scope"],
    idealAnswer: {
      keyPoints: [
        "A closure is a function that has access to variables in its outer scope",
        "Inner function maintains reference to outer variables",
        "Useful for data privacy and creating specialized functions",
        "Example with counter or module pattern",
      ],
    },
    evaluationCriteria: {
      technical: { required: true, weight: 0.7 },
      communication: { required: true, weight: 0.3 },
    },
  },

  // Technical - React
  {
    text: "What are React Hooks and why were they introduced?",
    category: "react",
    type: "technical",
    difficulty: "intermediate",
    experienceLevel: ["junior", "mid", "senior"],
    estimatedTime: 240,
    tags: ["hooks", "state-management", "functional-components"],
    idealAnswer: {
      keyPoints: [
        "Hooks allow state and lifecycle in functional components",
        "Introduced to solve issues with class components",
        "Enable better code reuse and composition",
        "Common hooks: useState, useEffect, useContext",
      ],
    },
  },

  // Behavioral
  {
    text: "Tell me about a time when you had to work with a difficult team member. How did you handle it?",
    category: "teamwork",
    type: "behavioral",
    difficulty: "beginner",
    experienceLevel: ["entry", "junior", "mid", "senior"],
    estimatedTime: 300,
    tags: ["conflict-resolution", "communication", "teamwork"],
    idealAnswer: {
      keyPoints: [
        "Specific situation described using STAR method",
        "Showed empathy and understanding",
        "Took proactive steps to resolve conflict",
        "Focused on project success over personal issues",
        "What was learned from the experience",
      ],
    },
    evaluationCriteria: {
      technical: { required: false, weight: 0.0 },
      communication: { required: true, weight: 0.5 },
      problemSolving: { required: true, weight: 0.5 },
    },
  },

  {
    text: "Describe a challenging project you worked on and how you overcame obstacles.",
    category: "problem-solving",
    type: "behavioral",
    difficulty: "intermediate",
    experienceLevel: ["junior", "mid", "senior", "lead"],
    estimatedTime: 360,
    tags: ["project-management", "problem-solving", "leadership"],
    idealAnswer: {
      keyPoints: [
        "Clear project description and challenges",
        "Problem-solving approach explained",
        "Collaboration and resource utilization",
        "Measurable outcomes achieved",
        "Lessons learned and applied",
      ],
    },
  },

  // System Design
  {
    text: "Design a URL shortening service like bit.ly. What components would you need?",
    category: "system-design",
    type: "system-design",
    difficulty: "advanced",
    experienceLevel: ["mid", "senior", "lead"],
    estimatedTime: 900,
    tags: ["architecture", "scalability", "databases"],
    idealAnswer: {
      keyPoints: [
        "URL encoding/decoding service",
        "Database design for mappings",
        "Caching strategy for popular URLs",
        "Load balancing considerations",
        "Analytics and monitoring",
        "Rate limiting and security",
      ],
    },
  },

  // More technical questions
  {
    text: "What is the difference between SQL and NoSQL databases? When would you use each?",
    category: "database",
    type: "technical",
    difficulty: "intermediate",
    experienceLevel: ["junior", "mid", "senior"],
    estimatedTime: 240,
    tags: ["databases", "sql", "nosql", "architecture"],
    idealAnswer: {
      keyPoints: [
        "SQL: structured, ACID compliance, relationships",
        "NoSQL: flexible schema, horizontal scaling, different types",
        "Use SQL for complex relationships and transactions",
        "Use NoSQL for scalability and flexible data models",
      ],
    },
  },

  {
    text: "Explain the concept of REST API and its principles.",
    category: "web-development",
    type: "technical",
    difficulty: "beginner",
    experienceLevel: ["entry", "junior", "mid"],
    estimatedTime: 300,
    tags: ["api", "rest", "http", "web-services"],
    idealAnswer: {
      keyPoints: [
        "Representational State Transfer",
        "Stateless communication",
        "Resource-based URLs",
        "HTTP methods (GET, POST, PUT, DELETE)",
        "JSON/XML data format",
        "Status codes for responses",
      ],
    },
  },

  // More behavioral questions
  {
    text: "How do you prioritize tasks when you have multiple deadlines?",
    category: "adaptability",
    type: "behavioral",
    difficulty: "beginner",
    experienceLevel: ["entry", "junior", "mid", "senior"],
    estimatedTime: 240,
    tags: ["time-management", "prioritization", "deadlines"],
    idealAnswer: {
      keyPoints: [
        "Assessment of urgency vs importance",
        "Communication with stakeholders",
        "Breaking down complex tasks",
        "Use of tools and frameworks",
        "Regular re-evaluation of priorities",
      ],
    },
  },

  {
    text: "Tell me about a time you made a mistake at work. How did you handle it?",
    category: "adaptability",
    type: "behavioral",
    difficulty: "intermediate",
    experienceLevel: ["junior", "mid", "senior"],
    estimatedTime: 300,
    tags: ["accountability", "problem-solving", "learning"],
    idealAnswer: {
      keyPoints: [
        "Acknowledgment of mistake without excuses",
        "Immediate steps taken to mitigate impact",
        "Communication with affected parties",
        "Process improvements implemented",
        "Learning outcomes and prevention measures",
      ],
    },
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mockmate"
    );
    console.log("Connected to MongoDB");

    // Clear existing questions
    await Question.deleteMany({});
    console.log("Cleared existing questions");

    // Insert sample questions
    const insertedQuestions = await Question.insertMany(sampleQuestions);
    console.log(`Inserted ${insertedQuestions.length} questions`);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
