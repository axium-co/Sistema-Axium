import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'gold' | 'black';

interface ThemeContextType {
  theme: ThemeMode;
  accentColor: AccentColor;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_COLORS: Record<AccentColor, string> = {
  blue: '#3b82f6',
  purple: '#a855f7',
  green: '#22c55e',
  gold: '#eab308',
  black: '#0a0a0a',
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('axium_theme_mode') as ThemeMode) || 'light';
  });
  
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    return (localStorage.getItem('axium_accent_color') as AccentColor) || 'black';
  });

  useEffect(() => {
    localStorage.setItem('axium_theme_mode', theme);
    localStorage.setItem('axium_accent_color', accentColor);

    const root = window.document.documentElement;
    
    // Handle Theme Mode
    const effectiveTheme = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--bg-main', '#0a0a0a');
      root.style.setProperty('--bg-card', '#171717');
      root.style.setProperty('--text-main', '#ffffff');
      root.style.setProperty('--text-muted', '#a3a3a3');
      root.style.setProperty('--border-main', '#262626');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--bg-main', '#f5f5f5');
      root.style.setProperty('--bg-card', '#ffffff');
      root.style.setProperty('--text-main', '#0a0a0a');
      root.style.setProperty('--text-muted', '#737373');
      root.style.setProperty('--border-main', '#e5e5e5');
    }

    // Handle Accent Color
    root.style.setProperty('--primary', ACCENT_COLORS[accentColor]);
    
  }, [theme, accentColor]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Force re-render by updating state
      setTheme('system');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
