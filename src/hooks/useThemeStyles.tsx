'use client';

import { useTheme } from '@/context/ThemeContext';
import { ReactNode } from 'react';

export function useThemeStyles() {
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';
  
  return {
    theme,
    isDark,
    bgPrimary: isDark ? 'bg-[#0f172a]' : 'bg-white',
    bgSecondary: isDark ? 'bg-[#1e293b]' : 'bg-[#f8fafc]',
    bgTertiary: isDark ? 'bg-[#334155]' : 'bg-[#f1f5f9]',
    bgCard: isDark ? 'bg-[#1e293b]' : 'bg-white',
    bgInput: isDark ? 'bg-[#0f172a]' : 'bg-white',
    textPrimary: isDark ? 'text-white' : 'text-[#0f172a]',
    textSecondary: isDark ? 'text-[#94a3b8]' : 'text-[#64748b]',
    textTertiary: isDark ? 'text-[#64748b]' : 'text-[#94a3b8]',
    border: isDark ? 'border-[#1e293b]' : 'border-[#e2e8f0]',
    borderLight: isDark ? 'border-[#334155]' : 'border-[#cbd5e1]',
    hoverBg: isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]',
    cardStyle: isDark ? 'bg-[#1e293b]/50 border-[#1e293b]' : 'bg-white border-[#e2e8f0]',
  };
}

export function ThemedDiv({ 
  children, 
  className = '',
  variant = 'primary' 
}: { 
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'card';
}) {
  const { isDark } = useThemeStyles();
  
  const variants = {
    primary: isDark ? 'bg-[#0f172a]' : 'bg-white',
    secondary: isDark ? 'bg-[#1e293b]' : 'bg-[#f8fafc]',
    card: isDark ? 'bg-[#1e293b]/50 border border-[#1e293b]' : 'bg-white border border-[#e2e8f0]',
  };
  
  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
