import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/ThemeContext';
import { useAuth } from '../hooks/AuthContext';
import { ThemeColors, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';

export function SettingsMenu() {
  const { colors, scheme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <>
      <TouchableOpacity
        style={styles.gear}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            {/* User info */}
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{user}</Text>
                <Text style={styles.userSubtitle}>Schengen Tracker</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Appearance */}
            <TouchableOpacity
              style={styles.row}
              onPress={toggle}
              activeOpacity={0.6}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, {
                  backgroundColor: scheme === 'dark' ? '#312E81' : '#EEF2FF'
                }]}>
                  <Ionicons
                    name={scheme === 'dark' ? 'moon' : 'sunny'}
                    size={15}
                    color={scheme === 'dark' ? '#A5B4FC' : '#6366F1'}
                  />
                </View>
                <Text style={styles.rowLabel}>
                  {scheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <View style={[styles.track, scheme === 'dark' && styles.trackOn]}>
                <View style={[styles.thumb, scheme === 'dark' && styles.thumbOn]} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Logout */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => { setOpen(false); logout(); }}
              activeOpacity={0.6}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="log-out-outline" size={15} color={colors.danger} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.danger }]}>Log Out</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  gear: {
    marginRight: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    paddingVertical: SPACING.xs,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  userName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: colors.text,
  },
  userSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: colors.text,
  },
  track: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackOn: {
    backgroundColor: colors.primary,
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
});
