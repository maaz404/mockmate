/* eslint-disable no-console, consistent-return, no-magic-numbers */
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const Interview = require("../models/Interview");
const ScheduledSession = require("../models/ScheduledSession");
const { ok, fail } = require("../utils/responder");
const { verifyToken } = require("../config/jwt");

// Upgrade user to premium (unlimited interviews)
const upgradeToPremium = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");

    const userProfile = await UserProfile.findOne({ user: userId });
    if (!userProfile)
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");

    userProfile.subscription.plan = "premium";
    userProfile.subscription.interviewsRemaining = null; // unlimited
    await userProfile.save();

    return ok(
      res,
      { success: true, subscription: userProfile.subscription },
      "Upgraded to premium"
    );
  } catch (error) {
    return fail(res, 500, "UPGRADE_FAILED", "Failed to upgrade to premium");
  }
};

// Get user profile (profile guaranteed by ensureUserProfile middleware)
const getProfile = async (req, res) => {
  try {
    if (!req.userProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Convert Mongoose document to plain object to avoid circular references
    const profileData = req.userProfile.toObject();
    return ok(res, profileData);
  } catch (error) {
    console.error("[getProfile] Error:", error);
    return res
      .status(500)
      .json({ message: "Error retrieving profile", error: error.message });
  }
};

// Bootstrap user profile - ensures profile exists and returns basic info
const bootstrapProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");

    let userProfile = await UserProfile.findOne({ user: userId });

    if (!userProfile) {
      const user = await User.findById(userId).lean();
      userProfile = new UserProfile({
        user: userId,
        email: user?.email || `${userId}@example.com`,
        firstName: user?.name || "User",
        lastName: "",
        profileImage: user?.picture || "",
        onboardingCompleted: false,
      });
      await userProfile.save();
    }

    return ok(
      res,
      {
        profile: userProfile,
        isNewUser: !userProfile.onboardingCompleted,
        needsOnboarding: !userProfile.onboardingCompleted,
      },
      "Profile bootstrapped successfully"
    );
  } catch (error) {
    console.error("Bootstrap profile error:", error);
    return fail(
      res,
      500,
      "BOOTSTRAP_FAILED",
      "Failed to bootstrap user profile"
    );
  }
};

// Save onboarding progress
const saveOnboardingProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");

    const progressData = req.body;

    // Sanitize data
    if (progressData.professionalInfo) {
      if (
        !progressData.professionalInfo.experience ||
        progressData.professionalInfo.experience === ""
      ) {
        progressData.professionalInfo.experience = "entry";
      }
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
    delete progressData.user;
    delete progressData.email;
    delete progressData.analytics;
    delete progressData.subscription;
    delete progressData.onboardingCompleted;

    const userProfile = await UserProfile.findOneAndUpdate(
      { user: userId },
      { $set: progressData },
      { new: true, upsert: true }
    );

    if (!userProfile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    // Calculate completeness but don't save yet (progress save)
    userProfile.calculateCompleteness();

    // Convert to plain object
    const profileData = userProfile.toObject();
    return ok(res, profileData, "Onboarding progress saved successfully");
  } catch (error) {
    console.error("Save onboarding progress error:", error);

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
    const updates = req.body;
    const profile = await UserProfile.findByIdAndUpdate(
      req.userProfile._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Convert to plain object before sending
    const profileData = profile.toObject();
    return ok(res, profileData, "Profile updated successfully");
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// Complete onboarding
const completeOnboarding = async (req, res) => {
  try {
    let userId = req.user?.id;

    if (!userId) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("No userId found, using test user for development");
        userId = "000000000000000000000001";
      } else {
        return fail(res, 401, "UNAUTHORIZED", "Authentication required");
      }
    }

    let { professionalInfo, preferences, interviewGoals } = req.body;

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
        {
          professionalInfo: null,
          preferences: "Preferences are required",
        }
      );
    }

    if (!professionalInfo) professionalInfo = {};
    if (!preferences) preferences = {};
    if (!interviewGoals) interviewGoals = {};

    if (!professionalInfo.experience || professionalInfo.experience === "") {
      professionalInfo.experience = "entry";
    }
    if (!Array.isArray(professionalInfo.skills)) professionalInfo.skills = [];
    if (!Array.isArray(professionalInfo.skillsToImprove))
      professionalInfo.skillsToImprove = [];
    if (!Array.isArray(interviewGoals.targetCompanies))
      interviewGoals.targetCompanies = [];
    if (!Array.isArray(preferences.interviewTypes))
      preferences.interviewTypes = [];
    if (!Array.isArray(preferences.focusAreas)) preferences.focusAreas = [];

    // Prefer profile already attached by ensureUserProfile
    let userProfile = req.userProfile;
    const baseIdentity = await User.findById(userId).lean();

    if (userProfile) {
      userProfile.professionalInfo = professionalInfo;
      userProfile.preferences = preferences;
      userProfile.interviewGoals = interviewGoals;
      userProfile.onboardingCompleted = true;
      if (!userProfile.email && baseIdentity?.email)
        userProfile.email = baseIdentity.email;
      if (!userProfile.firstName && baseIdentity?.name)
        userProfile.firstName = baseIdentity.name;
      if (!userProfile.profileImage && baseIdentity?.picture)
        userProfile.profileImage = baseIdentity.picture;
    } else {
      userProfile = await UserProfile.findOneAndUpdate(
        { user: userId },
        {
          $set: {
            professionalInfo,
            preferences,
            interviewGoals,
            onboardingCompleted: true,
          },
          $setOnInsert: {
            email: baseIdentity?.email || null,
            firstName: baseIdentity?.name || null,
            lastName: null,
            profileImage: baseIdentity?.picture || null,
          },
        },
        { new: true, upsert: true }
      );
    }

    try {
      userProfile.calculateCompleteness();
      await userProfile.save();
    } catch (calcError) {
      console.warn("Completeness calculation failed", calcError);
    }

    // Convert to plain object
    const profileData = userProfile.toObject();
    return ok(res, profileData, "Onboarding completed successfully");
  } catch (error) {
    console.error("Complete onboarding error:", error);

    if (error.name === "ValidationError") {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });
      return fail(res, 400, "VALIDATION_FAILED", "Validation failed", {
        details: validationErrors,
      });
    }
    if (error.code === 11000) {
      return fail(res, 400, "PROFILE_EXISTS", "User profile already exists");
    }
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
    const userId = req.user?.id;
    const userProfile = await UserProfile.findOne(
      { user: userId },
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
    const userProfile = await UserProfile.findOne({ user: userId });
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    Object.keys(analyticsUpdate).forEach((key) => {
      if (userProfile.analytics[key] !== undefined) {
        userProfile.analytics[key] = analyticsUpdate[key];
      }
    });

    if (analyticsUpdate.lastInterviewDate) {
      const today = new Date();
      const lastDate = new Date(userProfile.analytics.streak.lastInterviewDate);
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        userProfile.analytics.streak.current += 1;
        userProfile.analytics.streak.longest = Math.max(
          userProfile.analytics.streak.longest,
          userProfile.analytics.streak.current
        );
      } else if (daysDiff > 1) {
        userProfile.analytics.streak.current = 1;
      }
      userProfile.analytics.streak.lastInterviewDate = today;
    }

    await userProfile.save();
    return userProfile;
  } catch (error) {
    console.error("Update analytics error:", error);
    throw error;
  }
};

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
    const userId = req.user?.id;
    const asset = normalizeAsset(req.body);
    if (!asset) return fail(res, 400, "INVALID_ASSET", "Invalid asset payload");
    const profile = await UserProfile.findOneAndUpdate(
      { user: userId },
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
    const userId = req.user?.id;
    const asset = normalizeAsset(req.body);
    if (!asset) return fail(res, 400, "INVALID_ASSET", "Invalid asset payload");
    const profile = await UserProfile.findOneAndUpdate(
      { user: userId },
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
    const userId = req.user?.id;
    if (!req.file) return fail(res, 400, "NO_FILE", "No file uploaded");

    const userProfile = await UserProfile.findOneAndUpdate(
      { user: userId },
      {
        "professionalInfo.resume": {
          filename: req.file.originalname,
          url: req.file.path,
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
    const userId = req.user?.id;
    const profile = await UserProfile.findOne(
      { user: userId },
      { "preferences.dashboard": 1, _id: 0 }
    ).lean();

    const defaultPreferences = {
      density: "comfortable",
      upcomingView: "list",
      thisWeekOnly: false,
      metricsHorizon: 8,
      benchmark: "personal",
    };

    return res.json({
      success: true,
      data: profile?.preferences?.dashboard || defaultPreferences,
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
    const userId = req.user?.id;
    const { density, upcomingView, thisWeekOnly, metricsHorizon, benchmark } =
      req.body || {};
    const update = {};
    if (density) update["preferences.dashboard.density"] = density;
    if (upcomingView)
      update["preferences.dashboard.upcomingView"] = upcomingView;
    if (typeof thisWeekOnly === "boolean")
      update["preferences.dashboard.thisWeekOnly"] = thisWeekOnly;
    if (metricsHorizon && Number.isFinite(Number(metricsHorizon))) {
      const h = Math.max(1, Math.min(24, parseInt(metricsHorizon, 10)));
      update["preferences.dashboard.metricsHorizon"] = h;
    }
    if (benchmark && Number.isFinite(Number(benchmark))) {
      const b = Math.max(10, Math.min(100, parseInt(benchmark, 10)));
      update["preferences.dashboard.benchmark"] = b;
    }

    const profile = await UserProfile.findOneAndUpdate(
      { user: userId },
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

// =============== Dashboard extensions: Scheduled Sessions, Goals, Tips ===============
const getScheduledSessions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 3, page = 1, includePast, status } = req.query;

    const now = new Date();
    const baseQuery = { owner: userId };
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

const upsertScheduledSession = async (req, res) => {
  try {
    const userId = req.user?.id;
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
      owner: userId,
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
        { _id: id, owner: userId },
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

const deleteScheduledSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const result = await ScheduledSession.deleteOne({ _id: id, owner: userId });
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

const updateScheduledSessionStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["scheduled", "completed", "canceled"];
    if (!allowed.includes(status))
      return fail(res, 400, "INVALID_STATUS", "Invalid status");
    const doc = await ScheduledSession.findOneAndUpdate(
      { _id: id, owner: userId },
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

const getGoals = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userProfile = await UserProfile.findOne(
      { user: userId },
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
    const userId = req.user?.id;
    const { goals } = req.body;
    if (!Array.isArray(goals))
      return fail(res, 400, "INVALID_GOALS", "Goals must be an array");
    const userProfile = await UserProfile.findOneAndUpdate(
      { user: userId },
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

// Dynamic tips (uses Interview and UserProfile)
const getDynamicTips = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userProfile = await UserProfile.findOne(
      { user: userId },
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

    try {
      const recent = await Interview.find({ user: userId, status: "completed" })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select(
          "results.breakdown questions.category questions.followUpsReviewed questions.score.rubricScores"
        );

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
      // non-critical
    }

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

// Enhanced Dashboard Summary - Real-Time with Performance Trends
const getDashboardSummary = async (req, res) => {
  try {
    console.log("🎯 getDashboardSummary called for user:", req.user?.id);

    const userId = req.user?.id;
    if (!userId)
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");

    // Date ranges for comparisons
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const twoWeeksAgo = new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel queries for performance
    const [userProfile, allInterviews, upcomingSessions] = await Promise.all([
      UserProfile.findOne({ user: userId }).lean(),
      Interview.find({
        user: userId,
        status: "completed",
        $or: [
          { completedAt: { $exists: true } },
          { "timing.completedAt": { $exists: true } },
        ],
      })
        .sort({ completedAt: -1, "timing.completedAt": -1 })
        .limit(100) // Limit to 100 most recent interviews for performance
        .select(
          // Use nested fields that actually exist in the schema
          "jobTitle completedAt results timing questions feedback"
        )
        .lean(),
      ScheduledSession.find({
        owner: userId,
        status: "scheduled",
        scheduledAt: { $gte: now },
      })
        .sort({ scheduledAt: 1 })
        .limit(1)
        .lean(),
    ]);

    console.log("✅ Queries completed:", {
      hasProfile: !!userProfile,
      interviewsCount: allInterviews.length,
      upcomingSessionsCount: upcomingSessions.length,
    });

    console.log("🔍 UserProfile analytics field:", {
      analytics: userProfile?.analytics,
      totalInterviews: userProfile?.analytics?.totalInterviews,
      completedInterviews: userProfile?.analytics?.completedInterviews,
      averageScore: userProfile?.analytics?.averageScore,
    });

    // If no profile exists, create a basic one or return default stats
    if (!userProfile) {
      console.log("⚠️ No profile found, returning default empty stats");
      return ok(res, {
        stats: {
          totalInterviews: 0,
          completedInterviews: 0,
          averageScore: 0,
          practiceTime: 0,
          successRate: 0,
          interviewChange: 0,
          scoreChange: 0,
          successRateChange: 0,
        },
        recentInterviews: [],
        upcomingSession: null,
        skillProgress: [],
        performanceTrend: [],
        categoryStats: [],
        lastUpdated: new Date().toISOString(),
      });
    }

    // Helper to get completedAt from either location
    const getCompletedAt = (interview) => {
      return interview.completedAt || interview.timing?.completedAt || null;
    };

    // Filter interviews by time periods
    const currentWeekInterviews = allInterviews.filter((i) => {
      const completed = getCompletedAt(i);
      return completed && new Date(completed) >= lastWeek;
    });
    const previousWeekInterviews = allInterviews.filter((i) => {
      const completed = getCompletedAt(i);
      if (!completed) return false;
      const date = new Date(completed);
      return date >= twoWeeksAgo && date < lastWeek;
    });
    const currentMonthInterviews = allInterviews.filter((i) => {
      const completed = getCompletedAt(i);
      return completed && new Date(completed) >= lastMonth;
    });

    // Calculate core stats
    // Use analytics data from UserProfile for accurate totals
    const totalInterviews =
      userProfile.analytics?.totalInterviews || allInterviews.length;
    const completedInterviews =
      userProfile.analytics?.completedInterviews || allInterviews.length;
    const averageScore =
      userProfile.analytics?.averageScore ||
      (totalInterviews > 0
        ? Math.round(
            allInterviews.reduce(
              (sum, i) => sum + (i.results?.overallScore || 0),
              0
            ) / totalInterviews
          )
        : 0);

    console.log("📊 Stats being returned:", {
      totalInterviews,
      completedInterviews,
      averageScore,
      analyticsData: userProfile.analytics,
      interviewsFromQuery: allInterviews.length,
    });

    // Calculate changes (week-over-week)
    const interviewChange =
      previousWeekInterviews.length > 0
        ? Math.round(
            ((currentWeekInterviews.length - previousWeekInterviews.length) /
              previousWeekInterviews.length) *
              100
          )
        : currentWeekInterviews.length > 0
        ? 100
        : 0;

    const currentWeekAvg =
      currentWeekInterviews.length > 0
        ? currentWeekInterviews.reduce(
            (sum, i) => sum + (i.results?.overallScore || 0),
            0
          ) / currentWeekInterviews.length
        : 0;
    const previousWeekAvg =
      previousWeekInterviews.length > 0
        ? previousWeekInterviews.reduce(
            (sum, i) => sum + (i.results?.overallScore || 0),
            0
          ) / previousWeekInterviews.length
        : 0;
    const scoreChange =
      previousWeekAvg > 0
        ? Math.round(
            ((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100
          )
        : currentWeekAvg > 0
        ? 100
        : 0;

    // Calculate practice time (hours this month)
    // Practice time in hours: prefer timing.totalDuration (seconds), fallback to sum of per-question timeSpent (seconds)
    const totalSecondsThisMonth = currentMonthInterviews.reduce((sum, i) => {
      const sec = i.timing?.totalDuration || 0;
      if (sec && Number.isFinite(sec)) return sum + sec;
      const qSum = Array.isArray(i.questions)
        ? i.questions.reduce((s, q) => s + (q.timeSpent || 0), 0)
        : 0;
      return sum + qSum;
    }, 0);
    const practiceTime = totalSecondsThisMonth / 3600; // seconds -> hours

    // Calculate success rate (>= 70% score)
    const successfulInterviews = currentWeekInterviews.filter(
      (i) => (i.results?.overallScore || 0) >= 70
    ).length;
    const successRate =
      currentWeekInterviews.length > 0
        ? Math.round(
            (successfulInterviews / currentWeekInterviews.length) * 100
          )
        : 0;

    // Previous week success rate for comparison
    const prevSuccessful = previousWeekInterviews.filter(
      (i) => (i.results?.overallScore || 0) >= 70
    ).length;
    const prevSuccessRate =
      previousWeekInterviews.length > 0
        ? (prevSuccessful / previousWeekInterviews.length) * 100
        : 0;
    const successRateChange =
      prevSuccessRate > 0
        ? Math.round(((successRate - prevSuccessRate) / prevSuccessRate) * 100)
        : successRate > 0
        ? 100
        : 0;

    // Recent interviews (last 5)
    const recentInterviews = allInterviews.slice(0, 5).map((interview) => {
      const answeredCount = Array.isArray(interview.questions)
        ? interview.questions.filter((q) => q.response || q.skipped).length
        : 0;
      return {
        id: interview._id,
        jobTitle: interview.jobTitle,
        score: Math.round(interview.results?.overallScore || 0),
        questionsAnswered: answeredCount,
        completedAt: getCompletedAt(interview),
      };
    });

    // Upcoming session
    const upcomingSession =
      upcomingSessions.length > 0
        ? {
            id: upcomingSessions[0]._id,
            title: upcomingSessions[0].title,
            scheduledAt: upcomingSessions[0].scheduledAt,
            type: upcomingSessions[0].type,
            duration: upcomingSessions[0].duration,
          }
        : null;

    // Skill progress calculation
    const skillProgress = calculateSkillProgress(allInterviews);

    // Performance trend (last 7 days)
    const performanceTrend = calculatePerformanceTrend(allInterviews, 7);

    // Category distribution
    const categoryStats = calculateCategoryStats(allInterviews);

    console.log("✅ About to return dashboard data");

    return ok(res, {
      stats: {
        totalInterviews,
        completedInterviews,
        averageScore,
        practiceTime: Math.round(practiceTime * 10) / 10,
        successRate,
        interviewChange,
        scoreChange,
        successRateChange,
      },
      recentInterviews,
      upcomingSession,
      skillProgress,
      performanceTrend,
      categoryStats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Get dashboard summary error:", error);
    console.error("❌ Error stack:", error.stack);
    return fail(res, 500, "SUMMARY_FAILED", "Failed to fetch dashboard data");
  }
};

// Enhanced Dashboard Metrics with Breakdown
const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");

    const { timeRange = "30" } = req.query; // days
    const days = parseInt(timeRange, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [userProfile, interviews] = await Promise.all([
      UserProfile.findOne({ user: userId }).lean(),
      Interview.find({
        user: userId,
        status: "completed",
        $or: [
          { completedAt: { $gte: startDate } },
          { "timing.completedAt": { $gte: startDate } },
        ],
      })
        .sort({ completedAt: -1, "timing.completedAt": -1 })
        .select("completedAt results timing questions feedback")
        .lean(),
    ]);

    // Return empty metrics if no profile
    if (!userProfile) {
      return ok(res, {
        performanceBreakdown: {
          technical: { average: 0, trend: 0 },
          behavioral: { average: 0, trend: 0 },
          communication: { average: 0, trend: 0 },
          problemSolving: { average: 0, trend: 0 },
        },
        trendData: [],
        difficultyStats: { easy: 0, medium: 0, hard: 0 },
        responseTimeStats: { average: 0, fastest: 0, slowest: 0 },
        improvementRate: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Performance breakdown by category
    const performanceBreakdown = {
      technical: [],
      behavioral: [],
      communication: [],
      problemSolving: [],
    };

    interviews.forEach((interview) => {
      if (interview.results?.breakdown) {
        const breakdown = interview.results.breakdown;
        [
          ["technical", performanceBreakdown.technical],
          ["behavioral", performanceBreakdown.behavioral],
          ["communication", performanceBreakdown.communication],
          ["problemSolving", performanceBreakdown.problemSolving],
        ].forEach(([key, arr]) => {
          if (typeof breakdown[key] === "number") arr.push(breakdown[key]);
        });
      }
    });

    const avgCategory = (arr) =>
      arr.length > 0
        ? Math.round(arr.reduce((sum, n) => sum + n, 0) / arr.length)
        : 0;

    // Time-based performance trend
    const trendData = calculateDetailedTrend(interviews, days);

    // Question difficulty distribution
    const difficultyStats = calculateDifficultyStats(interviews);

    // Response time analytics
    const responseTimeStats = calculateResponseTimeStats(interviews);

    // Improvement rate (comparing first half vs second half of period)
    const improvementRate = calculateImprovementRate(interviews);

    return ok(res, {
      overview: {
        totalInterviews: interviews.length,
        averageScore:
          interviews.length > 0
            ? Math.round(
                interviews.reduce(
                  (sum, i) => sum + (i.results?.overallScore || 0),
                  0
                ) / interviews.length
              )
            : 0,
        improvementRate,
        timeRange: days,
      },
      performance: {
        technical: avgCategory(performanceBreakdown.technical),
        behavioral: avgCategory(performanceBreakdown.behavioral),
        communication: avgCategory(performanceBreakdown.communication),
        problemSolving: avgCategory(performanceBreakdown.problemSolving),
      },
      strongAreas: userProfile.analytics?.strongAreas || [],
      areasToImprove: userProfile.analytics?.improvementAreas || [],
      trendData,
      difficultyStats,
      responseTimeStats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get dashboard metrics error:", error);
    return fail(res, 500, "METRICS_FAILED", "Failed to get dashboard metrics");
  }
};

// Enhanced Dashboard Recommendation - AI-powered
const getDashboardRecommendation = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");

    const [userProfile, recentInterviews] = await Promise.all([
      UserProfile.findOne({ user: userId }).lean(),
      Interview.find({
        user: userId,
        status: "completed",
        $or: [
          { completedAt: { $exists: true } },
          { "timing.completedAt": { $exists: true } },
        ],
      })
        .sort({ completedAt: -1, "timing.completedAt": -1 })
        .limit(10)
        .select("results feedback questions completedAt timing")
        .lean(),
    ]);

    // Return default recommendation if no profile
    if (!userProfile) {
      return ok(res, {
        type: "getting-started",
        title: "Welcome to MockMate! 🚀",
        message:
          "Start your interview preparation journey by taking your first mock interview. We'll help you build confidence and improve your skills.",
        priority: "medium",
        actionable: true,
        suggestedActions: [
          {
            action: "Start your first mock interview",
            reason: "Build a baseline to track your progress",
            route: "/mock-interview",
          },
          {
            action: "Complete your profile",
            reason: "Help us personalize your experience",
            route: "/profile",
          },
        ],
        insights: [],
        lastUpdated: new Date().toISOString(),
      });
    }

    const totalInterviews = recentInterviews.length;
    const avgScore =
      totalInterviews > 0
        ? recentInterviews.reduce(
            (sum, i) => sum + (i.results?.overallScore || 0),
            0
          ) / totalInterviews
        : 0;

    let recommendation;

    // No interviews yet
    if (totalInterviews === 0) {
      recommendation = {
        type: "start",
        priority: "high",
        title: "🚀 Start Your First Mock Interview",
        description:
          "Begin your interview preparation journey with an AI-powered practice session tailored to your goals.",
        insights: [
          "Get instant feedback on your answers",
          "Build confidence with realistic scenarios",
          "Track your progress from day one",
        ],
        action: {
          label: "Start First Interview",
          url: "/mock-interview",
          variant: "primary",
        },
        estimatedTime: "15-30 minutes",
      };
    }
    // Early stage (< 5 interviews)
    else if (totalInterviews < 5) {
      recommendation = {
        type: "practice",
        priority: "high",
        title: "💪 Build Your Foundation",
        description:
          "Complete more practice interviews to unlock detailed analytics and personalized insights.",
        insights: [
          `You've completed ${totalInterviews} interview${
            totalInterviews > 1 ? "s" : ""
          }`,
          "5 interviews needed to unlock full analytics",
          `Current average: ${Math.round(avgScore)}%`,
        ],
        action: {
          label: "Continue Practicing",
          url: "/mock-interview",
          variant: "primary",
        },
        progress: {
          current: totalInterviews,
          target: 5,
          percentage: (totalInterviews / 5) * 100,
        },
        estimatedTime: "20-30 minutes",
      };
    }
    // Score-based recommendations
    else if (avgScore < 60) {
      const weakAreas = userProfile.analytics?.improvementAreas || [];
      recommendation = {
        type: "improve",
        priority: "high",
        title: "📚 Focus on Fundamentals",
        description:
          "Your recent scores suggest focusing on core concepts and structured answer frameworks.",
        insights: [
          `Average score: ${Math.round(avgScore)}%`,

          weakAreas.length > 0
            ? `Weak areas: ${weakAreas.slice(0, 2).join(", ")}`
            : "Work on answer structure",
          "STAR method can boost scores by 20-30%",
        ],
        action: {
          label: "Practice Fundamentals",
          url: "/practice?difficulty=easy",
          variant: "primary",
        },
        secondaryAction: {
          label: "View Resources",
          url: "/resources",
          variant: "secondary",
        },
        estimatedTime: "30-45 minutes",
      };
    } else if (avgScore < 75) {
      recommendation = {
        type: "improve",
        priority: "medium",
        title: "⭐ Enhance Your Responses",
        description:
          "You're doing well! Add concrete examples and measurable outcomes to reach the next level.",
        insights: [
          `Average score: ${Math.round(avgScore)}%`,
          "Focus on depth and specificity",
          "Add quantifiable results to answers",
        ],
        action: {
          label: "Practice Medium Questions",
          url: "/practice?difficulty=medium",
          variant: "primary",
        },
        secondaryAction: {
          label: "Review Past Interviews",
          url: "/interviews",
          variant: "secondary",
        },
        estimatedTime: "30-40 minutes",
      };
    } else {
      recommendation = {
        type: "advance",
        priority: "medium",
        title: "🎯 Challenge Yourself",
        description:
          "Excellent work! Push your limits with advanced scenarios and longer interview sessions.",
        insights: [
          `Average score: ${Math.round(avgScore)}%`,
          "Ready for harder questions",
          "Try full-length interview simulations",
        ],
        action: {
          label: "Try Hard Questions",
          url: "/practice?difficulty=hard",
          variant: "primary",
        },
        secondaryAction: {
          label: "Schedule Full Interview",
          url: "/scheduled",
          variant: "secondary",
        },
        estimatedTime: "45-60 minutes",
      };
    }

    // Add contextual insights based on recent performance
    const recentTrend = calculateRecentTrend(recentInterviews);
    if (recentTrend.isImproving) {
      recommendation.badge = {
        text: "📈 Improving",
        variant: "success",
      };
    } else if (recentTrend.isDecreasing) {
      recommendation.badge = {
        text: "⚠️ Needs Attention",
        variant: "warning",
      };
    }

    return ok(res, recommendation);
  } catch (error) {
    console.error("Get dashboard recommendation error:", error);
    return fail(
      res,
      500,
      "RECOMMENDATION_FAILED",
      "Failed to get recommendation"
    );
  }
};

// ========== Helper Functions ==========

// Helper to normalize completedAt access (handles both root and timing.completedAt)
function getInterviewCompletedAt(interview) {
  return interview.completedAt || interview.timing?.completedAt || null;
}

function calculateSkillProgress(interviews) {
  const skills = {};

  interviews.forEach((interview) => {
    if (interview.results?.breakdown) {
      const breakdown = interview.results.breakdown;
      ["technical", "behavioral", "communication", "problemSolving"].forEach(
        (skill) => {
          if (typeof breakdown[skill] === "number") {
            if (!skills[skill]) {
              skills[skill] = { total: 0, count: 0 };
            }
            skills[skill].total += breakdown[skill];
            skills[skill].count += 1;
          }
        }
      );
    }
  });

  return Object.entries(skills)
    .map(([name, data]) => ({
      name:
        name.charAt(0).toUpperCase() +
        name
          .slice(1)
          .replace(/([A-Z])/g, " $1")
          .trim(),
      progress: Math.round(data.total / data.count),
      trend: calculateSkillTrend(interviews, name),
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);
}

function calculateSkillTrend(interviews, skillName) {
  const recent = interviews.slice(0, 3);
  const older = interviews.slice(3, 6);

  const recentAvg =
    recent.length > 0
      ? recent.reduce(
          (sum, i) => sum + (i.results?.breakdown?.[skillName] || 0),
          0
        ) / recent.length
      : 0;
  const olderAvg =
    older.length > 0
      ? older.reduce(
          (sum, i) => sum + (i.results?.breakdown?.[skillName] || 0),
          0
        ) / older.length
      : 0;

  if (olderAvg === 0) return 0;
  return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
}

function calculatePerformanceTrend(interviews, days) {
  // First, get only completed interviews with scores
  const completedInterviews = interviews
    .filter((interview) => {
      const completed = getInterviewCompletedAt(interview);
      return completed && interview.results?.overallScore != null;
    })
    .sort((a, b) => {
      const dateA = new Date(getInterviewCompletedAt(a));
      const dateB = new Date(getInterviewCompletedAt(b));
      return dateA - dateB;
    });

  // If no completed interviews, return empty trend
  if (completedInterviews.length === 0) {
    return [];
  }

  // Strategy: Show last N completed interviews for better visualization
  // This ensures we always have data to display instead of empty days
  const maxDataPoints = Math.min(7, completedInterviews.length);
  const recentInterviews = completedInterviews.slice(-maxDataPoints);

  const trend = recentInterviews.map((interview, index) => {
    const completedAt = new Date(getInterviewCompletedAt(interview));
    const score = interview.results?.overallScore || 0;

    // Create a label based on date or sequence
    let label;
    const daysDiff = Math.floor(
      (new Date() - completedAt) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      label = "Today";
    } else if (daysDiff === 1) {
      label = "Yesterday";
    } else if (daysDiff < 7) {
      label = completedAt.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      label = completedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    return {
      date: completedAt.toISOString().split("T")[0],
      label: label,
      score: Math.round(score),
      interviewId: interview._id,
      role: interview.role || "Interview",
      type: interview.type || "General",
    };
  });

  return trend;
}

function calculateCategoryStats(interviews) {
  const categories = {};

  interviews.forEach((interview) => {
    interview.questions?.forEach((question) => {
      const category = question.category || "general";
      if (!categories[category]) {
        categories[category] = { count: 0, totalScore: 0 };
      }
      categories[category].count += 1;
      categories[category].totalScore += question.score?.overall || 0;
    });
  });

  return Object.entries(categories)
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function calculateDetailedTrend(interviews, days) {
  // Group by week for trends longer than 14 days
  const groupByWeek = days > 14;
  const periods = groupByWeek ? Math.ceil(days / 7) : days;
  const trend = [];

  for (let i = 0; i < periods; i++) {
    const periodInterviews = interviews.filter((interview) => {
      const completed = getInterviewCompletedAt(interview);
      if (!completed) return false;
      const daysDiff = Math.floor(
        (new Date() - new Date(completed)) / (1000 * 60 * 60 * 24)
      );
      if (groupByWeek) {
        const weekStart = i * 7;
        const weekEnd = (i + 1) * 7;
        return daysDiff >= weekStart && daysDiff < weekEnd;
      }
      return daysDiff === i;
    });

    if (periodInterviews.length > 0) {
      const avgScore =
        periodInterviews.reduce(
          (sum, i) => sum + (i.results?.overallScore || 0),
          0
        ) / periodInterviews.length;
      trend.push({
        period: groupByWeek ? `Week ${i + 1}` : `Day ${i + 1}`,
        score: Math.round(avgScore),
        count: periodInterviews.length,
      });
    }
  }

  return trend.reverse();
}

function calculateDifficultyStats(interviews) {
  const difficulty = { easy: 0, medium: 0, hard: 0 };

  interviews.forEach((interview) => {
    interview.questions?.forEach((question) => {
      const level = question.difficulty || "medium";
      difficulty[level] = (difficulty[level] || 0) + 1;
    });
  });

  const total = Object.values(difficulty).reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    easy: {
      count: difficulty.easy,
      percentage: total > 0 ? Math.round((difficulty.easy / total) * 100) : 0,
    },
    medium: {
      count: difficulty.medium,
      percentage: total > 0 ? Math.round((difficulty.medium / total) * 100) : 0,
    },
    hard: {
      count: difficulty.hard,
      percentage: total > 0 ? Math.round((difficulty.hard / total) * 100) : 0,
    },
  };
}

function calculateResponseTimeStats(interviews) {
  const times = [];

  interviews.forEach((interview) => {
    (interview.questions || []).forEach((q) => {
      if (Number.isFinite(q.timeSpent) && q.timeSpent > 0) {
        times.push(q.timeSpent);
      }
    });
  });

  if (times.length === 0) {
    return { average: 0, median: 0, fastest: 0, slowest: 0 };
  }

  times.sort((a, b) => a - b);
  const average = times.reduce((sum, t) => sum + t, 0) / times.length;
  const median = times[Math.floor(times.length / 2)];

  return {
    average: Math.round(average),
    median: Math.round(median),
    fastest: times[0],
    slowest: times[times.length - 1],
  };
}

function calculateImprovementRate(interviews) {
  if (interviews.length < 2) return 0;

  const midpoint = Math.floor(interviews.length / 2);
  const firstHalf = interviews.slice(midpoint);
  const secondHalf = interviews.slice(0, midpoint);

  const firstAvg =
    firstHalf.reduce((sum, i) => sum + (i.results?.overallScore || 0), 0) /
    firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, i) => sum + (i.results?.overallScore || 0), 0) /
    secondHalf.length;

  return firstAvg > 0
    ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100)
    : 0;
}

function calculateRecentTrend(interviews) {
  if (interviews.length < 3) return { isImproving: false, isDecreasing: false };

  const recent3 = interviews.slice(0, 3);
  const scores = recent3.map((i) => i.results?.overallScore || 0);

  const isImproving = scores[0] > scores[1] && scores[1] > scores[2];
  const isDecreasing = scores[0] < scores[1] && scores[1] < scores[2];

  return { isImproving, isDecreasing };
}

// Export all functions
// Real-time dashboard stream using Server-Sent Events (SSE)
// Sends periodic summary updates; future enhancement could hook into Mongo change streams.
const streamDashboard = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.writeHead(401);
    res.write("event: error\n" + "data: Unauthorized\n\n");
    return res.end();
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("retry: 10000\n\n");

  let closed = false;
  req.on("close", () => {
    closed = true;
    clearInterval(intervalId);
  });

  async function push() {
    if (closed) return;
    try {
      // Reuse core summary logic with lightweight query (last 30 days)
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const interviews = await Interview.find({
        user: userId,
        status: "completed",
        completedAt: { $gte: since },
      })
        .sort({ completedAt: -1 })
        .limit(25)
        .select("completedAt results timing questions")
        .lean();

      const total = interviews.length;
      const avg =
        total > 0
          ? Math.round(
              interviews.reduce(
                (s, i) => s + (i.results?.overallScore || 0),
                0
              ) / total
            )
          : 0;
      const practiceSeconds = interviews.reduce((sum, i) => {
        const sec = i.timing?.totalDuration || 0;
        if (sec && Number.isFinite(sec)) return sum + sec;
        const qs = Array.isArray(i.questions)
          ? i.questions.reduce((ss, q) => ss + (q.timeSpent || 0), 0)
          : 0;
        return sum + qs;
      }, 0);
      const practiceHours = Math.round((practiceSeconds / 3600) * 10) / 10;

      const payload = {
        totalInterviews: total,
        averageScore: avg,
        practiceTimeHours: practiceHours,
        lastUpdated: new Date().toISOString(),
      };
      res.write(`event: update\n` + `data: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      res.write(
        "event: error\n" + `data: ${JSON.stringify({ message: e.message })}\n\n`
      );
    }
  }

  // Initial push
  await push();
  const intervalId = setInterval(push, 15000); // every 15s
};

module.exports = {
  upgradeToPremium,
  getProfile,
  bootstrapProfile,
  saveOnboardingProgress,
  updateProfile,
  completeOnboarding,
  getAnalytics,
  updateAnalytics,
  updateAvatar,
  updateResumeAsset,
  uploadResume,
  getDashboardPreferences,
  updateDashboardPreferences,
  getScheduledSessions,
  upsertScheduledSession,
  deleteScheduledSession,
  updateScheduledSessionStatus,
  getGoals,
  updateGoals,
  getDynamicTips,
  getDashboardSummary,
  getDashboardMetrics,
  getDashboardRecommendation,
  streamDashboard,
};
