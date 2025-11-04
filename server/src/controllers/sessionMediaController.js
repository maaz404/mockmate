const Interview = require("../models/Interview");

// Validate minimal Asset subset
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

// PUT /api/interviews/sessions/:id/recording
async function setRecording(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const asset = normalizeAsset(req.body);
    if (!asset) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid asset payload" });
    }
    const doc = await Interview.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { recording: asset } },
      { new: true }
    ).lean();
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to attach recording" });
  }
}

// POST /api/interviews/sessions/:id/snapshots
async function addSnapshot(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const asset = normalizeAsset(req.body);
    if (!asset) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid asset payload" });
    }
    const doc = await Interview.findOneAndUpdate(
      { _id: id, user: userId },
      { $push: { snapshots: asset } },
      { new: true }
    ).lean();
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to add snapshot" });
  }
}

// PUT /api/interviews/sessions/:id/transcript
async function setTranscript(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const asset = normalizeAsset(req.body);
    if (!asset) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid asset payload" });
    }
    const doc = await Interview.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { transcript: asset } },
      { new: true }
    ).lean();
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to attach transcript" });
  }
}

// POST /api/interview-media/:id/media
async function attachMedia(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { mediaUrl, mediaType, metadata } = req.body;

    const mediaEntry = {
      url: mediaUrl,
      type: mediaType,
      metadata: metadata || {},
      uploadedAt: new Date(),
    };

    const doc = await Interview.findOneAndUpdate(
      { _id: id, user: userId },
      { $push: { media: mediaEntry } },
      { new: true }
    ).lean();

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    }

    return res.json({
      success: true,
      data: doc.media[doc.media.length - 1],
      message: "Media attached successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to attach media" });
  }
}

// GET /api/interview-media/:id/media
async function getInterviewMedia(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const doc = await Interview.findOne(
      { _id: id, user: userId },
      { media: 1, recording: 1, snapshots: 1, transcript: 1 }
    ).lean();

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    }

    return res.json({
      success: true,
      data: {
        media: doc.media || [],
        recording: doc.recording || null,
        snapshots: doc.snapshots || [],
        transcript: doc.transcript || null,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to get media" });
  }
}

// DELETE /api/interview-media/:id/media/:mediaId
async function deleteInterviewMedia(req, res) {
  try {
    const userId = req.user?.id;
    const { id, mediaId } = req.params;

    const doc = await Interview.findOneAndUpdate(
      { _id: id, user: userId },
      { $pull: { media: { _id: mediaId } } },
      { new: true }
    ).lean();

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    }

    return res.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete media" });
  }
}

// PATCH /api/interview-media/:id/media/:mediaId
async function updateMediaMetadata(req, res) {
  try {
    const userId = req.user?.id;
    const { id, mediaId } = req.params;
    const { metadata, description } = req.body;

    const updateFields = {};
    if (metadata) updateFields["media.$.metadata"] = metadata;
    if (description) updateFields["media.$.description"] = description;

    const doc = await Interview.findOneAndUpdate(
      { _id: id, user: userId, "media._id": mediaId },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Interview or media not found" });
    }

    const updatedMedia = doc.media.find((m) => m._id.toString() === mediaId);

    return res.json({
      success: true,
      data: updatedMedia,
      message: "Media metadata updated successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update media metadata" });
  }
}

module.exports = {
  setRecording,
  addSnapshot,
  setTranscript,
  attachMedia,
  getInterviewMedia,
  deleteInterviewMedia,
  updateMediaMetadata,
};
