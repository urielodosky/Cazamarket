'use client';

import { useTheme } from '@/contexts/ThemeContext';

/**
 * Returns theme-aware colors for inline styles.
 * Use this instead of hardcoding rgba(255,255,255,...) or rgba(0,0,0,...) in JSX.
 */
export function useThemeColors() {
  const { mode } = useTheme();
  const isLight = mode === 'light';

  return {
    isLight,
    // Subtle backgrounds
    bgSubtle: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
    bgSubtle2: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
    bgSubtle3: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
    bgSubtle4: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
    // Borders
    borderSubtle: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
    borderSubtle2: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
    borderSubtle3: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
    // Text
    textWhite: isLight ? '#1a1c18' : '#ffffff',
    textMuted60: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)',
    textMuted40: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)',
    textMuted90: isLight ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)',
    // Surfaces
    surfaceElevated: isLight ? '#ffffff' : 'var(--color-bg-surface-elevated)',
    surfaceBase: isLight ? '#f5f3ee' : 'var(--color-bg-base)',
    // Shadows
    shadowMd: isLight ? '0 4px 12px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.4)',
    shadowLg: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.6)',
    shadowHeavy: isLight ? '0 12px 36px rgba(0,0,0,0.12)' : '0 15px 35px rgba(0,0,0,0.85)',
    // Glass
    glassBg: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(30,30,30,0.7)',
    // Hover backgrounds
    hoverBg: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
    hoverBg2: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
  };
}
