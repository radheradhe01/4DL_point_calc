'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { getTheme, Theme } from '@/lib/themes';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: getTheme('template1'),
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  templateId?: string;
  children?: React.ReactNode;
}

/**
 * Safe CSS variable setter with fallback
 */
const safeSetProperty = (root: HTMLElement, property: string, value: string | undefined, fallback: string) => {
  root.style.setProperty(property, value || fallback);
};

export function ThemeProvider({ templateId, children }: ThemeProviderProps) {
  const theme = getTheme(templateId);

  useEffect(() => {
    // Set CSS custom properties for dynamic theming with safe fallbacks
    const root = document.documentElement;
    
    // Use safe setters with fallback colors to prevent empty CSS variables
    safeSetProperty(root, '--tbl-header-bg', theme.headerBg, '#FF6B35');
    safeSetProperty(root, '--tbl-header-fg', theme.headerText, '#FFFFFF');
    safeSetProperty(root, '--tbl-total-bg', theme.totalBg, '#FFD700');
    safeSetProperty(root, '--tbl-total-fg', theme.totalFg, '#000000');
    safeSetProperty(root, '--tbl-wins-bg', theme.winsBg, '#E63946');
    safeSetProperty(root, '--tbl-wins-fg', theme.winsFg, '#FFFFFF');
    safeSetProperty(root, '--tbl-text', theme.text, '#000000');

    // Cleanup on unmount
    return () => {
      root.style.removeProperty('--tbl-header-bg');
      root.style.removeProperty('--tbl-header-fg');
      root.style.removeProperty('--tbl-total-bg');
      root.style.removeProperty('--tbl-total-fg');
      root.style.removeProperty('--tbl-wins-bg');
      root.style.removeProperty('--tbl-wins-fg');
      root.style.removeProperty('--tbl-text');
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

