import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HealthProvider } from './src/context/HealthContext';
import { useHealth } from './src/hooks/useHealth';
import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS, RADII, SPACING } from './src/utils/constants';

const AppContent: React.FC = () => {
  const { isInitialized } = useHealth();

  if (!isInitialized) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashIcon}>
          <MaterialCommunityIcons
            name="heart-pulse"
            size={42}
            color={COLORS.textOnPrimary}
          />
        </View>
        <Text style={styles.splashTitle}>HealthMate</Text>
        <Text style={styles.splashSubtitle}>Preparing your wellness data…</Text>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.spinner}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <HealthProvider>
        <StatusBar style="dark" />
        <AppContent />
      </HealthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  splashIcon: {
    width: 80,
    height: 80,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  splashSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  spinner: {
    marginTop: SPACING.xl,
  },
});
