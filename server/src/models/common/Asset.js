const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, index: true },
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      required: true,
    },
    secureUrl: { type: String, required: true },
    bytes: Number,
    width: Number,
    height: Number,
    duration: Number,
    format: String,
    version: Number,
    tags: [{ type: String }],
    context: { type: Map, of: String },
    uploadedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
  },
  { _id: false }
);

module.exports = AssetSchema;
