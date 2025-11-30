import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'high-contrast';

const THEME_STORAGE_KEY = 'ibpd_theme';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'high-contrast') {
      return savedTheme;
    }
    
    // Check for high contrast preference
    if (window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches) {
      return 'high-contrast';
    }
    
    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'high-contrast';
      return 'light';
    });
  };

  const setThemeDirectly = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return { theme, toggleTheme, setTheme: setThemeDirectly };
};

