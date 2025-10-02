import api from "./api";

export async function getSignedParams({
  folder,
  resourceType = "auto",
  uploadPreset,
}) {
  const params = new URLSearchParams();
  if (folder) params.append("folder", folder);
  if (resourceType) params.append("resource_type", resourceType);
  if (uploadPreset) params.append("upload_preset", uploadPreset);
  const { data } = await api.get(`/uploads/sign?${params.toString()}`);
  if (!data?.success)
    throw new Error(data?.message || "Failed to get signature");
  return data.data;
}

export async function directUpload(
  file,
  { folder, resourceType = "auto", onProgress, uploadPreset }
) {
  const { cloudName, apiKey, timestamp, signature } = await getSignedParams({
    folder,
    resourceType,
    uploadPreset,
  });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  if (folder) form.append("folder", folder);
  form.append("signature", signature);
  if (uploadPreset) form.append("upload_preset", uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const xhr = new XMLHttpRequest();
  const p = new Promise((resolve, reject) => {
    xhr.open("POST", endpoint, true);
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json);
        } else {
          reject(new Error(json?.error?.message || "Upload failed"));
        }
      } catch (e) {
        reject(e);
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };
    }
    xhr.send(form);
  });

  return p;
}

// Convert Cloudinary response to Asset subset for server
export function toAssetSubset(resp) {
  if (!resp) return null;
  return {
    public_id: resp.public_id,
    resource_type: resp.resource_type,
    secure_url: resp.secure_url,
    bytes: resp.bytes,
    width: resp.width,
    height: resp.height,
    duration: resp.duration,
    format: resp.format,
    version: resp.version,
    tags: resp.tags,
    context: resp.context,
    uploadedAt: new Date().toISOString(),
  };
}
