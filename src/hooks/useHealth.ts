import { useContext } from 'react';
import { HealthContext, HealthContextValue } from '../context/HealthContext';

export function useHealth(): HealthContextValue {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error(
      'useHealth must be used within a HealthProvider. Wrap your root navigator in <HealthProvider>.'
    );
  }
  return context;
}
