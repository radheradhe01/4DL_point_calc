import themes from './themes.generated.json';

export interface Theme {
  headerBg: string;
  headerText: string;
  totalBg: string;
  totalFg: string;
  winsBg: string;
  winsFg: string;
  text: string;
}

export type ThemeId = keyof typeof themes;

/**
 * Get theme with safe fallback to default theme
 */
export function getTheme(templateId: string | undefined): Theme {
  if (!templateId) {
    return (themes['template1'] || getDefaultTheme()) as Theme;
  }
  return (themes[templateId as ThemeId] || themes['template1'] || getDefaultTheme()) as Theme;
}

/**
 * Default theme fallback (used if generated themes are missing)
 */
function getDefaultTheme(): Theme {
  return {
    headerBg: '#FF6B35',
    headerText: '#FFFFFF',
    totalBg: '#FFD700',
    totalFg: '#000000',
    winsBg: '#E63946',
    winsFg: '#FFFFFF',
    text: '#000000',
  };
}

export default themes as Record<string, Theme>;

