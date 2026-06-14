/**
 * App settings live in localStorage — they're device config (AI key, model, region,
 * units), not herbarium data, and never leave the device. The AI key is only ever read
 * to make a request the user explicitly triggered.
 */
export interface AppSettings {
  /** Anthropic API key. Stored locally only. */
  apiKey: string;
  /** Claude model id used for reference generation. */
  model: string;
  /** Free-text region/bioregion sent as context to the model. */
  region: string;
  /** Optional home coordinates for sunrise/sunset on Today. */
  homeLat?: number;
  homeLng?: number;
  units: 'imperial' | 'metric';
  /** Opt-in: streak, level, and achievements. Off by default to keep the calm tool feel. */
  gamification: boolean;
  theme: 'forest' | 'parchment';
  textScale: 'normal' | 'large';
  /** Opt-in local reminders for due preparations etc. */
  notifications: boolean;
}

export const AI_MODELS = [
  { code: 'claude-opus-4-8', label: 'Claude Opus 4.8 (most capable)' },
  { code: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (balanced)' },
  { code: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fastest)' },
] as const;

const STORAGE_KEY = 'verdant.settings';

const DEFAULTS: AppSettings = {
  apiKey: '',
  model: 'claude-opus-4-8',
  region: '',
  units: 'imperial',
  gamification: false,
  theme: 'forest',
  textScale: 'normal',
  notifications: false,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
