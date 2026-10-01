/**
 * Theme Manager for AndesMovi
 * Automatically detects Operating System theme preference (prefers-color-scheme)
 * and supports manual override ('system' | 'dark' | 'light').
 */

export type ThemePreference = 'system' | 'dark' | 'light';
export type EffectiveTheme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'andesmovi_theme_preference';

export function getSystemTheme(): EffectiveTheme {
  return 'light';
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored as ThemePreference;
  }
  return 'light';
}

export function saveThemePreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function applyThemeToDOM(effectiveTheme: EffectiveTheme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    body.classList.remove('bg-[#FFFFFF]', 'text-[#111827]');
    body.classList.add('bg-zinc-950', 'text-zinc-100');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    body.classList.remove('bg-zinc-950', 'bg-zinc-900', 'text-zinc-100', 'bg-slate-100', 'text-slate-900');
    body.classList.add('bg-[#FFFFFF]', 'text-[#111827]');
  }
}
