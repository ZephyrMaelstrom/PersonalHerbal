/**
 * Offline astronomy helpers — no network, no API. Used to make the Today screen feel
 * alive (moon phase always; sunrise/sunset when a home location is set).
 */

const SYNODIC_MONTH = 29.53058867;
// A known new moon: 2000-01-06 18:14 UTC.
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export interface MoonPhase {
  /** 0..1 through the lunar cycle (0 = new, 0.5 = full). */
  fraction: number;
  /** 0..1 illuminated. */
  illumination: number;
  name: string;
  emoji: string;
}

export function moonPhase(date = new Date()): MoonPhase {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000;
  let fraction = (days % SYNODIC_MONTH) / SYNODIC_MONTH;
  if (fraction < 0) fraction += 1;
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2;

  const phases: Array<[string, string]> = [
    ['New moon', '🌑'],
    ['Waxing crescent', '🌒'],
    ['First quarter', '🌓'],
    ['Waxing gibbous', '🌔'],
    ['Full moon', '🌕'],
    ['Waning gibbous', '🌖'],
    ['Last quarter', '🌗'],
    ['Waning crescent', '🌘'],
  ];
  const idx = Math.round(fraction * 8) % 8;
  const [name, emoji] = phases[idx];
  return { fraction, illumination, name, emoji };
}

function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

function fromJulian(j: number): Date {
  return new Date((j - 2_440_587.5) * 86_400_000);
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  /** Daylight length in hours. */
  daylightHours: number;
}

/**
 * Sunrise/sunset via the standard sunrise equation. Approximate (±a few minutes), good
 * enough for a "today" glance. Returns null near the poles when the sun doesn't rise/set.
 * `lng` is east-positive.
 */
export function sunTimes(date: Date, lat: number, lng: number): SunTimes | null {
  const rad = Math.PI / 180;
  const n = Math.ceil(julianDay(date) - 2_451_545.0 + 0.0008);
  const jStar = n + lng / 360;
  const m = (357.5291 + 0.98560028 * jStar) % 360;
  const mr = m * rad;
  const c = 1.9148 * Math.sin(mr) + 0.02 * Math.sin(2 * mr) + 0.0003 * Math.sin(3 * mr);
  const lambda = ((m + c + 180 + 102.9372) % 360) * rad;
  const jTransit = 2_451_545.0 + jStar + 0.0053 * Math.sin(mr) - 0.0069 * Math.sin(2 * lambda);
  const delta = Math.asin(Math.sin(lambda) * Math.sin(23.44 * rad));
  const cosH =
    (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(delta)) /
    (Math.cos(lat * rad) * Math.cos(delta));
  if (cosH > 1 || cosH < -1) return null;
  const h = Math.acos(cosH) / rad;
  const sunrise = fromJulian(jTransit - h / 360);
  const sunset = fromJulian(jTransit + h / 360);
  return { sunrise, sunset, daylightHours: (sunset.getTime() - sunrise.getTime()) / 3_600_000 };
}
