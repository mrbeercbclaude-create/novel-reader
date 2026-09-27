import { createContext, useContext } from 'react';
import type { AppState } from '../lib/useAppState';

export const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const state = useContext(AppContext);
  if (!state) throw new Error('AppContext is missing');
  return state;
}
