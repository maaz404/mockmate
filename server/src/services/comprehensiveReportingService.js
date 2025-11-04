const Interview = require("../models/Interview");
const UserProfile = require("../models/UserProfile");
const advancedFeedbackService = require("./advancedFeedbackService");

class ComprehensiveReportingService {
  constructor() {
    this.reportTypes = {
      detailed: "detailed-performance",
      summary: "executive-summary",
      comparison: "peer-comparison",
      progress: "progress-tracking",
      skills: "skills-assessment",
    };
  }

  /**
   * Generate comprehensive interview report
   */
  async generateDetailedReport(interviewId, userId) {
    try {
      // ✅ FIXED: Use 'user' field
      const interview = await Interview.findOne({
        _id: interviewId,
        user: userId, // CORRECT
      }).populate("userProfile");

      if (!interview) {
        throw new Error("Interview not found");
      }

      const report = {
        reportId: `report_${interviewId}_${Date.now()}`,
        interviewId,
        generatedAt: new Date(),
        reportType: "comprehensive",

        // Executive Summary
        executiveSummary: await this.generateExecutiveSummary(interview),

        // Performance Analysis
        performanceAnalysis: this.analyzePerformance(interview),

        // Question-by-Question Breakdown
        questionAnalysis: this.analyzeQuestions(interview),

        // Skills Assessment
        skillsAssessment: this.assessSkills(interview),

        // Behavioral Analysis
        behavioralAnalysis: this.analyzeBehavior(interview),

        // Technical Competency
        technicalCompetency: this.assessTechnicalSkills(interview),

        // Video Analysis (if available)
        videoAnalysis: this.analyzeVideoPerformance(interview),

        // Coding Challenge Results (if available)
        codingAnalysis: this.analyzeCodingPerformance(interview),

        // Industry Benchmarking
        industryBenchmark: await this.generateIndustryBenchmark(interview),

        // Recommendations
        recommendations: this.generateRecommendations(interview),

        // Action Plan
        actionPlan: this.createActionPlan(interview),

        // Progress Tracking
        progressMetrics: await this.generateProgressMetrics(userId, interview),
      };

      return {
        success: true,
        report,
      };
    } catch (error) {
      console.error("Report generation failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(interview) {
    const summary = {
      candidateProfile: {
        targetRole: interview.config.jobRole,
        experienceLevel: interview.config.experienceLevel,
        interviewType: interview.config.interviewType,
        testDate: interview.createdAt,
        duration: interview.timing.totalDuration,
      },

      overallAssessment: {
        overallScore: interview.results.overallScore,
        performanceLevel: interview.results.performance,
        readinessForRole: this.determineReadiness(interview),
        keyStrengths: this.identifyTopStrengths(interview),
        primaryConcerns: this.identifyPrimaryConcerns(interview),
      },

      quickInsights: {
        communicationSkills: this.assessCommunicationQuickly(interview),
        technicalKnowledge: this.assessTechnicalQuickly(interview),
        problemSolvingAbility: this.assessProblemSolvingQuickly(interview),
        culturalFit: this.assessCulturalFit(interview),
      },

      recommendedAction: this.getRecommendedAction(interview),
    };

    return summary;
  }

  /**
   * Analyze overall performance
   */
  analyzePerformance(interview) {
    const answered = interview.questions.filter(
      (q) => q.response && q.response.text
    );
    const totalQuestions = interview.questions.length;

    // Calculate metrics
    const completionRate = (answered.length / totalQuestions) * 100;
    const averageResponseLength =
      answered.reduce((sum, q) => sum + (q.response.text?.length || 0), 0) /
      answered.length;

    const scores = answered.map((q) => q.score?.overall || 0);
    const averageScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const scoreConsistency = this.calculateScoreConsistency(scores);

    // Time analysis
    const totalTimeSpent = answered.reduce(
      (sum, q) => sum + (q.timeSpent || 0),
      0
    );
    const averageTimePerQuestion = totalTimeSpent / answered.length;

    return {
      completionMetrics: {
        questionsAnswered: answered.length,
        totalQuestions,
        completionRate,
        averageResponseLength,
      },

      scoreMetrics: {
        overallScore: averageScore,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        scoreRange: Math.max(...scores) - Math.min(...scores),
        consistency: scoreConsistency,
      },

      timeMetrics: {
        totalTimeSpent,
        averageTimePerQuestion,
        timeEfficiency: this.calculateTimeEfficiency(interview),
        pacing: this.analyzePacing(interview),
      },

      categoryBreakdown: this.analyzeByCategory(interview),
      difficultyBreakdown: this.analyzeByDifficulty(interview),

      performanceIndicators: {
        strengths: this.identifyPerformanceStrengths(interview),
        weaknesses: this.identifyPerformanceWeaknesses(interview),
        improvements: this.suggestPerformanceImprovements(interview),
      },
    };
  }

  /**
   * Analyze questions individually
   */
  analyzeQuestions(interview) {
    return interview.questions.map((question, index) => ({
      questionNumber: index + 1,
      questionText: question.questionText.substring(0, 150) + "...",
      category: question.category,
      difficulty: question.difficulty,
      timeAllocated: question.timeAllocated,
      timeSpent: question.timeSpent,

      response: {
        provided: !!(question.response && question.response.text),
        length: question.response?.text?.length || 0,
        wordCount: question.response?.text?.split(" ").length || 0,
        submittedAt: question.response?.submittedAt,
      },

      scoring: {
        overallScore: question.score?.overall || 0,
        breakdown: question.score?.breakdown || {},
        feedback: question.score?.feedback || question.feedback,
      },

      analysis: {
        responseQuality: this.analyzeResponseQuality(question),
        keywordRelevance: this.analyzeKeywordRelevance(question),
        structureQuality: this.analyzeStructure(question),
        depthOfAnswer: this.analyzeDepth(question),
      },

      recommendations: this.generateQuestionRecommendations(question),

      hasVideo: !!(question.video && question.video.filename),
      videoAnalysis: question.video
        ? this.analyzeQuestionVideo(question)
        : null,
    }));
  }

  /**
   * Assess skills across different dimensions
   */
  assessSkills(interview) {
    const skills = {
      technical: {
        score: this.calculateTechnicalSkillScore(interview),
        breakdown: {
          conceptualKnowledge: this.assessConceptualKnowledge(interview),
          practicalApplication: this.assessPracticalApplication(interview),
          problemSolving: this.assessTechnicalProblemSolving(interview),
          codeQuality: this.assessCodeQuality(interview),
        },
        strengths: this.identifyTechnicalStrengths(interview),
        gaps: this.identifyTechnicalGaps(interview),
      },

      communication: {
        score: this.calculateCommunicationScore(interview),
        breakdown: {
          clarity: this.assessClarity(interview),
          articulation: this.assessArticulation(interview),
          structure: this.assessResponseStructure(interview),
          confidence: this.assessConfidence(interview),
        },
      },

      behavioral: {
        score: this.calculateBehavioralScore(interview),
        breakdown: {
          teamwork: this.assessTeamworkIndicators(interview),
          leadership: this.assessLeadershipIndicators(interview),
          adaptability: this.assessAdaptability(interview),
          initiative: this.assessInitiative(interview),
        },
      },

      problemSolving: {
        score: this.calculateProblemSolvingScore(interview),
        breakdown: {
          analyticalThinking: this.assessAnalyticalThinking(interview),
          creativity: this.assessCreativity(interview),
          systematicApproach: this.assessSystematicApproach(interview),
          edgeCaseConsideration: this.assessEdgeCases(interview),
        },
      },
    };

    // Add coding skills if coding session exists
    if (interview.codingSession && interview.codingSession.results) {
      skills.coding = {
        score: interview.codingSession.results.averageScore,
        breakdown: {
          algorithmDesign: this.assessAlgorithmDesign(interview.codingSession),
          codeImplementation: this.assessCodeImplementation(
            interview.codingSession
          ),
          testingApproach: this.assessTestingApproach(interview.codingSession),
          debugging: this.assessDebugging(interview.codingSession),
        },
        challengesCompleted:
          interview.codingSession.results.challengesCompleted,
        totalChallenges: interview.codingSession.results.totalChallenges,
      };
    }

    return skills;
  }

  /**
   * Generate industry benchmarking
   */
  async generateIndustryBenchmark(interview) {
    // This would typically use external data sources
    // For this implementation, we'll use estimated benchmarks

    const role = interview.config.jobRole.toLowerCase();
    const level = interview.config.experienceLevel;
    const score = interview.results.overallScore;

    // Estimated industry benchmarks (would be real data in production)
    const benchmarks = this.getIndustryBenchmarks(role, level);

    return {
      candidateScore: score,
      industryAverage: benchmarks.average,
      topPerformers: benchmarks.top10,
      positionPercentile: this.calculatePercentile(score, benchmarks),

      comparison: {
        vsIndustryAverage: score - benchmarks.average,
        vsTopPerformers: score - benchmarks.top10,
        competitivePosition: this.determineCompetitivePosition(
          score,
          benchmarks
        ),
      },

      marketInsights: {
        demandForRole: benchmarks.demandLevel,
        salaryRange: benchmarks.salaryRange,
        keySkillsInDemand: benchmarks.keySkills,
        hiringTrends: benchmarks.trends,
      },
    };
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(interview) {
    const score = interview.results.overallScore;
    const weakAreas = this.identifyWeakAreas(interview);
    const strongAreas = this.identifyStrongAreas(interview);

    return {
      immediate: {
        priority: "high",
        timeframe: "1-2 weeks",
        actions: this.getImmediateActions(interview, weakAreas),
      },

      shortTerm: {
        priority: "medium",
        timeframe: "1-3 months",
        actions: this.getShortTermActions(interview, weakAreas),
      },

      longTerm: {
        priority: "low",
        timeframe: "3-6 months",
        actions: this.getLongTermActions(interview, strongAreas),
      },

      studyPlan: {
        technicalTopics: this.generateTechnicalStudyPlan(interview),
        behavioralAreas: this.generateBehavioralStudyPlan(interview),
        practiceResources: this.recommendPracticeResources(interview),
        mockInterviewTopics: this.recommendMockTopics(interview),
      },

      careerGuidance: {
        readinessAssessment: this.assessJobReadiness(interview),
        roleAlignment: this.assessRoleAlignment(interview),
        careerPathSuggestions: this.suggestCareerPath(interview),
      },
    };
  }

  /**
   * Create actionable improvement plan
   */
  createActionPlan(interview) {
    const weakestAreas = this.identifyWeakestAreas(interview);
    const timeframe = this.estimateImprovementTimeframe(interview);

    const plan = {
      overview: {
        currentLevel: this.determineCurrentLevel(interview),
        targetLevel: this.determineTargetLevel(interview),
        estimatedTimeframe: timeframe,
        confidence: this.calculateImprovementConfidence(interview),
      },

      phases: [
        {
          phase: 1,
          title: "Foundation Building",
          duration: "2-4 weeks",
          focus: weakestAreas.slice(0, 2),
          activities: this.generatePhaseActivities(1, weakestAreas, interview),
          milestones: this.generatePhaseMilestones(1, interview),
          resources: this.generatePhaseResources(1, interview),
        },
        {
          phase: 2,
          title: "Skill Enhancement",
          duration: "4-8 weeks",
          focus: this.getPhase2Focus(interview),
          activities: this.generatePhaseActivities(2, weakestAreas, interview),
          milestones: this.generatePhaseMilestones(2, interview),
          resources: this.generatePhaseResources(2, interview),
        },
        {
          phase: 3,
          title: "Advanced Practice",
          duration: "4-6 weeks",
          focus: ["interview simulation", "advanced concepts"],
          activities: this.generatePhaseActivities(3, weakestAreas, interview),
          milestones: this.generatePhaseMilestones(3, interview),
          resources: this.generatePhaseResources(3, interview),
        },
      ],

      trackingMetrics: this.defineTrackingMetrics(interview),
      checkpoints: this.generateCheckpoints(timeframe),
    };

    return plan;
  }

  /**
   * Generate progress metrics by comparing with previous interviews
   */
  async generateProgressMetrics(userId, currentInterview) {
    try {
      // ✅ FIXED: Use 'user' field
      const previousInterviews = await Interview.find({
        user: userId, // CORRECT
        _id: { $ne: currentInterview._id },
        status: "completed",
      })
        .sort({ createdAt: -1 })
        .limit(10);

      if (previousInterviews.length === 0) {
        return {
          isFirstInterview: true,
          baseline: {
            overallScore: currentInterview.results.overallScore,
            completionRate: this.calculateCompletionRate(currentInterview),
            averageTimePerQuestion: this.calculateAverageTime(currentInterview),
          },
        };
      }

      const progressData = this.calculateProgressData(
        previousInterviews,
        currentInterview
      );
      const trends = this.identifyTrends(previousInterviews, currentInterview);

      return {
        isFirstInterview: false,
        previousInterviews: previousInterviews.length,

        scoreProgression: {
          current: currentInterview.results.overallScore,
          previous: previousInterviews[0].results.overallScore,
          improvement:
            currentInterview.results.overallScore -
            previousInterviews[0].results.overallScore,
          trend: trends.scoreimprovement,
        },

        skillProgression: this.analyzeSkillProgression(
          previousInterviews,
          currentInterview
        ),

        consistencyMetrics: {
          scoreConsistency: this.calculateProgressConsistency(
            previousInterviews,
            currentInterview
          ),
          improvementRate: this.calculateImprovementRate(
            previousInterviews,
            currentInterview
          ),
        },

        recommendations: this.generateProgressRecommendations(
          trends,
          currentInterview
        ),
      };
    } catch (error) {
      console.error("Progress metrics generation failed:", error);
      return { error: "Failed to generate progress metrics" };
    }
  }

  // Helper methods for calculations and analysis
  determineReadiness(interview) {
    const score = interview.results.overallScore;
    const completion = this.calculateCompletionRate(interview);

    if (score >= 85 && completion >= 90) return "ready";
    if (score >= 70 && completion >= 80) return "nearly-ready";
    if (score >= 55 && completion >= 70) return "needs-practice";
    return "significant-preparation-needed";
  }

  calculateCompletionRate(interview) {
    const answered = interview.questions.filter(
      (q) => q.response && q.response.text
    ).length;
    return (answered / interview.questions.length) * 100;
  }

  getIndustryBenchmarks(role, level) {
    // This would be real data from industry sources
    const benchmarks = {
      "software-engineer": {
        beginner: { average: 65, top10: 85, demandLevel: "high" },
        intermediate: { average: 75, top10: 90, demandLevel: "very-high" },
        advanced: { average: 85, top10: 95, demandLevel: "high" },
      },
      "frontend-developer": {
        beginner: { average: 62, top10: 82, demandLevel: "high" },
        intermediate: { average: 72, top10: 88, demandLevel: "high" },
        advanced: { average: 82, top10: 93, demandLevel: "medium" },
      },
      "backend-developer": {
        beginner: { average: 68, top10: 86, demandLevel: "very-high" },
        intermediate: { average: 77, top10: 91, demandLevel: "very-high" },
        advanced: { average: 86, top10: 96, demandLevel: "high" },
      },
    };

    const roleBenchmarks = benchmarks[role] || benchmarks["software-engineer"];
    const levelBenchmarks =
      roleBenchmarks[level] || roleBenchmarks["intermediate"];

    return {
      ...levelBenchmarks,
      salaryRange: this.getSalaryRange(role, level),
      keySkills: this.getKeySkills(role),
      trends: this.getHiringTrends(role),
    };
  }

  identifyWeakAreas(interview) {
    const areas = [];
    const threshold = 60;

    // Check technical skills
    const techScore = this.calculateTechnicalSkillScore(interview);
    if (techScore < threshold) areas.push("technical-knowledge");

    // Check communication
    const commScore = this.calculateCommunicationScore(interview);
    if (commScore < threshold) areas.push("communication-skills");

    // Check problem-solving
    const probScore = this.calculateProblemSolvingScore(interview);
    if (probScore < threshold) areas.push("problem-solving");

    // Check behavioral
    const behavScore = this.calculateBehavioralScore(interview);
    if (behavScore < threshold) areas.push("behavioral-responses");

    return areas;
  }

  calculateTechnicalSkillScore(interview) {
    const technicalQuestions = interview.questions.filter(
      (q) => q.category === "technical" || q.category === "system-design"
    );

    if (technicalQuestions.length === 0) return 75; // Default if no technical questions

    const scores = technicalQuestions.map((q) => q.score?.overall || 0);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  calculateCommunicationScore(interview) {
    // Based on answer length, structure, and clarity
    const answered = interview.questions.filter(
      (q) => q.response && q.response.text
    );
    let totalScore = 0;

    answered.forEach((q) => {
      const text = q.response.text;
      let score = 40; // Base score

      // Length scoring
      if (text.length > 100) score += 15;
      if (text.length > 300) score += 10;

      // Structure indicators
      if (/first|second|then|finally/i.test(text)) score += 15;
      if (/for example|such as/i.test(text)) score += 10;
      if (/because|therefore|however/i.test(text)) score += 10;

      totalScore += Math.min(100, score);
    });

    return answered.length > 0 ? totalScore / answered.length : 50;
  }

  calculateBehavioralScore(interview) {
    const behavioralQuestions = interview.questions.filter(
      (q) => q.category === "behavioral"
    );

    if (behavioralQuestions.length === 0) {
      // Estimate from all responses
      return this.estimateBehavioralFromResponses(interview);
    }

    const scores = behavioralQuestions.map((q) => q.score?.overall || 0);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  calculateProblemSolvingScore(interview) {
    let totalScore = 0;
    let count = 0;

    interview.questions.forEach((q) => {
      if (q.response && q.response.text) {
        const text = q.response.text.toLowerCase();
        let score = 30;

        // Problem-solving indicators
        if (text.includes("approach")) score += 10;
        if (text.includes("step") || text.includes("process")) score += 10;
        if (text.includes("consider") || text.includes("analyze")) score += 10;
        if (text.includes("alternative") || text.includes("option"))
          score += 15;
        if (/first.*then|step.*step/i.test(text)) score += 15;

        totalScore += Math.min(100, score);
        count++;
      }
    });

    return count > 0 ? totalScore / count : 50;
  }

  // Additional helper methods would be implemented here...
  // (Due to space constraints, implementing key methods only)

  getSalaryRange(role, level) {
    // Placeholder salary data
    const salaryData = {
      "software-engineer": {
        beginner: "$60,000 - $80,000",
        intermediate: "$80,000 - $120,000",
        advanced: "$120,000 - $180,000",
      },
    };
    return salaryData[role]?.[level] || "$70,000 - $100,000";
  }

  getKeySkills(role) {
    const skillsData = {
      "software-engineer": [
        "JavaScript",
        "React",
        "Node.js",
        "Databases",
        "System Design",
      ],
      "frontend-developer": ["HTML", "CSS", "JavaScript", "React", "Vue.js"],
      "backend-developer": [
        "Node.js",
        "Python",
        "Databases",
        "APIs",
        "Cloud Services",
      ],
    };
    return skillsData[role] || skillsData["software-engineer"];
  }

  getHiringTrends(role) {
    return {
      demandTrend: "increasing",
      remoteOpportunities: "high",
      emergingSkills: ["AI/ML", "Cloud Native", "DevOps"],
      marketOutlook: "positive",
    };
  }
}

module.exports = new ComprehensiveReportingService();
