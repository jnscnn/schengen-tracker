import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TripsProvider } from '../src/hooks/TripsContext';
import { COLORS, FONT_SIZE } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <TripsProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: FONT_SIZE.lg,
            color: COLORS.text,
          },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textTertiary,
          tabBarLabelStyle: {
            fontSize: FONT_SIZE.xs,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <TabBarIcon icon="🏠" />
            ),
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: 'My Trips',
            tabBarLabel: 'Trips',
            tabBarIcon: ({ color }) => (
              <TabBarIcon icon="✈️" />
            ),
          }}
        />
        <Tabs.Screen
          name="planner"
          options={{
            title: 'Trip Planner',
            tabBarLabel: 'Plan',
            tabBarIcon: ({ color }) => (
              <TabBarIcon icon="📋" />
            ),
          }}
        />
      </Tabs>
    </TripsProvider>
  );
}

function TabBarIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}

