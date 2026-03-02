import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripsProvider } from '../src/hooks/TripsContext';
import { AuthProvider, useAuth } from '../src/hooks/AuthContext';
import { ThemeProvider, useTheme } from '../src/hooks/ThemeContext';
import { LoginScreen } from '../src/components/LoginScreen';
import { SettingsMenu } from '../src/components/SettingsMenu';
import { FONT_SIZE } from '../src/constants/theme';

function AppContent() {
  const { user, loading } = useAuth();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontWeight: '700', fontSize: FONT_SIZE.lg, color: colors.text },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingTop: 4,
            // Extra padding for home indicator bar
            paddingBottom: Math.max(insets.bottom, 8),
            height: 56 + Math.max(insets.bottom, 8),
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
            headerRight: () => <SettingsMenu />,
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: 'My Trips',
            tabBarLabel: 'Trips',
            tabBarIcon: ({ color }) => <Ionicons name="airplane" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="planner"
          options={{
            title: 'Trip Planner',
            tabBarLabel: 'Plan',
            tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} />,
          }}
        />
      </Tabs>
    </TripsProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStatusBar />
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

