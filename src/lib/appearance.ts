import type { AppSettings } from './settings';

/** Reflect theme + text-size settings onto <html> data attributes (CSS keys off these). */
export function applyAppearance(s: Pick<AppSettings, 'theme' | 'textScale'>): void {
  const el = document.documentElement;
  el.dataset.theme = s.theme;
  el.dataset.text = s.textScale;
}
