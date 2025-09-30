/* eslint-disable no-console, consistent-return, no-magic-numbers */
const UserProfile = require("../models/UserProfile");
const { clerkClient } = require("@clerk/clerk-sdk-node");
const Interview = require("../models/Interview");
const ScheduledSession = require("../models/ScheduledSession");

// Get or create user profile
const getProfile = async (req, res) => {
  try {
    const { userId } = req.auth;

    let userProfile = await UserProfile.findOne({ clerkUserId: userId });

    if (!userProfile) {
      // Try to get user from Clerk, but don't fail if Clerk is not configured (development mode)
      let clerkUser = null;
      try {
        if (process.env.CLERK_SECRET_KEY) {
          clerkUser = await clerkClient.users.getUser(userId);
        }
      } catch (clerkError) {
        console.error("Clerk API error:", clerkError);
        // In development, continue without Clerk data
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "Continuing without Clerk authentication in development mode"
          );
        } else {
          return res.status(500).json({
            success: false,
            message: "Failed to fetch user data from authentication service",
          });
        }
      }

      // Fallback user data for development
      if (!clerkUser && process.env.NODE_ENV !== "production") {
        clerkUser = {
          emailAddresses: [{ emailAddress: `user-${userId}@example.com` }],
          firstName: "Test",
          lastName: "User",
          profileImageUrl: null,
        };
      }

      if (!clerkUser) {
        return res.status(404).json({
          success: false,
          message: "User not found in authentication service",
        });
      }

      // Create new profile
      userProfile = new UserProfile({
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImage: clerkUser.profileImageUrl,
      });

      await userProfile.save();
    }

    res.json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

// Save onboarding progress
const saveOnboardingProgress = async (req, res) => {
  try {
    const { userId } = req.auth;
    const progressData = req.body;

    console.log("Save onboarding progress - userId:", userId);
    console.log("Progress data:", JSON.stringify(progressData, null, 2));

    // Sanitize data
    if (progressData.professionalInfo) {
      // Handle empty experience
      if (
        !progressData.professionalInfo.experience ||
        progressData.professionalInfo.experience === ""
      ) {
        progressData.professionalInfo.experience = "entry";
      }

      // Ensure arrays are arrays
      if (!Array.isArray(progressData.professionalInfo.skills)) {
        progressData.professionalInfo.skills = [];
      }
      if (!Array.isArray(progressData.professionalInfo.skillsToImprove)) {
        progressData.professionalInfo.skillsToImprove = [];
      }
    }

    if (progressData.interviewGoals) {
      if (!Array.isArray(progressData.interviewGoals.targetCompanies)) {
        progressData.interviewGoals.targetCompanies = [];
      }
    }

    if (progressData.preferences) {
      if (!Array.isArray(progressData.preferences.interviewTypes)) {
        progressData.preferences.interviewTypes = [];
      }
      if (!Array.isArray(progressData.preferences.focusAreas)) {
        progressData.preferences.focusAreas = [];
      }
    }

    // Remove sensitive fields that shouldn't be updated
    delete progressData.clerkUserId;
    delete progressData.email;
    delete progressData.analytics;
    delete progressData.subscription;
    delete progressData.onboardingCompleted; // Don't mark as completed when saving progress

    console.log(
      "Filtered progress data:",
      JSON.stringify(progressData, null, 2)
    );

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      {
        $set: progressData,
      },
      {
        new: true,
        upsert: true,
      }
    );

    console.log("User profile after update:", userProfile);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Calculate completeness but don't save yet (progress save)
    userProfile.calculateCompleteness();

    res.json({
      success: true,
      message: "Onboarding progress saved successfully",
      data: userProfile,
    });
  } catch (error) {
    console.error("Save onboarding progress error:", error);

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to save onboarding progress",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.auth;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.clerkUserId;
    delete updates.email;
    delete updates.analytics;
    delete updates.subscription;

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      {
        ...updates,
      },
      {
        new: true,
      }
    );

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Recalculate completeness
    userProfile.calculateCompleteness();
    await userProfile.save();

    res.json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// Complete onboarding
const completeOnboarding = async (req, res) => {
  try {
    // Get userId from auth - handle different possible formats
    let userId = req.auth?.userId || req.auth?.id || req.auth?.sub;

    console.log("Complete onboarding - req.auth:", req.auth);
    console.log("Complete onboarding - extracted userId:", userId);

    // Fallback for development: use a test user ID if not authenticated
    if (!userId && process.env.NODE_ENV !== "production") {
      console.warn("No userId found in auth, using test user for development");
      userId = "test-user-123";
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let { professionalInfo, preferences, interviewGoals } = req.body;

    // Early validation to match test expectations
    if (!professionalInfo && !preferences) {
      return res.status(400).json({
        success: false,
        message: "Missing required onboarding data",
        details: {
          professionalInfo: "Professional information is required",
          preferences: "Preferences are required",
        },
      });
    }

    if (!professionalInfo) {
      return res.status(400).json({
        success: false,
        message: "Missing required onboarding data",
        details: {
          professionalInfo: "Professional information is required",
          preferences: null,
        },
      });
    }

    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: "Missing required onboarding data",
        details: {
          professionalInfo: null,
          preferences: "Preferences are required",
        },
      });
    }

    // Sanitize and validate data
    if (!professionalInfo) professionalInfo = {};
    if (!preferences) preferences = {};
    if (!interviewGoals) interviewGoals = {};

    // Handle empty experience - set default if empty
    if (!professionalInfo.experience || professionalInfo.experience === "") {
      professionalInfo.experience = "entry";
    }

    // Ensure arrays are arrays
    if (!Array.isArray(professionalInfo.skills)) professionalInfo.skills = [];
    if (!Array.isArray(professionalInfo.skillsToImprove))
      professionalInfo.skillsToImprove = [];
    if (!Array.isArray(interviewGoals.targetCompanies))
      interviewGoals.targetCompanies = [];
    if (!Array.isArray(preferences.interviewTypes))
      preferences.interviewTypes = [];
    if (!Array.isArray(preferences.focusAreas)) preferences.focusAreas = [];

    // Validate required data
    if (!professionalInfo.currentRole || !professionalInfo.industry) {
      return res.status(400).json({
        success: false,
        message: "Missing required professional information",
        details: {
          currentRole: !professionalInfo.currentRole
            ? "Current role is required"
            : null,
          industry: !professionalInfo.industry ? "Industry is required" : null,
        },
      });
    }

    // Validate preferences
    if (
      !preferences.interviewTypes ||
      preferences.interviewTypes.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one interview type must be selected",
      });
    }

    // Ensure a profile exists; if not, create it from Clerk data when available
    // In development with MOCK_AUTH_FALLBACK, skip Clerk calls and use stub data
    const usingMockAuth =
      process.env.NODE_ENV !== "production" &&
      process.env.MOCK_AUTH_FALLBACK === "true" &&
      (!req.headers?.authorization || String(userId).startsWith("test-"));

    let clerkUser = null;
    if (!usingMockAuth && process.env.CLERK_SECRET_KEY) {
      try {
        clerkUser = await clerkClient.users.getUser(userId);
      } catch (clerkError) {
        console.error("Clerk API error:", clerkError);
        if (process.env.NODE_ENV === "production") {
          return res.status(500).json({
            success: false,
            message: "Failed to fetch user data from authentication service",
          });
        }
      }
    }

    // Fallback stub user for development
    if (!clerkUser && usingMockAuth) {
      clerkUser = {
        emailAddresses: [
          { emailAddress: `${userId || "test-user-123"}@example.com` },
        ],
        firstName: "Test",
        lastName: "User",
        profileImageUrl: null,
      };
    }

    console.log("About to create/update user profile for userId:", userId);

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      {
        $set: {
          professionalInfo,
          preferences,
          interviewGoals,
          onboardingCompleted: true,
        },
        $setOnInsert: {
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || null,
          firstName: clerkUser?.firstName || null,
          lastName: clerkUser?.lastName || null,
          profileImage: clerkUser?.profileImageUrl || null,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    console.log("User profile created/updated:", userProfile._id);

    // Calculate completeness after onboarding
    try {
      userProfile.calculateCompleteness();
      await userProfile.save();
      console.log("Profile completeness calculated and saved");
    } catch (calcError) {
      console.error("Error calculating completeness:", calcError);
      // Continue without failing
    }

    console.log("Onboarding completed successfully");

    res.json({
      success: true,
      message: "Onboarding completed successfully",
      data: userProfile,
    });
  } catch (error) {
    console.error("Complete onboarding error:", error);

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: validationErrors,
      });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User profile already exists",
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Failed to complete onboarding",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user analytics
const getAnalytics = async (req, res) => {
  try {
    const { userId } = req.auth;

    const userProfile = await UserProfile.findOne(
      { clerkUserId: userId },
      { analytics: 1, subscription: 1 }
    );

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    res.json({
      success: true,
      data: {
        analytics: userProfile.analytics,
        subscription: userProfile.subscription,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};

// Update user analytics (internal use)
const updateAnalytics = async (userId, analyticsUpdate) => {
  try {
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Update analytics
    Object.keys(analyticsUpdate).forEach((key) => {
      if (userProfile.analytics[key] !== undefined) {
        userProfile.analytics[key] = analyticsUpdate[key];
      }
    });

    // Update streak if it's a new interview
    if (analyticsUpdate.lastInterviewDate) {
      const today = new Date();
      const lastDate = new Date(userProfile.analytics.streak.lastInterviewDate);
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        userProfile.analytics.streak.current += 1;
        userProfile.analytics.streak.longest = Math.max(
          userProfile.analytics.streak.longest,
          userProfile.analytics.streak.current
        );
      } else if (daysDiff > 1) {
        // Streak broken
        userProfile.analytics.streak.current = 1;
      }
      // Same day, no change needed

      userProfile.analytics.streak.lastInterviewDate = today;
    }

    await userProfile.save();
    return userProfile;
  } catch (error) {
    console.error("Update analytics error:", error);
    throw error;
  }
};

// Upload resume
const uploadResume = async (req, res) => {
  try {
    const { userId } = req.auth;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      {
        "professionalInfo.resume": {
          filename: req.file.originalname,
          url: req.file.path, // This would be S3 URL in production
          uploadedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    res.json({
      success: true,
      message: "Resume uploaded successfully",
      data: userProfile.professionalInfo.resume,
    });
  } catch (error) {
    console.error("Upload resume error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload resume",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  completeOnboarding,
  saveOnboardingProgress,
  getAnalytics,
  updateAnalytics,
  uploadResume,
};

// =============== Dashboard extensions: Scheduled Sessions, Goals, Tips ===============

// Get upcoming scheduled sessions for the current user (next N, default 3)
const getScheduledSessions = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { limit = 3, page = 1, includePast, status } = req.query;

    const now = new Date();
    const baseQuery = { userId };
    if (!status || status === "scheduled") {
      baseQuery.status = "scheduled";
    } else if (status && status !== "all") {
      baseQuery.status = status; // completed | canceled
    }
    if (!includePast || includePast === "false") {
      baseQuery.scheduledAt = { $gte: now };
    }

    const perPage = Number(limit);
    const currentPage = Math.max(1, Number(page));

    const [sessions, total] = await Promise.all([
      ScheduledSession.find(baseQuery)
        .sort({ scheduledAt: 1 })
        .limit(perPage)
        .skip((currentPage - 1) * perPage),
      ScheduledSession.countDocuments(baseQuery),
    ]);

    return res.json({
      success: true,
      data: sessions,
      pagination: {
        current: currentPage,
        total,
        pages: Math.ceil(total / perPage),
        limit: perPage,
      },
    });
  } catch (error) {
    console.error("Get scheduled sessions error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch scheduled sessions" });
  }
};

// Create or update a scheduled session
const upsertScheduledSession = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params; // optional for update
    const { title, type, duration, scheduledAt, notes, status } = req.body;

    if (!title || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "Title and scheduledAt are required",
      });
    }

    const payload = {
      userId,
      title,
      type,
      duration,
      scheduledAt,
      notes,
    };
    if (status) payload.status = status;

    let sessionDoc;
    if (id) {
      sessionDoc = await ScheduledSession.findOneAndUpdate(
        { _id: id, userId },
        { $set: payload },
        { new: true }
      );
      if (!sessionDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Session not found" });
      }
    } else {
      sessionDoc = await ScheduledSession.create(payload);
    }

    return res.json({ success: true, data: sessionDoc });
  } catch (error) {
    console.error("Upsert scheduled session error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to save scheduled session" });
  }
};

// Delete a scheduled session
const deleteScheduledSession = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    const result = await ScheduledSession.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete scheduled session error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete scheduled session" });
  }
};

// Update session status (scheduled | completed | canceled)
const updateScheduledSessionStatus = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["scheduled", "completed", "canceled"];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }
    const doc = await ScheduledSession.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status } },
      { new: true }
    );
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error("Update session status error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update status" });
  }
};

// Get or update goals embedded in the user profile
const getGoals = async (req, res) => {
  try {
    const { userId } = req.auth;
    const userProfile = await UserProfile.findOne(
      { clerkUserId: userId },
      { goals: 1 }
    );
    if (!userProfile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }
    return res.json({ success: true, data: userProfile.goals || [] });
  } catch (error) {
    console.error("Get goals error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch goals" });
  }
};

const updateGoals = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { goals } = req.body;
    if (!Array.isArray(goals)) {
      return res
        .status(400)
        .json({ success: false, message: "Goals must be an array" });
    }
    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      { $set: { goals } },
      { new: true }
    );
    if (!userProfile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }
    return res.json({ success: true, data: userProfile.goals });
  } catch (error) {
    console.error("Update goals error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update goals" });
  }
};

// Simple dynamic tips based on analytics and recent interview outcomes
const getDynamicTips = async (req, res) => {
  try {
    const { userId } = req.auth;
    const userProfile = await UserProfile.findOne(
      { clerkUserId: userId },
      { analytics: 1 }
    );
    if (!userProfile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    const tips = [];
    const avg = userProfile.analytics?.averageScore || 0;
    const strong = userProfile.analytics?.strongAreas || [];
    const weak = userProfile.analytics?.improvementAreas || [];

    if (avg < 60) {
      tips.push({
        title: "Focus on fundamentals",
        desc: "Revisit core concepts and practice structured answers to boost baseline.",
        href: "/resources",
      });
    } else if (avg < 80) {
      tips.push({
        title: "Add concrete examples",
        desc: "Use STAR to anchor your responses with measurable outcomes.",
        href: "/resources",
      });
    } else {
      tips.push({
        title: "Push difficulty",
        desc: "Try advanced rounds or longer sessions to stretch your capability.",
        href: "/practice",
      });
    }

    if (weak.includes("communication")) {
      tips.push({
        title: "Tighten delivery",
        desc: "Practice concise framing; lead with your conclusion, then justify.",
        href: "/practice",
      });
    }
    if (weak.includes("technical")) {
      tips.push({
        title: "Increase technical depth",
        desc: "Drill topics that appeared in recent interviews with targeted katas.",
        href: "/practice",
      });
    }
    if (strong.includes("leadership")) {
      tips.push({
        title: "Showcase leadership",
        desc: "Highlight initiatives where you influenced outcomes across teams.",
        href: "/interviews",
      });
    }

    // Deeper analysis from recent completed interviews (lightweight)
    try {
      const recent = await Interview.find({ userId, status: "completed" })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select(
          "results.breakdown questions.category questions.followUpsReviewed questions.score.rubricScores"
        );

      // Aggregate breakdown averages
      const agg = {
        technical: [],
        communication: [],
        problemSolving: [],
        behavioral: [],
      };
      for (const doc of recent) {
        const b = doc?.results?.breakdown || {};
        if (typeof b.technical === "number") agg.technical.push(b.technical);
        if (typeof b.communication === "number")
          agg.communication.push(b.communication);
        if (typeof b.problemSolving === "number")
          agg.problemSolving.push(b.problemSolving);
        if (typeof b.behavioral === "number") agg.behavioral.push(b.behavioral);
      }

      const avgOf = (arr) =>
        arr.length
          ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length)
          : null;
      const avgs = {
        technical: avgOf(agg.technical),
        communication: avgOf(agg.communication),
        problemSolving: avgOf(agg.problemSolving),
        behavioral: avgOf(agg.behavioral),
      };

      Object.entries(avgs).forEach(([key, val]) => {
        if (val !== null && val < 60) {
          const map = {
            technical: {
              title: "Strengthen technical depth",
              desc: "Target weak topics from recent sessions; practice with timed drills.",
              href: "/practice",
            },
            communication: {
              title: "Clarify communication",
              desc: "Practice concise framing and narration of thought process.",
              href: "/resources",
            },
            problemSolving: {
              title: "Sharpen problem solving",
              desc: "Break down problems, state assumptions, and compare approaches.",
              href: "/practice",
            },
            behavioral: {
              title: "Improve behavioral responses",
              desc: "Use STAR and emphasize measurable results and learnings.",
              href: "/resources",
            },
          };
          tips.push(map[key]);
        }
      });

      // Rubric weaknesses (clarity/depth)
      let lowClarityCount = 0;
      let lowDepthCount = 0;
      for (const doc of recent) {
        for (const q of doc?.questions || []) {
          const r = q?.score?.rubricScores || {};
          if (typeof r.clarity === "number" && r.clarity <= 2)
            lowClarityCount += 1;
          if (typeof r.depth === "number" && r.depth <= 2) lowDepthCount += 1;
        }
      }
      if (lowClarityCount >= 2) {
        tips.push({
          title: "Boost clarity",
          desc: "Practice structuring answers with signposting and concise language.",
          href: "/resources",
        });
      }
      if (lowDepthCount >= 2) {
        tips.push({
          title: "Increase depth",
          desc: "Add deeper reasoning and trade-off analysis in technical responses.",
          href: "/practice",
        });
      }

      // Category frequency hint
      const categoryCounts = {};
      for (const doc of recent) {
        for (const q of doc?.questions || []) {
          const cat = q.category || "general";
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      }
      const topCat = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)[0];
      if (topCat) {
        tips.push({
          title: `Practice more in ${topCat}`,
          desc: "Double down on your most frequent category to build fluency.",
          href: "/practice",
        });
      }

      // Follow-ups reviewed signal (encourage action)
      const totalFollowupsReviewed = recent.reduce(
        (acc, doc) =>
          acc +
          (doc?.questions || []).filter((q) => q.followUpsReviewed).length,
        0
      );
      if (totalFollowupsReviewed === 0) {
        tips.push({
          title: "Review follow-ups",
          desc: "Use AI follow-up questions to close gaps immediately after answers.",
          href: "/interviews",
        });
      }
    } catch (e) {
      // Non-critical; keep fallbacks
    }

    // Default fallbacks if still empty
    if (tips.length === 0) {
      tips.push(
        {
          title: "Warm up daily",
          desc: "Short, frequent practice beats cramming.",
          href: "/practice",
        },
        {
          title: "Revisit feedback",
          desc: "Address flagged areas from previous sessions.",
          href: "/interviews",
        }
      );
    }

    return res.json({ success: true, data: tips.slice(0, 5) });
  } catch (error) {
    console.error("Get dynamic tips error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate tips" });
  }
};

// Export new handlers
module.exports.getScheduledSessions = getScheduledSessions;
module.exports.upsertScheduledSession = upsertScheduledSession;
module.exports.deleteScheduledSession = deleteScheduledSession;
module.exports.updateScheduledSessionStatus = updateScheduledSessionStatus;
module.exports.getGoals = getGoals;
module.exports.updateGoals = updateGoals;
module.exports.getDynamicTips = getDynamicTips;
