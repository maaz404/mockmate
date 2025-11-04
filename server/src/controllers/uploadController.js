/* eslint-disable no-magic-numbers */
const cloudinary = require("../config/cloudinary");

// Helper: sign upload parameters for direct unsigned client upload
const getSignedUploadParams = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    let { folder } = req.query;
    const resource_type = req.query.resource_type || "auto";
    const context = req.query.context;
    const tags = req.query.tags;
    const upload_preset = req.query.upload_preset;
    const overwrite = req.query.overwrite || false;

    // Normalize 'me' in folder to the actual userId for consistent cleanup
    if (folder && typeof folder === "string") {
      folder = folder.replace(/\/users\/me(\/|$)/, `/users/${userId}$1`);
    }
    if (!folder) {
      folder = `mockmate/dev/users/${userId}`;
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = {
      timestamp,
      folder, // normalized folder used for signing
      resource_type,
      overwrite,
    };

    if (context) paramsToSign.context = context; // string format: key=value|k2=v2
    if (tags) paramsToSign.tags = tags; // comma-separated
    if (upload_preset) paramsToSign.upload_preset = upload_preset;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.json({
      success: true,
      data: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        timestamp,
        folder, // return normalized folder so client can use it
        resource_type,
        signature,
        upload_preset,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to sign upload" });
  }
};

// Destroy a single asset by public_id and resource_type
const destroyByPublicId = async (req, res) => {
  try {
    const { public_id, resource_type = "image" } = req.body || {};
    if (!public_id) {
      return res
        .status(400)
        .json({ success: false, message: "public_id is required" });
    }
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type,
      invalidate: true,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete asset" });
  }
};

// Utility: destroy all assets matching a prefix across pages
async function destroyByPrefix(prefix, resource_type = "image") {
  let next_cursor = undefined;
  /* eslint-disable no-constant-condition */
  while (true) {
    const list = await cloudinary.api.resources({
      type: "upload",
      prefix,
      resource_type,
      max_results: 100,
      next_cursor,
    });
    const ids = (list.resources || []).map((r) => r.public_id);
    if (ids.length > 0) {
      // Bulk delete
      await cloudinary.api.delete_resources(ids, { resource_type });
    }
    if (!list.next_cursor) break;
    next_cursor = list.next_cursor;
  }
}

// Health check for uploads
const uploadHealth = async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return res
        .status(500)
        .json({ success: false, error: "Cloudinary config missing" });
    }
    // Try to list resources as a health check
    try {
      const cloudinary = require("../config/cloudinary");
      await cloudinary.api.resources({ max_results: 1 });
      return res.json({ success: true, cloudName });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Cloudinary API failed",
        detail: err.message,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getSignedUploadParams,
  destroyByPublicId,
  destroyByPrefix,
  uploadHealth,
};
