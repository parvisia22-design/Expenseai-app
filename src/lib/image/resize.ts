// Resize a File in the browser to a JPEG under Claude's 10 MB limit.
// Longest edge → maxDim, quality 0.85. Keeps EXIF orientation via createImageBitmap.
export async function resizeForOCR(file: File, maxDim = 2048): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
