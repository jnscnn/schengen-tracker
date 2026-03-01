import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { SchengenStatus } from '../types';

interface DaysCounterProps {
  status: SchengenStatus;
}

function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  bgColor,
}: {
  size: number;
  strokeWidth: number;
  progress: number; // 0-1
  color: string;
  bgColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={bgColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function DaysCounter({ status }: DaysCounterProps) {
  const { daysRemaining, daysUsed, maxDays, isOverstay, currentTrip } = status;

  const remainingFraction = daysRemaining / maxDays; // how much is LEFT (for the ring)
  const statusColor =
    isOverstay ? COLORS.danger :
    daysRemaining <= 7 ? COLORS.danger :
    daysRemaining <= 20 ? COLORS.warning :
    COLORS.success;

  const statusLabel =
    isOverstay ? '⚠️ OVERSTAY' :
    currentTrip ? '📍 In Schengen' :
    '🏠 Outside Schengen';

  const ringSize = 160;
  const ringStroke = 12;

  return (
    <View style={styles.container}>
      <Text style={styles.statusLabel}>{statusLabel}</Text>

      {/* Ring + counter */}
      <View style={styles.ringContainer}>
        <ProgressRing
          size={ringSize}
          strokeWidth={ringStroke}
          progress={remainingFraction}
          color={statusColor}
          bgColor={COLORS.surfaceSecondary}
        />
        <View style={styles.ringContent}>
          <Text style={[styles.counter, { color: statusColor }]}>
            {daysRemaining}
          </Text>
          <Text style={styles.counterLabel}>of {maxDays} days left</Text>
        </View>
      </View>

      {/* Used / remaining breakdown */}
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownDot, { backgroundColor: statusColor }]} />
          <Text style={styles.breakdownValue}>{daysUsed}</Text>
          <Text style={styles.breakdownLabel}>used</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownDot, { backgroundColor: COLORS.surfaceSecondary }]} />
          <Text style={styles.breakdownValue}>{daysRemaining}</Text>
          <Text style={styles.breakdownLabel}>remaining</Text>
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
    marginBottom: SPACING.sm,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 160,
    height: 160,
  },
  ringContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 48,
  },
  counterLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  breakdownLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  breakdownDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
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
