import React, { useState , useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, FONT_SIZE, RADIUS , ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/ThemeContext';
import { useAuth } from '../hooks/AuthContext';

export function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter a username and password');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.primaryLight, colors.background, colors.surface]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.emoji}>✈️ 🇪🇺 🌍</Text>
            <Text style={styles.title}>Schengen Tracker</Text>
            <Text style={styles.subtitle}>
              Never worry about overstaying again
            </Text>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Username"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isRegister ? 'Create Account' : 'Log In'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setIsRegister(!isRegister); setError(''); }}
                style={styles.switchButton}
              >
                <Text style={styles.switchText}>
                  {isRegister
                    ? 'Already have an account? Log in'
                    : "Don't have an account? Sign up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
    shadowColor: '#4F6BF0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  emoji: {
    fontSize: 36,
    marginBottom: SPACING.md,
    letterSpacing: 8,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: colors.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  form: {
    width: '100%',
    gap: SPACING.md,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    paddingVertical: 14,
    fontSize: FONT_SIZE.lg,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  switchText: {
    color: colors.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
