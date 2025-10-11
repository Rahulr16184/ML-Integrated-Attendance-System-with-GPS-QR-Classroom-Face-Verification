"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

function CustomThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { theme: mode } = useTheme(); // 'light' or 'dark'
  const [activeTheme, setActiveTheme] = React.useState('theme-blue');
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem('app-theme') || 'theme-blue';
    setActiveTheme(storedTheme);

    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('app-theme') || 'theme-blue';
      setActiveTheme(newTheme);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  React.useEffect(() => {
    const body = document.body;
    body.classList.remove('theme-blue', 'theme-green');
    body.classList.add(activeTheme);
  }, [activeTheme]);
  
  if (!isMounted) {
    return null; // Avoids hydration mismatch
  }

  return <>{children}</>
}


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <CustomThemeProvider {...props}>
        {children}
      </CustomThemeProvider>
    </NextThemesProvider>
  )
}
