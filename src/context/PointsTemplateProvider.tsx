'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { getPointsTemplate, PointsTemplateMeta } from '@/lib/pointsTemplates';

interface PointsTemplateContextType {
  template: PointsTemplateMeta;
}

const PointsTemplateContext = createContext<PointsTemplateContextType>({
  template: getPointsTemplate('wildwest_v1'),
});

export const usePointsTemplate = () => useContext(PointsTemplateContext);

interface PointsTemplateProviderProps {
  templateId?: string | null;
  children?: React.ReactNode;
}

/**
 * Safe CSS variable setter with fallback
 */
const safeSetProperty = (root: HTMLElement, property: string, value: string | undefined, fallback: string) => {
  root.style.setProperty(property, value || fallback);
};

export function PointsTemplateProvider({ templateId, children }: PointsTemplateProviderProps) {
  const template = getPointsTemplate(templateId);

  useEffect(() => {
    // Set CSS custom properties for dynamic theming with safe fallbacks
    const root = document.documentElement;
    
    // Use safe setters with fallback colors to prevent empty CSS variables
    safeSetProperty(root, '--pts-header-bg', template.themeDefaults.headerBg, '#be0d05');
    safeSetProperty(root, '--pts-cell-bg', template.themeDefaults.cellBg, '#7f0000');
    safeSetProperty(root, '--pts-cell-border', template.themeDefaults.cellBorder, '#bfa137');
    safeSetProperty(root, '--pts-accent-gold', template.themeDefaults.accentGold, '#FFD700');
    safeSetProperty(root, '--pts-text-white', template.themeDefaults.textWhite, '#FFFFFF');
    safeSetProperty(root, '--pts-text-black', template.themeDefaults.textBlack, '#000000');

    // Cleanup on unmount
    return () => {
      root.style.removeProperty('--pts-header-bg');
      root.style.removeProperty('--pts-cell-bg');
      root.style.removeProperty('--pts-cell-border');
      root.style.removeProperty('--pts-accent-gold');
      root.style.removeProperty('--pts-text-white');
      root.style.removeProperty('--pts-text-black');
    };
  }, [template]);

  return (
    <PointsTemplateContext.Provider value={{ template }}>
      {children}
    </PointsTemplateContext.Provider>
  );
}

