/**
 * Downscale a captured image to keep on-device storage small. Large phone photos (often
 * 4-12 MP) are re-encoded to JPEG with a max edge of ~1600px. On any failure we fall back
 * to storing the original file bytes so a photo is never lost.
 */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export async function processImage(file: File): Promise<{ blob: Blob; mime: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    );
    if (!blob) throw new Error('toBlob failed');
    return { blob, mime: 'image/jpeg' };
  } catch {
    return { blob: file, mime: file.type || 'image/jpeg' };
  }
}
