'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'dark' | 'light';

type ThemeContextType = {
  mode: ThemeMode;
  toggleMode: () => void;
  isMounted: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleMode: () => {},
  isMounted: false,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cazamarket_theme_mode');
    if (stored === 'light' || stored === 'dark') {
      setMode(stored);
      document.documentElement.setAttribute('data-theme', stored);
    }
    setIsMounted(true);
  }, []);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('cazamarket_theme_mode', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
