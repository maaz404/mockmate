const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const Interview = require("../models/Interview");

async function addSampleInterviews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const userId = "user_32SjRWLQzT2Adf0C0MPuO0lezl3";

    const sampleInterviews = [
      {
        userId,
        status: "completed",
        config: {
          jobRole: "Full Stack Developer",
          experienceLevel: "senior",
          interviewType: "technical",
          difficulty: "intermediate",
          duration: 60,
        },
        questions: [
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "Explain React hooks",
            category: "frontend",
            type: "technical",
            difficulty: "intermediate",
          },
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "How do you optimize database queries?",
            category: "backend",
            type: "technical",
            difficulty: "intermediate",
          },
        ],
        results: {
          overallScore: 85,
          breakdown: {
            technical: 88,
            communication: 82,
            problemSolving: 80,
            behavioral: 75,
          },
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        userId,
        status: "completed",
        config: {
          jobRole: "Frontend Developer",
          experienceLevel: "mid",
          interviewType: "technical",
          difficulty: "intermediate",
          duration: 45,
        },
        questions: [
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "What is the virtual DOM?",
            category: "frontend",
            type: "technical",
            difficulty: "beginner",
          },
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "Explain CSS Grid vs Flexbox",
            category: "frontend",
            type: "technical",
            difficulty: "intermediate",
          },
        ],
        results: {
          overallScore: 78,
          breakdown: {
            technical: 80,
            communication: 76,
            problemSolving: 70,
            behavioral: 72,
          },
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId,
        status: "completed",
        config: {
          jobRole: "Backend Java Developer",
          experienceLevel: "lead",
          interviewType: "technical",
          difficulty: "advanced",
          duration: 75,
        },
        questions: [
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "Explain Spring Boot architecture",
            category: "backend",
            type: "technical",
            difficulty: "advanced",
          },
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "How do you handle microservices communication?",
            category: "backend",
            type: "technical",
            difficulty: "advanced",
          },
        ],
        results: {
          overallScore: 92,
          breakdown: {
            technical: 94,
            communication: 90,
            problemSolving: 93,
            behavioral: 88,
          },
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        userId,
        status: "in-progress",
        config: {
          jobRole: "Mobile App Developer",
          experienceLevel: "junior",
          interviewType: "technical",
          difficulty: "intermediate",
          duration: 30,
        },
        questions: [
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "Explain React Native vs Flutter",
            category: "mobile",
            type: "technical",
            difficulty: "intermediate",
          },
        ],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userId,
        status: "scheduled",
        config: {
          jobRole: "DevOps Engineer",
          experienceLevel: "senior",
          interviewType: "technical",
          difficulty: "advanced",
          duration: 50,
        },
        questions: [
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "Explain CI/CD pipelines",
            category: "devops",
            type: "technical",
            difficulty: "advanced",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Delete existing interviews for the user first
    await Interview.deleteMany({ userId });
    console.log("Deleted existing interviews for user");

    // Insert sample interviews
    const result = await Interview.insertMany(sampleInterviews);
    console.log(`Inserted ${result.length} sample interviews`);

    console.log("Sample interviews added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding sample interviews:", error);
    process.exit(1);
  }
}

addSampleInterviews();
