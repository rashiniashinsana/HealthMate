import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
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
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: COLORS.textPrimary,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: Theme.colors.water.primary,
        tabBarInactiveTintColor: Theme.colors.neutral.textSecondary,
        tabBarActiveBackgroundColor: COLORS.primaryLight,
        tabBarItemStyle: {
          borderRadius: RADII.md,
          marginHorizontal: 6,
          marginVertical: 4,
        },
        // Account for iOS home indicator / Android gesture bar height.
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 62 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'HealthMate',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name={
                focused ? Theme.icons.dashboardActive : Theme.icons.dashboard
              }
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Records"
        component={RecordListScreen}
        options={{
          title: 'Records',
          tabBarLabel: 'Records',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name={focused ? Theme.icons.recordsActive : Theme.icons.records}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AddRecord"
        component={AddEditRecordScreen}
        options={{
          title: 'Add Log',
          tabBarLabel: 'Add Log',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name={focused ? Theme.icons.add : 'plus-circle-outline'}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
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
