// Curated fallback questions for when AI service is unavailable
module.exports = [
  // JavaScript Technical Questions
  {
    text: "Explain the concept of closures in JavaScript and provide a practical example.",
    type: "technical",
    category: "javascript",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: [
        "Understands scope",
        "Provides correct example",
        "Explains practical use",
      ],
      communication: ["Clear explanation", "Good structure"],
      problemSolving: ["Shows practical application", "Considers use cases"],
    },
    timeEstimate: 4,
  },
  {
    text: "What are the differences between `let`, `const`, and `var` in JavaScript?",
    type: "technical",
    category: "javascript",
    difficulty: "beginner",
    evaluationCriteria: {
      technical: [
        "Explains hoisting",
        "Understands block scope",
        "Knows mutability rules",
      ],
      communication: ["Organizes differences clearly", "Uses examples"],
      problemSolving: ["Provides use cases", "Understands implications"],
    },
    timeEstimate: 3,
  },
  {
    text: "How does the event loop work in JavaScript?",
    type: "technical",
    category: "javascript",
    difficulty: "advanced",
    evaluationCriteria: {
      technical: [
        "Understands call stack",
        "Explains callback queue",
        "Mentions microtasks",
      ],
      communication: [
        "Clear step-by-step explanation",
        "Uses diagrams if needed",
      ],
      problemSolving: ["Explains async behavior", "Provides examples"],
    },
    timeEstimate: 5,
  },

  // React Technical Questions
  {
    text: "What are React Hooks and how do they differ from class components?",
    type: "technical",
    category: "react",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: [
        "Explains hook concept",
        "Compares with classes",
        "Mentions common hooks",
      ],
      communication: ["Clear comparison", "Good examples"],
      problemSolving: ["Shows practical benefits", "Discusses migration"],
    },
    timeEstimate: 4,
  },
  {
    text: "Explain the virtual DOM and how React uses it for performance optimization.",
    type: "technical",
    category: "react",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: [
        "Understands virtual DOM concept",
        "Explains diffing",
        "Mentions reconciliation",
      ],
      communication: ["Clear explanation of process", "Uses analogies"],
      problemSolving: [
        "Explains performance benefits",
        "Discusses optimization",
      ],
    },
    timeEstimate: 4,
  },
  {
    text: "How would you optimize a React application for better performance?",
    type: "technical",
    category: "react",
    difficulty: "advanced",
    evaluationCriteria: {
      technical: [
        "Mentions memoization",
        "Discusses code splitting",
        "Explains profiling",
      ],
      communication: ["Structured approach", "Prioritizes solutions"],
      problemSolving: [
        "Comprehensive optimization strategy",
        "Considers trade-offs",
      ],
    },
    timeEstimate: 5,
  },

  // Node.js Technical Questions
  {
    text: "What is the event-driven architecture in Node.js and how does it work?",
    type: "technical",
    category: "nodejs",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: [
        "Explains event emitters",
        "Understands non-blocking I/O",
        "Mentions EventLoop",
      ],
      communication: ["Clear architectural explanation", "Good examples"],
      problemSolving: ["Shows practical applications", "Discusses benefits"],
    },
    timeEstimate: 4,
  },
  {
    text: "How would you handle errors in a Node.js application?",
    type: "technical",
    category: "nodejs",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: [
        "Mentions try-catch",
        "Discusses error events",
        "Explains uncaught exceptions",
      ],
      communication: ["Structured error handling approach", "Clear examples"],
      problemSolving: [
        "Comprehensive error strategy",
        "Considers different error types",
      ],
    },
    timeEstimate: 4,
  },

  // Behavioral Questions
  {
    text: "Tell me about a challenging project you worked on. What made it challenging and how did you overcome the obstacles?",
    type: "behavioral",
    category: "general",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: ["Shows technical depth", "Explains technical challenges"],
      communication: ["STAR method", "Clear narrative", "Good storytelling"],
      problemSolving: [
        "Shows problem-solving approach",
        "Demonstrates learning",
      ],
    },
    timeEstimate: 5,
  },
  {
    text: "Describe a time when you had to work with a difficult team member. How did you handle the situation?",
    type: "behavioral",
    category: "teamwork",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: ["Shows understanding of team dynamics"],
      communication: ["Professional approach", "Clear communication"],
      problemSolving: ["Conflict resolution", "Positive outcome"],
    },
    timeEstimate: 4,
  },
  {
    text: "Tell me about a time when you had to learn a new technology quickly. How did you approach it?",
    type: "behavioral",
    category: "learning",
    difficulty: "beginner",
    evaluationCriteria: {
      technical: ["Shows learning methodology", "Demonstrates adaptability"],
      communication: ["Clear learning process", "Good examples"],
      problemSolving: ["Systematic approach", "Shows initiative"],
    },
    timeEstimate: 4,
  },
  {
    text: "Describe a situation where you had to make a technical decision with incomplete information.",
    type: "behavioral",
    category: "decision-making",
    difficulty: "advanced",
    evaluationCriteria: {
      technical: ["Shows technical judgment", "Risk assessment"],
      communication: ["Clear decision-making process", "Explains reasoning"],
      problemSolving: ["Handles uncertainty", "Shows pragmatism"],
    },
    timeEstimate: 5,
  },

  // System Design Questions
  {
    text: "How would you design a URL shortener service like bit.ly?",
    type: "system-design",
    category: "system-design",
    difficulty: "advanced",
    evaluationCriteria: {
      technical: [
        "Database design",
        "Scalability considerations",
        "API design",
      ],
      communication: ["Systematic approach", "Clear architecture"],
      problemSolving: ["Handles scale", "Considers trade-offs"],
    },
    timeEstimate: 8,
  },
  {
    text: "Design a chat application that can handle millions of users. What are the key considerations?",
    type: "system-design",
    category: "system-design",
    difficulty: "advanced",
    evaluationCriteria: {
      technical: ["Real-time communication", "Database design", "Scalability"],
      communication: ["Clear system overview", "Good diagrams"],
      problemSolving: ["Handles concurrent users", "Performance optimization"],
    },
    timeEstimate: 10,
  },

  // Database Questions
  {
    text: "Explain the difference between SQL and NoSQL databases. When would you use each?",
    type: "technical",
    category: "database",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: [
        "Understands ACID properties",
        "Knows NoSQL types",
        "Schema differences",
      ],
      communication: ["Clear comparison", "Good examples"],
      problemSolving: ["Appropriate use cases", "Considers trade-offs"],
    },
    timeEstimate: 4,
  },
  {
    text: "How would you optimize a slow database query?",
    type: "technical",
    category: "database",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: ["Mentions indexing", "Query analysis", "Database profiling"],
      communication: ["Systematic optimization approach", "Clear steps"],
      problemSolving: [
        "Multiple optimization strategies",
        "Performance monitoring",
      ],
    },
    timeEstimate: 4,
  },

  // General Programming Questions
  {
    text: "What is the difference between synchronous and asynchronous programming?",
    type: "technical",
    category: "general",
    difficulty: "beginner",
    evaluationCriteria: {
      technical: [
        "Understands blocking/non-blocking",
        "Explains callbacks/promises",
      ],
      communication: ["Clear definitions", "Good examples"],
      problemSolving: ["Shows practical applications", "Discusses benefits"],
    },
    timeEstimate: 3,
  },
  {
    text: "Explain the concept of RESTful APIs and their principles.",
    type: "technical",
    category: "api-design",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: [
        "Knows REST principles",
        "Understands HTTP methods",
        "Resource-based",
      ],
      communication: ["Clear explanation of principles", "Good examples"],
      problemSolving: ["Practical API design", "Best practices"],
    },
    timeEstimate: 4,
  },

  // Advanced Technical Questions
  {
    text: "How would you implement authentication and authorization in a web application?",
    type: "technical",
    category: "security",
    difficulty: "advanced",
    evaluationCriteria: {
      technical: [
        "JWT vs sessions",
        "Security best practices",
        "OAuth understanding",
      ],
      communication: [
        "Comprehensive security approach",
        "Clear implementation",
      ],
      problemSolving: [
        "Balances security and usability",
        "Considers different scenarios",
      ],
    },
    timeEstimate: 6,
  },
  {
    text: "Explain how you would handle caching in a web application to improve performance.",
    type: "technical",
    category: "performance",
    difficulty: "intermediate",
    evaluationCriteria: {
      technical: [
        "Different caching levels",
        "Cache invalidation",
        "CDN usage",
      ],
      communication: ["Systematic caching strategy", "Clear examples"],
      problemSolving: [
        "Comprehensive caching approach",
        "Performance optimization",
      ],
    },
    timeEstimate: 5,
  },
];
