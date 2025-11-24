/**
 * Advanced Interview Analysis Service
 * Provides comprehensive, AI-powered analysis of interview performance
 */

const Logger = require("../utils/logger");

class AdvancedAnalysisService {
  /**
   * Generate comprehensive analysis for completed interview
   * @param {Object} interview - The interview document
   * @param {Object} userProfile - User profile for personalization
   * @returns {Object} - Detailed analysis with insights
   */
  async generateComprehensiveAnalysis(interview, userProfile = null) {
    try {
      const questions = interview.questions || [];
      const results = interview.results || {};
      const config = interview.config || {};

      // Calculate all metrics
      const performanceMetrics = this.calculatePerformanceMetrics(questions);
      const skillAssessment = this.analyzeSkillsComprehensively(
        questions,
        config
      );
      const timeAnalysis = this.analyzeTimeManagement(questions);
      const difficultyProgression = this.analyzeDifficultyProgression(
        questions,
        config
      );
      const strengthsAndWeaknesses =
        this.identifyStrengthsAndWeaknesses(questions);
      const actionPlan = this.generateActionPlan(
        strengthsAndWeaknesses,
        skillAssessment,
        userProfile
      );
      const comparativeBenchmarks = this.generateBenchmarks(results, config);
      const interviewInsights = this.generateInsights(
        performanceMetrics,
        skillAssessment,
        timeAnalysis
      );

      return {
        performanceMetrics,
        skillAssessment,
        timeAnalysis,
        difficultyProgression,
        strengthsAndWeaknesses,
        actionPlan,
        comparativeBenchmarks,
        interviewInsights,
        readinessScore: this.calculateReadinessScore(
          performanceMetrics,
          skillAssessment
        ),
        generatedAt: new Date(),
      };
    } catch (error) {
      Logger.error("[AdvancedAnalysis] Generation failed:", error);
      return null;
    }
  }

  /**
   * Calculate comprehensive performance metrics
   */
  calculatePerformanceMetrics(questions) {
    const answered = questions.filter((q) => q.response?.text && !q.skipped);
    const scores = answered
      .map((q) => q.score?.overall || 0)
      .filter((s) => s > 0);

    if (scores.length === 0) {
      return {
        overallScore: 0,
        averageScore: 0,
        medianScore: 0,
        consistency: 0,
        improvement: 0,
        scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
      };
    }

    const sortedScores = [...scores].sort((a, b) => a - b);
    const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate standard deviation for consistency
    const variance =
      scores.reduce(
        (sum, score) => sum + Math.pow(score - averageScore, 2),
        0
      ) / scores.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - stdDev * 2); // Higher is more consistent

    // Calculate improvement trend (first half vs second half)
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const improvement = ((secondAvg - firstAvg) / firstAvg) * 100;

    // Score distribution
    const distribution = {
      excellent: scores.filter((s) => s >= 85).length,
      good: scores.filter((s) => s >= 70 && s < 85).length,
      average: scores.filter((s) => s >= 50 && s < 70).length,
      poor: scores.filter((s) => s < 50).length,
    };

    return {
      overallScore: Math.round(averageScore),
      averageScore: Math.round(averageScore),
      medianScore: Math.round(medianScore),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      consistency: Math.round(consistency),
      improvement: Math.round(improvement),
      scoreDistribution: distribution,
      totalQuestions: questions.length,
      answeredQuestions: answered.length,
      skippedQuestions: questions.filter((q) => q.skipped).length,
    };
  }

  /**
   * Analyze skills comprehensively across multiple dimensions
   */
  analyzeSkillsComprehensively(questions, config) {
    const skillCategories = {
      technical: { questions: [], scores: [], weight: 0.35 },
      communication: { questions: [], scores: [], weight: 0.25 },
      problemSolving: { questions: [], scores: [], weight: 0.25 },
      behavioral: { questions: [], scores: [], weight: 0.15 },
    };

    // Categorize questions and scores
    questions.forEach((q) => {
      if (!q.score?.overall) return;

      const category = this.categorizeQuestion(q);
      if (skillCategories[category]) {
        skillCategories[category].questions.push(q);
        skillCategories[category].scores.push(q.score.overall);
      }
    });

    // Calculate metrics for each category
    const skillAssessment = {};
    Object.keys(skillCategories).forEach((category) => {
      const data = skillCategories[category];
      const scores = data.scores;

      if (scores.length === 0) {
        skillAssessment[category] = {
          score: 0,
          count: 0,
          level: "Not Assessed",
          confidence: 0,
          trend: "stable",
        };
        return;
      }

      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const level = this.getSkillLevel(avgScore);

      // Calculate confidence (based on number of questions)
      const confidence = Math.min(100, (scores.length / 3) * 100);

      // Calculate trend
      const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
      const secondHalf = scores.slice(Math.ceil(scores.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const trend =
        secondAvg > firstAvg + 5
          ? "improving"
          : secondAvg < firstAvg - 5
          ? "declining"
          : "stable";

      skillAssessment[category] = {
        score: Math.round(avgScore),
        count: scores.length,
        level,
        confidence: Math.round(confidence),
        trend,
        strongest: scores.filter((s) => s >= 85).length,
        weakest: scores.filter((s) => s < 60).length,
      };
    });

    return {
      categories: skillAssessment,
      overallLevel: this.calculateOverallSkillLevel(skillAssessment),
      topStrengths: this.identifyTopStrengths(skillAssessment),
      criticalGaps: this.identifyCriticalGaps(skillAssessment),
    };
  }

  /**
   * Analyze time management patterns
   */
  analyzeTimeManagement(questions) {
    const timings = questions
      .filter((q) => q.timeSpent && q.timeAllocated)
      .map((q) => ({
        spent: q.timeSpent,
        allocated: q.timeAllocated,
        ratio: q.timeSpent / q.timeAllocated,
        score: q.score?.overall || 0,
      }));

    if (timings.length === 0) {
      return {
        efficiency: 0,
        pattern: "unknown",
        avgTimePerQuestion: 0,
        suggestions: [],
      };
    }

    const avgRatio =
      timings.reduce((sum, t) => sum + t.ratio, 0) / timings.length;
    const avgTime =
      timings.reduce((sum, t) => sum + t.spent, 0) / timings.length;

    // Determine time management pattern
    let pattern = "balanced";
    let efficiency = 100;

    if (avgRatio > 1.2) {
      pattern = "slow";
      efficiency = Math.max(0, 100 - (avgRatio - 1) * 50);
    } else if (avgRatio < 0.6) {
      pattern = "rushed";
      efficiency = Math.max(0, 100 - (1 - avgRatio) * 30);
    } else {
      efficiency = 100;
    }

    // Analyze correlation between time and quality
    const qualityCorrelation = this.calculateTimeQualityCorrelation(timings);

    return {
      efficiency: Math.round(efficiency),
      pattern,
      avgTimePerQuestion: Math.round(avgTime),
      avgTimeRatio: avgRatio.toFixed(2),
      qualityCorrelation,
      fastAnswers: timings.filter((t) => t.ratio < 0.7).length,
      slowAnswers: timings.filter((t) => t.ratio > 1.3).length,
      suggestions: this.generateTimeManagementSuggestions(
        pattern,
        qualityCorrelation
      ),
    };
  }

  /**
   * Analyze difficulty progression and adaptive performance
   */
  analyzeDifficultyProgression(questions, config) {
    const difficultyMap = {
      beginner: 1,
      easy: 1,
      intermediate: 2,
      medium: 2,
      hard: 3,
      advanced: 3,
      expert: 4,
    };

    const progression = questions.map((q, idx) => ({
      index: idx,
      difficulty: difficultyMap[q.difficulty?.toLowerCase()] || 2,
      score: q.score?.overall || 0,
      skipped: q.skipped || false,
    }));

    // Calculate performance at each difficulty level
    const performanceByDifficulty = {
      beginner: [],
      intermediate: [],
      advanced: [],
    };

    questions.forEach((q) => {
      const diffLevel = q.difficulty?.toLowerCase() || "intermediate";
      const normalized =
        diffLevel === "beginner" || diffLevel === "easy"
          ? "beginner"
          : diffLevel === "advanced" || diffLevel === "hard"
          ? "advanced"
          : "intermediate";
      if (q.score?.overall) {
        performanceByDifficulty[normalized].push(q.score.overall);
      }
    });

    const levelScores = {};
    Object.keys(performanceByDifficulty).forEach((level) => {
      const scores = performanceByDifficulty[level];
      levelScores[level] =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
    });

    return {
      progression,
      performanceByDifficulty: levelScores,
      adaptiveStrength: this.calculateAdaptiveStrength(levelScores),
      recommendedLevel: this.recommendDifficultyLevel(levelScores),
      consistencyAcrossLevels: this.calculateLevelConsistency(levelScores),
    };
  }

  /**
   * Identify strengths and weaknesses with detailed analysis
   */
  identifyStrengthsAndWeaknesses(questions) {
    const answered = questions.filter(
      (q) => q.response?.text && q.score?.overall != null
    );

    // Group by category and calculate averages
    const categoryPerformance = {};
    answered.forEach((q) => {
      const category = q.category || q.type || "general";
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = { scores: [], questions: [] };
      }
      categoryPerformance[category].scores.push(q.score.overall);
      categoryPerformance[category].questions.push(q);
    });

    // Identify top and bottom performers
    const categories = Object.keys(categoryPerformance).map((cat) => ({
      category: cat,
      avgScore:
        categoryPerformance[cat].scores.reduce((a, b) => a + b, 0) /
        categoryPerformance[cat].scores.length,
      count: categoryPerformance[cat].scores.length,
      questions: categoryPerformance[cat].questions,
    }));

    categories.sort((a, b) => b.avgScore - a.avgScore);

    const strengths = categories.slice(0, 3).map((cat) => ({
      area: cat.category,
      score: Math.round(cat.avgScore),
      count: cat.count,
      description: this.generateStrengthDescription(cat),
      examples: cat.questions.slice(0, 2).map((q) => q.questionText),
    }));

    const weaknesses = categories
      .slice(-3)
      .reverse()
      .map((cat) => ({
        area: cat.category,
        score: Math.round(cat.avgScore),
        count: cat.count,
        description: this.generateWeaknessDescription(cat),
        improvementSuggestions: this.generateImprovementSuggestions(cat),
      }));

    return {
      strengths: strengths.filter((s) => s.score >= 60),
      weaknesses: weaknesses.filter((w) => w.score < 70),
      balanced: categories
        .filter((c) => c.avgScore >= 70 && c.avgScore < 85)
        .map((c) => c.category),
    };
  }

  /**
   * Generate personalized action plan
   */
  generateActionPlan(strengthsAndWeaknesses, skillAssessment, userProfile) {
    const actions = [];
    const timeline = { immediate: [], shortTerm: [], longTerm: [] };

    // Add actions based on weaknesses
    strengthsAndWeaknesses.weaknesses.forEach((weakness) => {
      if (weakness.score < 50) {
        actions.push({
          priority: "high",
          area: weakness.area,
          action: `Focus on ${weakness.area} fundamentals`,
          resources: this.suggestResources(weakness.area, "beginner"),
          estimatedTime: "2-4 weeks",
          timeline: "immediate",
        });
      } else {
        actions.push({
          priority: "medium",
          area: weakness.area,
          action: `Practice advanced ${weakness.area} scenarios`,
          resources: this.suggestResources(weakness.area, "intermediate"),
          estimatedTime: "3-6 weeks",
          timeline: "shortTerm",
        });
      }
    });

    // Add actions for skill improvement
    Object.keys(skillAssessment.categories).forEach((skill) => {
      const data = skillAssessment.categories[skill];
      if (data.score < 70 && data.count > 0) {
        actions.push({
          priority: data.score < 50 ? "high" : "medium",
          area: skill,
          action: `Improve ${skill} skills through targeted practice`,
          resources: this.suggestResources(skill, data.level),
          estimatedTime: "4-8 weeks",
          timeline: data.score < 50 ? "immediate" : "shortTerm",
        });
      }
    });

    // Organize by timeline
    actions.forEach((action) => {
      timeline[action.timeline].push(action);
    });

    return {
      actions: actions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      timeline,
      estimatedCompletionTime: this.calculateEstimatedTime(actions),
      nextSteps: this.generateNextSteps(actions.slice(0, 3)),
    };
  }

  /**
   * Generate comparative benchmarks
   */
  generateBenchmarks(results, config) {
    const overallScore = results.overallScore || 0;
    const experienceLevel = config.experienceLevel || "intermediate";
    const jobRole = config.jobRole || "general";

    // Benchmark data (in production, this would come from database)
    const benchmarks = {
      beginner: { average: 55, excellent: 75, expert: 85 },
      intermediate: { average: 65, excellent: 80, expert: 90 },
      advanced: { average: 75, excellent: 85, expert: 95 },
    };

    const levelBenchmark =
      benchmarks[experienceLevel] || benchmarks.intermediate;

    let performance = "below average";
    let percentile = 25;

    if (overallScore >= levelBenchmark.expert) {
      performance = "expert";
      percentile = 95;
    } else if (overallScore >= levelBenchmark.excellent) {
      performance = "excellent";
      percentile = 80;
    } else if (overallScore >= levelBenchmark.average) {
      performance = "above average";
      percentile = 60;
    } else if (overallScore >= levelBenchmark.average - 15) {
      performance = "average";
      percentile = 40;
    }

    return {
      yourScore: overallScore,
      averageScore: levelBenchmark.average,
      excellentThreshold: levelBenchmark.excellent,
      expertThreshold: levelBenchmark.expert,
      performance,
      percentile,
      comparison: {
        vsAverage: overallScore - levelBenchmark.average,
        vsExcellent: overallScore - levelBenchmark.excellent,
      },
      industryInsight: this.generateIndustryInsight(
        overallScore,
        jobRole,
        experienceLevel
      ),
    };
  }

  /**
   * Generate actionable insights
   */
  generateInsights(performanceMetrics, skillAssessment, timeAnalysis) {
    const insights = [];

    // Performance insight
    if (performanceMetrics.improvement > 10) {
      insights.push({
        type: "positive",
        category: "Performance",
        title: "Strong Improvement Trend",
        description: `You showed ${Math.round(
          performanceMetrics.improvement
        )}% improvement throughout the interview, demonstrating excellent learning ability.`,
        icon: "📈",
      });
    } else if (performanceMetrics.improvement < -10) {
      insights.push({
        type: "warning",
        category: "Performance",
        title: "Performance Declined",
        description:
          "Consider managing fatigue and maintaining focus throughout longer interviews.",
        icon: "⚠️",
      });
    }

    // Consistency insight
    if (performanceMetrics.consistency > 80) {
      insights.push({
        type: "positive",
        category: "Consistency",
        title: "Highly Consistent Performance",
        description:
          "Your answers maintained a consistent quality level, showing reliability.",
        icon: "🎯",
      });
    }

    // Time management insight
    if (timeAnalysis.pattern === "rushed") {
      insights.push({
        type: "improvement",
        category: "Time Management",
        title: "Rushing Through Answers",
        description:
          "You completed answers quickly. Consider using more time to provide detailed responses.",
        icon: "⏱️",
      });
    } else if (timeAnalysis.pattern === "slow") {
      insights.push({
        type: "improvement",
        category: "Time Management",
        title: "Time Management Needs Attention",
        description:
          "You exceeded time limits on several questions. Practice concise yet complete answers.",
        icon: "⏱️",
      });
    }

    // Skill-specific insights
    Object.keys(skillAssessment.categories).forEach((skill) => {
      const data = skillAssessment.categories[skill];
      if (data.trend === "improving") {
        insights.push({
          type: "positive",
          category: "Skills",
          title: `${
            skill.charAt(0).toUpperCase() + skill.slice(1)
          } Skills Improving`,
          description: `Your ${skill} answers showed improvement throughout the interview.`,
          icon: "📊",
        });
      }
    });

    return insights.slice(0, 6); // Return top 6 insights
  }

  /**
   * Calculate interview readiness score
   */
  calculateReadinessScore(performanceMetrics, skillAssessment) {
    const weights = {
      overallScore: 0.4,
      consistency: 0.2,
      skillBalance: 0.2,
      improvement: 0.2,
    };

    const overallScore = performanceMetrics.overallScore || 0;
    const consistency = performanceMetrics.consistency || 0;
    const improvement = Math.max(
      0,
      Math.min(100, 50 + performanceMetrics.improvement)
    );

    // Calculate skill balance (how even are the skills)
    const skillScores = Object.values(skillAssessment.categories)
      .filter((s) => s.count > 0)
      .map((s) => s.score);
    const avgSkill =
      skillScores.reduce((a, b) => a + b, 0) / skillScores.length;
    const skillVariance =
      skillScores.reduce((sum, s) => sum + Math.pow(s - avgSkill, 2), 0) /
      skillScores.length;
    const skillBalance = Math.max(0, 100 - Math.sqrt(skillVariance));

    const readiness =
      overallScore * weights.overallScore +
      consistency * weights.consistency +
      skillBalance * weights.skillBalance +
      improvement * weights.improvement;

    return {
      score: Math.round(readiness),
      level:
        readiness >= 85
          ? "Ready"
          : readiness >= 70
          ? "Almost Ready"
          : readiness >= 50
          ? "Needs Preparation"
          : "Significant Preparation Needed",
      factors: {
        overallScore: Math.round(overallScore),
        consistency: Math.round(consistency),
        skillBalance: Math.round(skillBalance),
        improvement: Math.round(improvement),
      },
    };
  }

  // Helper methods
  categorizeQuestion(question) {
    const category = (question.category || "").toLowerCase();
    const type = (question.type || "").toLowerCase();

    if (category === "coding" || type === "coding") return "technical";
    if (type === "behavioral") return "behavioral";
    if (type === "technical") return "technical";
    if (category.includes("communication")) return "communication";
    if (category.includes("problem")) return "problemSolving";

    return "technical"; // default
  }

  getSkillLevel(score) {
    if (score >= 90) return "Expert";
    if (score >= 80) return "Advanced";
    if (score >= 70) return "Proficient";
    if (score >= 60) return "Competent";
    if (score >= 50) return "Developing";
    return "Beginner";
  }

  calculateOverallSkillLevel(skillAssessment) {
    const scores = Object.values(skillAssessment)
      .filter((s) => s.count > 0)
      .map((s) => s.score);
    if (scores.length === 0) return "Not Assessed";
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return this.getSkillLevel(avg);
  }

  identifyTopStrengths(skillAssessment) {
    return Object.keys(skillAssessment)
      .filter((skill) => skillAssessment[skill].score >= 75)
      .sort((a, b) => skillAssessment[b].score - skillAssessment[a].score)
      .slice(0, 3);
  }

  identifyCriticalGaps(skillAssessment) {
    return Object.keys(skillAssessment)
      .filter(
        (skill) =>
          skillAssessment[skill].score < 60 && skillAssessment[skill].count > 0
      )
      .sort((a, b) => skillAssessment[a].score - skillAssessment[b].score);
  }

  calculateTimeQualityCorrelation(timings) {
    if (timings.length < 3) return "insufficient data";

    // Simple correlation: do higher scores correspond to optimal time usage?
    const optimalTimed = timings.filter(
      (t) => t.ratio >= 0.7 && t.ratio <= 1.2
    );
    const avgOptimalScore =
      optimalTimed.length > 0
        ? optimalTimed.reduce((sum, t) => sum + t.score, 0) /
          optimalTimed.length
        : 0;

    const allAvgScore =
      timings.reduce((sum, t) => sum + t.score, 0) / timings.length;

    if (avgOptimalScore > allAvgScore + 10) return "positive";
    if (avgOptimalScore < allAvgScore - 10) return "negative";
    return "neutral";
  }

  generateTimeManagementSuggestions(pattern, correlation) {
    const suggestions = [];

    if (pattern === "slow") {
      suggestions.push(
        "Practice structuring answers with clear introduction, body, and conclusion"
      );
      suggestions.push(
        "Set personal time limits for each question type during practice"
      );
    } else if (pattern === "rushed") {
      suggestions.push(
        "Take time to fully understand questions before answering"
      );
      suggestions.push(
        "Use available time to add examples and details to strengthen answers"
      );
    }

    if (correlation === "positive") {
      suggestions.push(
        "Continue your current time management approach - it correlates with better scores"
      );
    }

    return suggestions;
  }

  calculateAdaptiveStrength(levelScores) {
    const levels = Object.keys(levelScores).filter((k) => levelScores[k] > 0);
    if (levels.length < 2) return "insufficient data";

    const scores = levels.map((l) => levelScores[l]);
    const variance =
      scores.reduce(
        (sum, s) =>
          sum + Math.pow(s - scores.reduce((a, b) => a + b) / scores.length, 2),
        0
      ) / scores.length;

    if (variance < 100) return "highly consistent";
    if (variance < 300) return "moderately consistent";
    return "variable";
  }

  recommendDifficultyLevel(levelScores) {
    if (levelScores.advanced >= 80) return "advanced";
    if (levelScores.intermediate >= 75) return "intermediate-advanced";
    if (levelScores.beginner >= 80) return "intermediate";
    return "beginner-intermediate";
  }

  calculateLevelConsistency(levelScores) {
    const scores = Object.values(levelScores).filter((s) => s > 0);
    if (scores.length < 2) return 100;

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    return Math.max(0, 100 - Math.sqrt(variance));
  }

  generateStrengthDescription(category) {
    return `Strong performance in ${
      category.category
    } with an average score of ${Math.round(
      category.avgScore
    )}%. This indicates solid understanding and capability in this area.`;
  }

  generateWeaknessDescription(category) {
    return `${
      category.category
    } needs improvement with an average score of ${Math.round(
      category.avgScore
    )}%. Additional practice and learning would be beneficial.`;
  }

  generateImprovementSuggestions(category) {
    const suggestions = [];
    const area = category.category.toLowerCase();

    if (area.includes("technical")) {
      suggestions.push("Review core technical concepts and data structures");
      suggestions.push(
        "Practice coding challenges on platforms like LeetCode or HackerRank"
      );
      suggestions.push("Work on system design fundamentals");
    } else if (area.includes("communication")) {
      suggestions.push(
        "Practice explaining technical concepts to non-technical audiences"
      );
      suggestions.push(
        "Record yourself answering questions and review for clarity"
      );
      suggestions.push(
        "Work on active listening and structured response frameworks"
      );
    } else if (area.includes("problem")) {
      suggestions.push(
        "Practice breaking down complex problems into smaller components"
      );
      suggestions.push(
        "Study different problem-solving frameworks (e.g., STAR, CAR)"
      );
      suggestions.push("Work on case study analysis");
    } else if (area.includes("behavioral")) {
      suggestions.push("Prepare stories using the STAR method");
      suggestions.push("Reflect on past experiences and extract learnings");
      suggestions.push(
        "Practice discussing conflicts and challenges professionally"
      );
    }

    return suggestions;
  }

  suggestResources(area, level) {
    const resources = {
      technical: [
        {
          name: "LeetCode",
          type: "Practice Platform",
          url: "https://leetcode.com",
        },
        {
          name: "System Design Primer",
          type: "Study Guide",
          url: "https://github.com/donnemartin/system-design-primer",
        },
        {
          name: "Cracking the Coding Interview",
          type: "Book",
          url: "https://www.crackingthecodinginterview.com",
        },
      ],
      communication: [
        {
          name: "Toastmasters",
          type: "Practice Group",
          url: "https://www.toastmasters.org",
        },
        {
          name: "TED Talks on Communication",
          type: "Video Series",
          url: "https://www.ted.com/topics/communication",
        },
      ],
      problemSolving: [
        {
          name: "Case Interview Practice",
          type: "Resource",
          url: "https://www.caseinterview.com",
        },
        {
          name: "Project Euler",
          type: "Problem Set",
          url: "https://projecteuler.net",
        },
      ],
      behavioral: [
        {
          name: "Behavioral Interview Questions Database",
          type: "Guide",
          url: "https://www.themuse.com/advice/behavioral-interview-questions-answers-examples",
        },
        {
          name: "STAR Method Guide",
          type: "Framework",
          url: "https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique",
        },
      ],
    };

    return resources[area] || resources.technical;
  }

  calculateEstimatedTime(actions) {
    // Simple estimation: count weeks
    const immediateWeeks =
      actions.filter((a) => a.timeline === "immediate").length * 3;
    const shortTermWeeks =
      actions.filter((a) => a.timeline === "shortTerm").length * 5;
    const longTermWeeks =
      actions.filter((a) => a.timeline === "longTerm").length * 8;

    const totalWeeks = immediateWeeks + shortTermWeeks + longTermWeeks;
    return `${totalWeeks} weeks`;
  }

  generateNextSteps(topActions) {
    return topActions.map((action, idx) => ({
      step: idx + 1,
      title: action.action,
      description: `Start with ${action.area} - ${action.estimatedTime}`,
      priority: action.priority,
    }));
  }

  generateIndustryInsight(score, jobRole, experienceLevel) {
    if (score >= 85) {
      return `Excellent! You're performing at the top ${
        100 - 85
      }% for ${experienceLevel} ${jobRole} candidates.`;
    } else if (score >= 70) {
      return `Good performance! You're above average for ${experienceLevel} ${jobRole} positions.`;
    } else if (score >= 55) {
      return `You're around the average for ${experienceLevel} ${jobRole} candidates. With focused practice, you can significantly improve.`;
    }
    return `There's room for improvement. Focus on fundamentals to build a stronger foundation for ${jobRole} interviews.`;
  }
}

module.exports = new AdvancedAnalysisService();
