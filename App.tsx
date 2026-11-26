import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HealthProvider } from './src/context/HealthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <HealthProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </HealthProvider>
    </SafeAreaProvider>
  );
}
