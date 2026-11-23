import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { useBudgetStore } from './src/store/useBudgetStore';

export default function App() {
  useEffect(() => {
    const run = () => useBudgetStore.getState().processRecurring();
    if (useBudgetStore.persist.hasHydrated()) run();
    const unsub = useBudgetStore.persist.onFinishHydration(run);
    return unsub;
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}