// aiEvaluationWorker.js
// Background worker to process AI evaluation jobs from the queue
const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const evaluationService = require("./../services/evaluationService");
const advancedFeedbackService = require("./../services/advancedFeedbackService");
const aiEvaluationQueue = require("./queue/aiEvaluationQueue");
const Logger = require("../utils/logger");

async function processJob(job) {
  try {
    const { interviewId, questionIndex } = job;
    const interview = await Interview.findById(interviewId);
    if (!interview) throw new Error("Interview not found");
    const question = interview.questions[questionIndex];
    if (!question || !question.response || !question.response.text) {
      throw new Error("No response to evaluate");
    }
    // Evaluate answer with AI
    const aiResult = await evaluationService.evaluateAnswerWithAI(
      question,
      question.response.text,
      interview.config
    );
    // Update question score/feedback
    question.score = aiResult.score;
    question.feedback = aiResult.feedback;
    // Save interview
    await interview.save();
    Logger.info(
      `[AI Evaluation Worker] Evaluated Q${questionIndex} for interview ${interviewId}`
    );
    // Optionally, trigger advanced feedback if all questions are done
    const allEvaluated = interview.questions.every(
      (q) => q.score && q.score.overall != null
    );
    if (allEvaluated) {
      try {
        await advancedFeedbackService.generateAdvancedFeedback(interview);
        Logger.info(
          `[AI Evaluation Worker] Advanced feedback generated for interview ${interviewId}`
        );
      } catch (err) {
        Logger.warn(
          `[AI Evaluation Worker] Advanced feedback failed: ${err.message}`
        );
      }
    }
  } catch (err) {
    Logger.error(`[AI Evaluation Worker] Job failed: ${err.message}`);
  }
}

async function runWorker() {
  Logger.info("[AI Evaluation Worker] Started");
  while (true) {
    if (!aiEvaluationQueue.isEmpty()) {
      const job = aiEvaluationQueue.dequeue();
      await processJob(job);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s poll
    }
  }
}

if (require.main === module) {
  // Connect to DB and start worker if run directly
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => runWorker())
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Failed to connect to MongoDB:", err);
      process.exit(1);
    });
}

module.exports = { runWorker };
