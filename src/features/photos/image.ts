/**
 * Downscale a captured image to keep on-device storage small. Large phone photos (often
 * 4-12 MP) are re-encoded to JPEG with a max edge of ~1600px. On any failure we fall back
 * to storing the original file bytes so a photo is never lost.
 */
const MAX_EDGE = 1600;
const THUMB_EDGE = 320;
const JPEG_QUALITY = 0.82;
const THUMB_QUALITY = 0.7;

async function resizeToBlob(source: Blob, maxEdge: number, quality: number): Promise<Blob | null> {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function processImage(file: File): Promise<{ blob: Blob; mime: string }> {
  try {
    const blob = await resizeToBlob(file, MAX_EDGE, JPEG_QUALITY);
    if (!blob) throw new Error('toBlob failed');
    return { blob, mime: 'image/jpeg' };
  } catch {
    return { blob: file, mime: file.type || 'image/jpeg' };
  }
}

/** Small thumbnail for fast grids; falls back to undefined (callers use the full blob then). */
export async function makeThumb(source: Blob): Promise<Blob | undefined> {
  try {
    return (await resizeToBlob(source, THUMB_EDGE, THUMB_QUALITY)) ?? undefined;
  } catch {
    return undefined;
  }
}
