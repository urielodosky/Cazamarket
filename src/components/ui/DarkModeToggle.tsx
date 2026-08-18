'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function DarkModeToggle() {
  const { mode, toggleMode, isMounted } = useTheme();

  if (!isMounted) return <div style={{ width: 36, height: 36 }} />;

  return (
    <button
      onClick={toggleMode}
      title={mode === 'dark' ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--color-text-main)',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'background 0.2s ease',
      }}
      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {mode === 'dark' ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      )}
    </button>
  );
}
