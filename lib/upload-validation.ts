export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_UPLOAD_BODY_BYTES = 22 * 1024 * 1024; // 22 MB (Generous 2MB overhead)

export async function isPdfFile(file: File): Promise<boolean> {
  if (
    file.type !== "application/pdf" ||
    !file.name.toLowerCase().endsWith(".pdf")
  )
    return false;
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return new TextDecoder().decode(header) === "%PDF-";
}
