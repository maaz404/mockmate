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
    const { userId } = req.auth;
    const { id } = req.params;
    const asset = normalizeAsset(req.body);
    if (!asset) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid asset payload" });
    }
    const doc = await Interview.findOneAndUpdate(
      { _id: id, userId },
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
    const { userId } = req.auth;
    const { id } = req.params;
    const asset = normalizeAsset(req.body);
    if (!asset) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid asset payload" });
    }
    const doc = await Interview.findOneAndUpdate(
      { _id: id, userId },
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
    const { userId } = req.auth;
    const { id } = req.params;
    const asset = normalizeAsset(req.body);
    if (!asset) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid asset payload" });
    }
    const doc = await Interview.findOneAndUpdate(
      { _id: id, userId },
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

module.exports = { setRecording, addSnapshot, setTranscript };
