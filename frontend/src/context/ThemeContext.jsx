import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'tracky.theme';
const ThemeContext = createContext(null);

function getSavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  return ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
}

function resolveTheme(preference) {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getSavedTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(getSavedTheme()));

  const applyTheme = useCallback((preference) => {
    const resolved = resolveTheme(preference);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    setResolvedTheme(resolved);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);

    if (theme !== 'system') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, [theme, applyTheme]);

  const setTheme = useCallback((nextTheme) => {
    if (['light', 'dark', 'system'].includes(nextTheme)) {
      setThemeState(nextTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const resolved = resolveTheme(current);
      return resolved === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider.');
  }
  return context;
}
