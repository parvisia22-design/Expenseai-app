import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Files land in $UPLOAD_DIR (Railway volume mount) or ./uploads locally.
// They are served through /api/files/[name] so Next can gate access if needed.
export const UPLOAD_ROOT =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function saveImage(buf: Buffer, mediaType: string) {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  const ext = EXT_BY_MIME[mediaType] ?? "bin";
  const name = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_ROOT, name), buf);
  return { name, url: `/api/files/${name}` };
}

export async function readImage(name: string) {
  const safe = path.basename(name);
  return fs.readFile(path.join(UPLOAD_ROOT, safe));
}

export function contentTypeFromName(name: string) {
  const ext = path.extname(name).slice(1).toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}
