import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddEditRecordScreen } from '../screens/AddEditRecordScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { RecordListScreen } from '../screens/RecordListScreen';
import { HealthRecord } from '../types/health';
import { COLORS, RADII } from '../utils/constants';

export type MainTabParamList = {
  Dashboard: undefined;
  Records: undefined;
  AddRecord: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AddEditRecord: { record?: HealthRecord } | undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(8, insets.bottom);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: COLORS.textPrimary,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        // Account for iOS home indicator / Android gesture bar height.
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 58 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap =
            'view-dashboard-outline';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Records') {
            iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
          } else {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          }

          return (
            <View
              style={[
                styles.iconPill,
                focused && styles.iconPillActive,
              ]}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={size - 1}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'HealthMate' }}
      />
      <Tab.Screen
        name="Records"
        component={RecordListScreen}
        options={{ title: 'Records' }}
      />
      <Tab.Screen
        name="AddRecord"
        component={AddEditRecordScreen}
        options={{ title: 'Add Log' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontWeight: '700',
          color: COLORS.textPrimary,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddEditRecord"
        component={AddEditRecordScreen}
        options={({ route }) => ({
          presentation: 'modal',
          title: route.params?.record
            ? 'Edit Health Record'
            : 'Log Health Record',
        })}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  iconPill: {
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: RADII.xl,
  },
  iconPillActive: {
    backgroundColor: COLORS.primaryLight,
  },
});
