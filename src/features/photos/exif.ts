import exifr from 'exifr';

export interface PhotoMeta {
  /** YYYY-MM-DD from EXIF capture time, if present. */
  date?: string;
  lat?: number;
  lng?: number;
}

/** Best-effort EXIF read for auto-filling a sighting's date and location. Never throws. */
export async function readPhotoMeta(file: File): Promise<PhotoMeta> {
  try {
    const data = await exifr.parse(file, { gps: true });
    if (!data) return {};
    const d: unknown = data.DateTimeOriginal ?? data.CreateDate;
    const date = d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : undefined;
    const lat = typeof data.latitude === 'number' ? +data.latitude.toFixed(6) : undefined;
    const lng = typeof data.longitude === 'number' ? +data.longitude.toFixed(6) : undefined;
    return { date, lat, lng };
  } catch {
    return {};
  }
}
