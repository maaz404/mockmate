/* eslint-disable no-console, consistent-return, no-magic-numbers */
const UserProfile = require("../models/UserProfile");
const { clerkClient } = require("@clerk/clerk-sdk-node");
const Interview = require("../models/Interview");
const ScheduledSession = require("../models/ScheduledSession");
const { ok, fail } = require("../utils/responder");

// Get user profile (profile guaranteed by ensureUserProfile middleware)
const getProfile = async (req, res) => {
  try {
    if (!req.userProfile) {
      return fail(
        res,
        500,
        "PROFILE_NOT_ATTACHED",
        "User profile not available on request"
      );
    }
    return ok(res, req.userProfile);
  } catch (error) {
    console.error("Get profile error:", error);
    return fail(
      res,
      500,
      "PROFILE_FETCH_FAILED",
      "Failed to fetch user profile"
    );
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

    return ok(res, userProfile, "Onboarding progress saved successfully");
  } catch (error) {
    console.error("Save onboarding progress error:", error);

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });

      return fail(res, 400, "VALIDATION_FAILED", "Validation failed", {
        details: validationErrors,
      });
    }
    return fail(
      res,
      500,
      "ONBOARDING_SAVE_FAILED",
      "Failed to save onboarding progress",
      process.env.NODE_ENV === "development"
        ? { detail: error.message }
        : undefined
    );
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    if (!req.userProfile)
      return fail(res, 500, "PROFILE_NOT_ATTACHED", "User profile missing");
    const { userId } = req.auth;
    const updates = { ...req.body };

    ["clerkUserId", "email", "analytics", "subscription"].forEach(
      (f) => delete updates[f]
    );

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      { ...updates },
      { new: true }
    );
    if (!userProfile)
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");

    try {
      userProfile.calculateCompleteness();
      await userProfile.save();
    } catch (calcErr) {
      console.warn("Completeness calculation failed", calcErr);
    }

    return ok(res, userProfile, "Profile updated");
  } catch (error) {
    console.error("Update profile error:", error);
    return fail(res, 500, "PROFILE_UPDATE_FAILED", "Failed to update profile");
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

    if (!userId)
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");

    let { professionalInfo, preferences, interviewGoals } = req.body;

    // Early validation to match test expectations
    if (!professionalInfo && !preferences) {
      return fail(
        res,
        400,
        "MISSING_DATA",
        "Missing required onboarding data",
        {
          professionalInfo: "Professional information is required",
          preferences: "Preferences are required",
        }
      );
    }

    if (!professionalInfo) {
      return fail(
        res,
        400,
        "MISSING_PROFESSIONAL_INFO",
        "Missing required onboarding data",
        {
          professionalInfo: "Professional information is required",
          preferences: null,
        }
      );
    }

    if (!preferences) {
      return fail(
        res,
        400,
        "MISSING_PREFERENCES",
        "Missing required onboarding data",
        { professionalInfo: null, preferences: "Preferences are required" }
      );
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
      return fail(
        res,
        400,
        "MISSING_PROFESSIONAL_FIELDS",
        "Missing required professional information",
        {
          currentRole: !professionalInfo.currentRole
            ? "Current role is required"
            : null,
          industry: !professionalInfo.industry ? "Industry is required" : null,
        }
      );
    }

    // Validate preferences
    if (
      !preferences.interviewTypes ||
      preferences.interviewTypes.length === 0
    ) {
      return fail(
        res,
        400,
        "NO_INTERVIEW_TYPE",
        "At least one interview type must be selected"
      );
    }

    // Ensure a profile exists; if not, create it from Clerk data when available
    // In development with MOCK_AUTH_FALLBACK, skip Clerk calls and use stub data
    const usingMockAuth =
      process.env.NODE_ENV !== "production" &&
      process.env.MOCK_AUTH_FALLBACK === "true" &&
      (!req.headers?.authorization || String(userId).startsWith("test-"));

    let clerkUser = null;
    const shouldCallClerk =
      !usingMockAuth &&
      (process.env.CLERK_SECRET_KEY || process.env.NODE_ENV === "test");
    if (shouldCallClerk) {
      try {
        clerkUser = await clerkClient.users.getUser(userId);
      } catch (clerkError) {
        console.error("Clerk API error:", clerkError);
        if (
          process.env.NODE_ENV === "production" ||
          process.env.NODE_ENV === "test"
        ) {
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

    // Prefer profile already attached by ensureUserProfile to avoid double upsert
    let userProfile = req.userProfile;
    if (userProfile) {
      userProfile.professionalInfo = professionalInfo;
      userProfile.preferences = preferences;
      userProfile.interviewGoals = interviewGoals;
      userProfile.onboardingCompleted = true;
      // Only hydrate missing base identity fields once
      if (!userProfile.email && clerkUser?.emailAddresses?.[0]?.emailAddress) {
        userProfile.email = clerkUser.emailAddresses[0].emailAddress;
      }
      if (!userProfile.firstName && clerkUser?.firstName) {
        userProfile.firstName = clerkUser.firstName;
      }
      if (!userProfile.lastName && clerkUser?.lastName) {
        userProfile.lastName = clerkUser.lastName;
      }
      if (!userProfile.profileImage && clerkUser?.profileImageUrl) {
        userProfile.profileImage = clerkUser.profileImageUrl;
      }
    } else {
      userProfile = await UserProfile.findOneAndUpdate(
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
    }

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

    return ok(res, userProfile, "Onboarding completed successfully");
  } catch (error) {
    console.error("Complete onboarding error:", error);

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });

      return fail(res, 400, "VALIDATION_FAILED", "Validation failed", {
        details: validationErrors,
      });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return fail(res, 400, "PROFILE_EXISTS", "User profile already exists");
    }

    // Generic error response
    return fail(
      res,
      500,
      "ONBOARDING_COMPLETE_FAILED",
      "Failed to complete onboarding",
      process.env.NODE_ENV === "development"
        ? { detail: error.message }
        : undefined
    );
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
    if (!userProfile)
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");
    return ok(res, {
      analytics: userProfile.analytics,
      subscription: userProfile.subscription,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return fail(
      res,
      500,
      "ANALYTICS_FETCH_FAILED",
      "Failed to fetch analytics"
    );
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

// Normalize Cloudinary asset subset from client
function normalizeAsset(input) {
  if (!input) return null;
  const {
    public_id,
    publicId,
    resource_type,
    resourceType,
    secure_url,
    secureUrl,
    bytes,
    width,
    height,
    duration,
    format,
    version,
    tags,
    context,
    uploadedAt,
    processedAt,
  } = input;
  const pid = publicId || public_id;
  const rt = resourceType || resource_type;
  const url = secureUrl || secure_url;
  if (!pid || !rt || !url) return null;
  return {
    publicId: pid,
    resourceType: rt,
    secureUrl: url,
    bytes,
    width,
    height,
    duration,
    format,
    version,
    tags,
    context,
    uploadedAt: uploadedAt ? new Date(uploadedAt) : new Date(),
    processedAt: processedAt ? new Date(processedAt) : undefined,
  };
}

// PUT /api/users/profile/avatar
const updateAvatar = async (req, res) => {
  try {
    const { userId } = req.auth;
    const asset = normalizeAsset(req.body);
    if (!asset) return fail(res, 400, "INVALID_ASSET", "Invalid asset payload");
    const profile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      { $set: { avatar: asset } },
      { new: true }
    ).lean();
    if (!profile)
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");
    return ok(res, profile, "Avatar updated");
  } catch (error) {
    return fail(res, 500, "AVATAR_UPDATE_FAILED", "Failed to update avatar");
  }
};

// PUT /api/users/profile/resume
const updateResumeAsset = async (req, res) => {
  try {
    const { userId } = req.auth;
    const asset = normalizeAsset(req.body);
    if (!asset) return fail(res, 400, "INVALID_ASSET", "Invalid asset payload");
    const profile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      { $set: { resume: asset } },
      { new: true }
    ).lean();
    if (!profile)
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");
    return ok(res, profile, "Resume asset updated");
  } catch (error) {
    return fail(res, 500, "RESUME_UPDATE_FAILED", "Failed to update resume");
  }
};

// Upload resume
const uploadResume = async (req, res) => {
  try {
    const { userId } = req.auth;

    if (!req.file) return fail(res, 400, "NO_FILE", "No file uploaded");

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

    if (!userProfile)
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");
    return ok(
      res,
      userProfile.professionalInfo.resume,
      "Resume uploaded successfully"
    );
  } catch (error) {
    console.error("Upload resume error:", error);
    return fail(res, 500, "RESUME_UPLOAD_FAILED", "Failed to upload resume");
  }
};

// ===== Dashboard Preferences (cross-device UI state) =====
async function getDashboardPreferences(req, res) {
  try {
    const { userId } = req.auth;
    const profile = await UserProfile.findOne(
      { clerkUserId: userId },
      { "preferences.dashboard": 1, _id: 0 }
    ).lean();
    return res.json({
      success: true,
      data: profile?.preferences?.dashboard || {},
    });
  } catch (error) {
    console.error("Get dashboard preferences error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load preferences" });
  }
}

async function updateDashboardPreferences(req, res) {
  try {
    const { userId } = req.auth;
    const { density, upcomingView, thisWeekOnly } = req.body || {};
    const update = {};
    if (density) update["preferences.dashboard.density"] = density;
    if (upcomingView)
      update["preferences.dashboard.upcomingView"] = upcomingView;
    if (typeof thisWeekOnly === "boolean")
      update["preferences.dashboard.thisWeekOnly"] = thisWeekOnly;

    const profile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      { $set: update },
      { new: true }
    ).lean();

    return res.json({
      success: true,
      data: profile?.preferences?.dashboard || {},
    });
  } catch (error) {
    console.error("Update dashboard preferences error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update preferences" });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  completeOnboarding,
  saveOnboardingProgress,
  getAnalytics,
  updateAnalytics,
  uploadResume,
  updateAvatar,
  updateResumeAsset,
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
    return ok(res, {
      items: sessions,
      pagination: {
        current: currentPage,
        total,
        pages: Math.ceil(total / perPage),
        limit: perPage,
      },
    });
  } catch (error) {
    console.error("Get scheduled sessions error:", error);
    return fail(
      res,
      500,
      "SCHEDULED_FETCH_FAILED",
      "Failed to fetch scheduled sessions"
    );
  }
};

// Create or update a scheduled session
const upsertScheduledSession = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params; // optional for update
    const { title, type, duration, scheduledAt, notes, status } = req.body;

    if (!title || !scheduledAt)
      return fail(
        res,
        400,
        "MISSING_FIELDS",
        "Title and scheduledAt are required"
      );

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
      if (!sessionDoc)
        return fail(res, 404, "SESSION_NOT_FOUND", "Session not found");
    } else {
      sessionDoc = await ScheduledSession.create(payload);
    }
    return ok(res, sessionDoc, id ? "Session updated" : "Session created");
  } catch (error) {
    console.error("Upsert scheduled session error:", error);
    return fail(
      res,
      500,
      "SESSION_SAVE_FAILED",
      "Failed to save scheduled session"
    );
  }
};

// Delete a scheduled session
const deleteScheduledSession = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    const result = await ScheduledSession.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0)
      return fail(res, 404, "SESSION_NOT_FOUND", "Session not found");
    return ok(res, null, "Session deleted");
  } catch (error) {
    console.error("Delete scheduled session error:", error);
    return fail(
      res,
      500,
      "SESSION_DELETE_FAILED",
      "Failed to delete scheduled session"
    );
  }
};

// Update session status (scheduled | completed | canceled)
const updateScheduledSessionStatus = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["scheduled", "completed", "canceled"];
    if (!allowed.includes(status))
      return fail(res, 400, "INVALID_STATUS", "Invalid status");
    const doc = await ScheduledSession.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status } },
      { new: true }
    );
    if (!doc) return fail(res, 404, "SESSION_NOT_FOUND", "Session not found");
    return ok(res, doc, "Status updated");
  } catch (error) {
    console.error("Update session status error:", error);
    return fail(res, 500, "SESSION_STATUS_FAILED", "Failed to update status");
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
    if (!userProfile)
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");
    return ok(res, userProfile.goals || []);
  } catch (error) {
    console.error("Get goals error:", error);
    return fail(res, 500, "GOALS_FETCH_FAILED", "Failed to fetch goals");
  }
};

const updateGoals = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { goals } = req.body;
    if (!Array.isArray(goals))
      return fail(res, 400, "INVALID_GOALS", "Goals must be an array");
    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      { $set: { goals } },
      { new: true }
    );
    if (!userProfile)
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");
    return ok(res, userProfile.goals, "Goals updated");
  } catch (error) {
    console.error("Update goals error:", error);
    return fail(res, 500, "GOALS_UPDATE_FAILED", "Failed to update goals");
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
    if (!userProfile)
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");

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

    return ok(res, tips.slice(0, 5));
  } catch (error) {
    console.error("Get dynamic tips error:", error);
    return fail(res, 500, "TIPS_FAILED", "Failed to generate tips");
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

// ================= Dashboard Summary Aggregation =================
// GET /api/users/dashboard/summary
async function getDashboardSummary(req, res) {
  try {
    const { userId } = req.auth;
    // Query params with sensible defaults
    const interviewsLimit = Math.max(
      1,
      parseInt(req.query.interviewsLimit, 10) || 5
    );
    const scheduledLimit = Math.max(
      1,
      parseInt(req.query.scheduledLimit, 10) || 3
    );
    const scheduledStatus = (
      req.query.scheduledStatus || "scheduled"
    ).toLowerCase();
    const includePast =
      String(req.query.includePast || "false").toLowerCase() === "true";

    const sectionsWithErrors = [];

    // Build scheduled query
    const now = new Date();
    const scheduledQuery = { userId };
    if (scheduledStatus !== "all") {
      // allowlist validation
      const allowed = ["scheduled", "completed", "canceled"];
      scheduledQuery.status = allowed.includes(scheduledStatus)
        ? scheduledStatus
        : "scheduled";
    }
    if (!includePast) {
      scheduledQuery.scheduledAt = { $gte: now };
    }

    const tasks = {
      profile: UserProfile.findOne({ clerkUserId: userId })
        .select(
          "clerkUserId email firstName lastName profileImage professionalInfo onboardingCompleted subscription"
        )
        .lean()
        .exec(),
      analytics: UserProfile.findOne({ clerkUserId: userId })
        .select("analytics subscription")
        .lean()
        .exec(),
      recentInterviews: Interview.find({ userId })
        .sort({ createdAt: -1 })
        .limit(interviewsLimit)
        .select(
          "_id createdAt updatedAt status results.breakdown questions.category config.jobRole config.interviewType config.difficulty"
        )
        .lean()
        .exec(),
      scheduled: (async () => {
        const [items, total] = await Promise.all([
          ScheduledSession.find(scheduledQuery)
            .sort({ scheduledAt: 1 })
            .limit(scheduledLimit)
            .lean()
            .exec(),
          ScheduledSession.countDocuments(scheduledQuery),
        ]);
        return {
          items,
          pagination: {
            total,
            limit: scheduledLimit,
            pages: Math.ceil(total / scheduledLimit) || 1,
            current: 1,
          },
        };
      })(),
      goals: UserProfile.findOne({ clerkUserId: userId })
        .select("goals")
        .lean()
        .exec(),
      tips: (async () => {
        // Reuse internal logic by calling getDynamicTips helpers directly is complex here;
        // instead, perform a lightweight tip generation similar to getDynamicTips
        const profile = await UserProfile.findOne({ clerkUserId: userId })
          .select("analytics")
          .lean()
          .exec();
        const tips = [];
        const avg = profile?.analytics?.averageScore || 0;
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
        return tips;
      })(),
    };

    const [profileR, analyticsR, recentR, scheduledR, goalsR, tipsR] =
      await Promise.allSettled([
        tasks.profile,
        tasks.analytics,
        tasks.recentInterviews,
        tasks.scheduled,
        tasks.goals,
        tasks.tips,
      ]);

    const pick = (r, name) => {
      if (r.status === "fulfilled") return r.value;
      sectionsWithErrors.push(name);
      return null;
    };

    const payload = {
      profile: pick(profileR, "profile"),
      analytics: pick(analyticsR, "analytics"),
      recentInterviews: pick(recentR, "recentInterviews") || [],
      scheduled: pick(scheduledR, "scheduled") || {
        items: [],
        pagination: { total: 0, limit: scheduledLimit, pages: 1, current: 1 },
      },
      goals: pick(goalsR, "goals")?.goals || [],
      tips: pick(tipsR, "tips") || [],
      sectionsWithErrors,
    };

    return ok(res, payload);
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return fail(
      res,
      500,
      "DASHBOARD_SUMMARY_FAILED",
      "Failed to load dashboard summary"
    );
  }
}

module.exports.getDashboardSummary = getDashboardSummary;
module.exports.getDashboardPreferences = getDashboardPreferences;
module.exports.updateDashboardPreferences = updateDashboardPreferences;

// ================= Dashboard Metrics (Phase 1) =================
// GET /api/users/dashboard/metrics
// Provides richer time-series + coverage metrics used for enhanced dashboard widgets.
async function getDashboardMetrics(req, res) {
  try {
    const { userId } = req.auth;
    // Horizon: last 8 ISO weeks (including current)
    const weeksBack = Math.min(12, parseInt(req.query.weeks || "8", 10) || 8); // cap at 12 for now
    const now = new Date();
    const horizonStart = new Date(now.getTime() - weeksBack * 7 * 24 * 60 * 60 * 1000);

    // Fetch completed interviews within horizon (plus a small buffer week for accurate weekly bucket edge)
    const interviews = await Interview.find({
      userId,
      status: { $in: ["completed", "in-progress"] },
      createdAt: { $gte: horizonStart },
    })
      .select(
        "_id createdAt status results.overallScore questions.category questions.followUpsReviewed questions.followUps questions text"
      )
      .lean()
      .exec();

    // Helper: ISO week key (YYYY-Www)
    const isoWeekKey = (d) => {
      const date = new Date(d);
      // ISO week algorithm
      const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
      return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
    };

    // Build chronological list of week keys (oldest -> newest)
    const weekKeys = [];
    for (let i = weeksBack - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      weekKeys.push(isoWeekKey(d));
    }

    const weeklyMap = Object.fromEntries(
      weekKeys.map((wk) => [wk, { interviews: 0, scores: [] }])
    );

    let lastPracticeAt = null;
    const categoryAgg = {}; // { category: { count, scoreSum, scoreCount } }
    let followUpsTotal = 0;
    let followUpsReviewed = 0;

    // Iterate interviews
    for (const iv of interviews) {
      const wk = isoWeekKey(iv.createdAt);
      if (weeklyMap[wk]) {
        weeklyMap[wk].interviews += 1;
        if (iv.results?.overallScore != null) {
          weeklyMap[wk].scores.push(iv.results.overallScore);
        }
      }
      if (iv.status === "completed") {
        if (!lastPracticeAt || new Date(iv.createdAt) > new Date(lastPracticeAt)) {
          lastPracticeAt = iv.createdAt;
        }
        // Category coverage from questions
        (iv.questions || []).forEach((q) => {
          const cat = q.category || "Uncategorized";
            if (!categoryAgg[cat]) categoryAgg[cat] = { count: 0, scoreSum: 0, scoreCount: 0 };
            categoryAgg[cat].count += 1;
            if (iv.results?.overallScore != null) {
              categoryAgg[cat].scoreSum += iv.results.overallScore;
              categoryAgg[cat].scoreCount += 1;
            }
            // Follow-ups
            if (q.followUps) {
              followUpsTotal += Array.isArray(q.followUps) ? q.followUps.length : 1;
            }
            if (q.followUpsReviewed) followUpsReviewed += 1; // flag means user reviewed set
        });
      }
    }

    const weekly = {
      weeks: weekKeys,
      interviews: weekKeys.map((wk) => weeklyMap[wk].interviews),
      avgScore: weekKeys.map((wk) => {
        const arr = weeklyMap[wk].scores;
        if (!arr.length) return null; // null => no data that week
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      }),
    };

    const categoryCoverage = Object.entries(categoryAgg)
      .map(([category, v]) => ({
        category,
        count: v.count,
        avgScore: v.scoreCount ? Math.round(v.scoreSum / v.scoreCount) : null,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12); // limit for now

    // Placeholder skill dimension mapping: group categories heuristically
    const dimensionBuckets = {
      Technical: [/system/i, /data/i, /algorithm/i, /code/i],
      Communication: [/behavior/i, /communication/i, /team/i],
      Systems: [/design/i, /architecture/i, /scalability/i],
      Behavioral: [/behavior/i, /culture/i, /soft/i],
    };
    const dimScores = {};
    for (const dim of Object.keys(dimensionBuckets)) {
      dimScores[dim] = { scoreSum: 0, scoreCount: 0 };
    }
    for (const iv of interviews) {
      if (iv.status !== "completed" || iv.results?.overallScore == null) continue;
      const score = iv.results.overallScore;
      const cats = new Set((iv.questions || []).map((q) => q.category || ""));
      for (const dim of Object.keys(dimensionBuckets)) {
        const patterns = dimensionBuckets[dim];
        // If any category matches pattern, include score
        if ([...cats].some((c) => patterns.some((re) => re.test(c)))) {
          dimScores[dim].scoreSum += score;
          dimScores[dim].scoreCount += 1;
        }
      }
    }
    const skillDimensions = Object.keys(dimScores)
      .map((dim) => ({
        dimension: dim,
        score: dimScores[dim].scoreCount
          ? Math.round(dimScores[dim].scoreSum / dimScores[dim].scoreCount)
          : null,
      }))
      .filter((d) => d.score !== null);

    const payload = {
      weekly,
      categoryCoverage,
      followUps: { total: followUpsTotal, reviewed: followUpsReviewed },
      skillDimensions,
      lastPracticeAt,
    };
    return ok(res, payload);
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return fail(res, 500, "DASHBOARD_METRICS_FAILED", "Failed to load metrics");
  }
}

module.exports.getDashboardMetrics = getDashboardMetrics;
