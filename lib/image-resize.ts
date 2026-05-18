// Client-side image downsize using canvas. Keeps storage and LLM context
// costs bounded by capping the long edge of every screenshot before upload.

export type ResizedImage = {
  blob: Blob;
  width: number;
  height: number;
  mime: "image/jpeg";
};

const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.85;

export async function resizeImage(
  file: File,
  options: { maxEdge?: number; quality?: number } = {},
): Promise<ResizedImage> {
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options.quality ?? DEFAULT_QUALITY;

  const bitmap = await createImageBitmap(file);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))),
        "image/jpeg",
        quality,
      );
    });

    return { blob, width, height, mime: "image/jpeg" };
  } finally {
    bitmap.close?.();
  }
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}
