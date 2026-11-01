const apiKey = process.env.HC_CDN_API_KEY;
const apiUrl = "https://cdn.hackclub.com/api/v4";

if (!apiKey) {
  throw new Error("HC_CDN_API_KEY is not set in the environment variables.");
}

type UploadResponse = {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  url: string;
  created_at: string;
};

export type UploadDetails = {
  id: string;
  filename: string;
  size: number;
};

export async function uploadFile(
  file: File | Blob,
  filename?: string,
): Promise<UploadDetails> {
  const formData = new FormData();
  formData.append("file", file, filename);

  const uploadUrl = `${apiUrl}/upload`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CDN Upload failed (${response.status}): ${errorText}`);
  }

  const data: UploadResponse = await response.json();

  if (!data.id || !data.filename || !data.url) {
    throw new Error("CDN response did not contain all required fields.");
  }

  return {
    id: data.id,
    filename: data.filename,
    size: data.size,
  };
}

export async function getFileUrl(
  id: string,
  filename: string,
): Promise<string> {
  return `https://cdn.hackclub.com/${id}/${filename}`;
}

export async function deleteFile(id: string): Promise<void> {
  const deleteUrl = `${apiUrl}/upload/${id}`;

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CDN Delete failed (${response.status}): ${errorText}`);
  }
}
