import React, { useState } from "react";
import toast from "react-hot-toast";
import { directUpload, toAssetSubset } from "../../services/cloudinary";
import api from "../../services/api";

export default function RecordingUploader({ sessionId }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setProgress(0);
      const folder = `mockmate/dev/users/me/sessions/${sessionId}`;
      const resp = await directUpload(file, {
        folder,
        resourceType: "video",
        onProgress: setProgress,
      });
      const asset = toAssetSubset(resp);
      await api.put(`/interviews/sessions/${sessionId}/recording`, asset);
      toast.success("Recording attached");
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input type="file" accept="video/*,audio/*" onChange={onChange} disabled={uploading} />
      {uploading && (
        <div className="text-sm text-gray-600">Uploading… {progress}%</div>
      )}
    </div>
  );
}
