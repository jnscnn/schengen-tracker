import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TripsProvider } from '../src/hooks/TripsContext';
import { AuthProvider, useAuth } from '../src/hooks/AuthContext';
import { LoginScreen } from '../src/components/LoginScreen';
import { COLORS, FONT_SIZE, SPACING } from '../src/constants/theme';

function AppContent() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <TripsProvider>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.background },
          headerTitleStyle: { fontWeight: '700', fontSize: FONT_SIZE.lg, color: COLORS.text },
          headerShadowVisible: false,
          tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, paddingTop: 4 },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textTertiary,
          tabBarLabelStyle: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: 'My Trips',
            tabBarLabel: 'Trips',
            tabBarIcon: ({ color, size }) => <Ionicons name="airplane" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="planner"
          options={{
            title: 'Trip Planner',
            tabBarLabel: 'Plan',
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={22} color={color} />,
          }}
        />
      </Tabs>
    </TripsProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppContent />
    </AuthProvider>
  );
}

