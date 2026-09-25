import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';
type ResolvedAppearance = Exclude<Appearance, 'system'>;

type AppearanceContextValue = { appearance: Appearance; resolvedAppearance: ResolvedAppearance; setAppearance: (appearance: Appearance) => void };

const AppearanceContext = createContext<AppearanceContextValue | null>(null);
const STORAGE_KEY = 'sigmatactix-appearance';

function getStoredAppearance(): Appearance {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'light';
  } catch { return 'light'; }
}

function getSystemAppearance(): ResolvedAppearance {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>(getStoredAppearance);
  const [systemAppearance, setSystemAppearance] = useState<ResolvedAppearance>(getSystemAppearance);
  const resolvedAppearance = appearance === 'system' ? systemAppearance : appearance;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemAppearance(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => { document.documentElement.dataset.theme = resolvedAppearance; }, [resolvedAppearance]);

  const setAppearance = (nextAppearance: Appearance) => {
    setAppearanceState(nextAppearance);
    try { localStorage.setItem(STORAGE_KEY, nextAppearance); } catch { /* Private browsing can reject persistence. */ }
  };

  const value = useMemo(() => ({ appearance, resolvedAppearance, setAppearance }), [appearance, resolvedAppearance]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used within AppearanceProvider');
  return context;
}
