import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { SchengenStatus } from '../types';

interface DaysCounterProps {
  status: SchengenStatus;
}

export function DaysCounter({ status }: DaysCounterProps) {
  const { daysRemaining, daysUsed, maxDays, isOverstay, currentTrip } = status;

  const percentage = daysUsed / maxDays;
  const statusColor =
    isOverstay ? COLORS.danger :
    daysRemaining <= 7 ? COLORS.danger :
    daysRemaining <= 20 ? COLORS.warning :
    COLORS.success;

  const statusLabel =
    isOverstay ? '⚠️ OVERSTAY' :
    currentTrip ? '📍 In Schengen' :
    '🏠 Outside Schengen';

  return (
    <View style={styles.container}>
      <Text style={styles.statusLabel}>{statusLabel}</Text>
      <View style={styles.counterContainer}>
        <Text style={[styles.counter, { color: statusColor }]}>
          {daysRemaining}
        </Text>
        <Text style={styles.counterLabel}>days remaining</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(percentage * 100, 100)}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            {daysUsed} used
          </Text>
          <Text style={styles.progressText}>
            {maxDays} max
          </Text>
        </View>
      </View>

      {isOverstay && (
        <View style={[styles.alertBanner, { backgroundColor: COLORS.dangerLight }]}>
          <Text style={[styles.alertText, { color: COLORS.danger }]}>
            ⚠️ Over the 90-day limit by {daysUsed - maxDays} day(s)!
          </Text>
        </View>
      )}

      {!isOverstay && daysRemaining <= 14 && daysRemaining > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: COLORS.warningLight }]}>
          <Text style={[styles.alertText, { color: COLORS.warning }]}>
            ⏰ Only {daysRemaining} days left in the current window
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statusLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  counterContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  counter: {
    fontSize: FONT_SIZE.hero,
    fontWeight: '800',
    lineHeight: FONT_SIZE.hero * 1.1,
  },
  counterLabel: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  progressBarContainer: {
    marginTop: SPACING.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
  },
  alertBanner: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  alertText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
