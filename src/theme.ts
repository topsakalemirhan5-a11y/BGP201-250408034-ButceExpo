import { useColorScheme } from 'react-native';
import { useThemeStore } from './store/useThemeStore';

export const light = {
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  sub: '#64748b',
  muted: '#94a3b8',
  border: '#e2e8f0',
  chip: '#e2e8f0',
  chipActive: '#0f172a',
  chipText: '#334155',
  chipTextActive: '#ffffff',
  primary: '#2563eb',
  danger: '#dc2626',
  hero: '#0f172a',
  overlay: 'rgba(0,0,0,0.4)',
  dangerBg: '#fee2e2',
  dangerText: '#b91c1c',
};

export const dark: typeof light = {
  bg: '#0b1220',
  card: '#162033',
  text: '#f1f5f9',
  sub: '#94a3b8',
  muted: '#64748b',
  border: '#2a3750',
  chip: '#243249',
  chipActive: '#3b82f6',
  chipText: '#cbd5e1',
  chipTextActive: '#ffffff',
  primary: '#3b82f6',
  danger: '#ef4444',
  hero: '#1e293b',
  overlay: 'rgba(0,0,0,0.6)',
  dangerBg: '#451a1a',
  dangerText: '#fca5a5',
};

export type Colors = typeof light;

export function useIsDark() {
  const scheme = useColorScheme();
  const mode = useThemeStore(s => s.mode);
  return mode === 'system' ? scheme === 'dark' : mode === 'dark';
}

export function useColors(): Colors {
  return useIsDark() ? dark : light;
}