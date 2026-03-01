import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TripsProvider } from '../src/hooks/TripsContext';
import { AuthProvider, useAuth } from '../src/hooks/AuthContext';
import { LoginScreen } from '../src/components/LoginScreen';
import { COLORS, FONT_SIZE } from '../src/constants/theme';

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
          tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textTertiary,
          tabBarLabelStyle: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
          headerRight: () => (
            <Text
              onPress={logout}
              style={{ color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginRight: 16 }}
            >
              Log out
            </Text>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Dashboard', tabBarLabel: 'Home', tabBarIcon: () => <TabBarIcon icon="🏠" /> }}
        />
        <Tabs.Screen
          name="trips"
          options={{ title: 'My Trips', tabBarLabel: 'Trips', tabBarIcon: () => <TabBarIcon icon="✈️" /> }}
        />
        <Tabs.Screen
          name="planner"
          options={{ title: 'Trip Planner', tabBarLabel: 'Plan', tabBarIcon: () => <TabBarIcon icon="📋" /> }}
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

function TabBarIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}

