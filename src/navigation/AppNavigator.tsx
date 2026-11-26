import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { HealthRecord } from '../models/HealthRecord';
import { AddEditRecordScreen } from '../screens/AddEditRecordScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { RecordListScreen } from '../screens/RecordListScreen';
import { COLORS } from '../utils/constants';

export type MainTabParamList = {
  Dashboard: undefined;
  Records: undefined;
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
          return (
            <MaterialCommunityIcons
              name={focused ? 'clipboard-text' : 'clipboard-text-outline'}
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
        options={{ title: 'Health History' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
};
