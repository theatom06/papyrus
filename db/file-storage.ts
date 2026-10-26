import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { BunFile } from "bun";

const storageDir = path.resolve(
  /*turbopackIgnore: true*/ process.env.STORAGE_DIR ||
    path.join(process.cwd(), "storage"),
);
const paperDir = path.join(storageDir, "paper");

await mkdir(paperDir, { recursive: true });

export async function savePaperFile(id: string, file: File): Promise<string> {
  if (!id || id !== path.basename(id) || id === "." || id === "..")
    throw new Error("Invalid paper file ID.");

  const filePath = path.join(paperDir, `${id}.pdf`);
  await Bun.write(filePath, file);
  return path.relative(storageDir, filePath);
}

export async function readPaperFile(relativePath: string): Promise<BunFile> {
  const resolved = path.resolve(storageDir, relativePath);

  if (!isWithinStorage(resolved)) throw new Error("Invalid paper file path.");

  const file = Bun.file(resolved);
  if (await file.exists()) {
    return file;
  }

  return file;
}

export async function removePaperFile(relativePath: string) {
  const resolved = path.resolve(storageDir, relativePath);
  if (isWithinStorage(resolved)) await Bun.file(resolved).delete();
}

function isWithinStorage(filePath: string): boolean {
  const relative = path.relative(storageDir, filePath);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}
