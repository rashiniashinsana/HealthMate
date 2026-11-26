import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AddEditRecordScreen } from '../screens/AddEditRecordScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { RecordListScreen } from '../screens/RecordListScreen';
import { HealthRecord } from '../types/health';
import { COLORS } from '../utils/constants';

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
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Dashboard') {
            return (
              <MaterialCommunityIcons
                name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
                size={size}
                color={color}
              />
            );
          }
          if (route.name === 'Records') {
            return (
              <MaterialCommunityIcons
                name={focused ? 'clipboard-text' : 'clipboard-text-outline'}
                size={size}
                color={color}
              />
            );
          }
          return (
            <MaterialCommunityIcons
              name={focused ? 'plus-circle' : 'plus-circle-outline'}
              size={size}
              color={color}
            />
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

/**
 * Root stack hosts the 3-tab shell and presents AddEditRecord modally for edits and FAB actions.
 */
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
