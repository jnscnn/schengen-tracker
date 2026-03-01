import React, { useEffect , useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { format, startOfDay, addDays } from 'date-fns';
import { SPACING, FONT_SIZE, RADIUS , ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/ThemeContext';
import { SchengenStatus } from '../types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DaysCounterProps {
  status: SchengenStatus;
}

const SAFETY_BUFFER = 3;

function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  bgColor,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  bgColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(Math.max(progress, 0), 1), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={bgColor} strokeWidth={strokeWidth} fill="none" />
      <AnimatedCircle
        cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth}
        fill="none" strokeDasharray={`${circumference}`} strokeLinecap="round"
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

export function DaysCounter({ status }: DaysCounterProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { daysRemaining, daysUsed, maxDays, isOverstay, currentTrip } = status;
  const today = startOfDay(new Date());

  const remainingFraction = daysRemaining / maxDays;
  const statusColor =
    isOverstay ? colors.danger :
    daysRemaining <= 7 ? colors.danger :
    daysRemaining <= 20 ? colors.warning :
    colors.success;

  const statusLabel =
    isOverstay ? '⚠️ OVERSTAY' :
    currentTrip ? '📍 In Schengen' :
    '🏠 Outside Schengen';

  // Calculate must-leave date for current trip
  const mustLeaveDate = currentTrip && !isOverstay && daysRemaining > 0
    ? addDays(today, daysRemaining - 1)
    : null;
  const safeLeaveDate = mustLeaveDate && daysRemaining > SAFETY_BUFFER
    ? addDays(today, daysRemaining - 1 - SAFETY_BUFFER)
    : null;

  const ringSize = 160;
  const ringStroke = 12;

  return (
    <View style={styles.container}>
      <Text style={styles.statusLabel}>{statusLabel}</Text>

      <View style={styles.ringContainer}>
        <ProgressRing
          size={ringSize} strokeWidth={ringStroke}
          progress={remainingFraction} color={statusColor} bgColor={colors.surfaceSecondary}
        />
        <View style={styles.ringContent}>
          <Text style={[styles.counter, { color: statusColor }]}>{daysRemaining}</Text>
          <Text style={styles.counterLabel}>of {maxDays} days left</Text>
        </View>
      </View>

      <View style={styles.breakdownRow}>
        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownDot, { backgroundColor: statusColor }]} />
          <Text style={styles.breakdownValue}>{daysUsed}</Text>
          <Text style={styles.breakdownLabel}>used</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownDot, { backgroundColor: colors.surfaceSecondary }]} />
          <Text style={styles.breakdownValue}>{daysRemaining}</Text>
          <Text style={styles.breakdownLabel}>remaining</Text>
        </View>
      </View>

      {/* Current trip: must-leave and safe-leave dates */}
      {currentTrip && !isOverstay && mustLeaveDate && (
        <View style={styles.leaveInfo}>
          <View style={styles.leaveRow}>
            <Text style={styles.leaveIcon}>🚨</Text>
            <View style={styles.leaveDetail}>
              <Text style={styles.leaveLabel}>Must leave by</Text>
              <Text style={[styles.leaveDate, { color: colors.danger }]}>
                {format(mustLeaveDate, 'MMM d, yyyy')}
              </Text>
            </View>
          </View>
          {safeLeaveDate && (
            <View style={styles.leaveRow}>
              <Text style={styles.leaveIcon}>✅</Text>
              <View style={styles.leaveDetail}>
                <Text style={styles.leaveLabel}>Safe to leave by ({SAFETY_BUFFER}-day buffer)</Text>
                <Text style={[styles.leaveDate, { color: colors.success }]}>
                  {format(safeLeaveDate, 'MMM d, yyyy')}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {isOverstay && (
        <View style={[styles.alertBanner, { backgroundColor: colors.dangerLight }]}>
          <Text style={[styles.alertText, { color: colors.danger }]}>
            ⚠️ Over the 90-day limit by {daysUsed - maxDays} day(s)!{'\n'}
            If still in Schengen, exit immediately.
          </Text>
        </View>
      )}

      {!isOverstay && daysRemaining <= 14 && daysRemaining > 0 && !currentTrip && (
        <View style={[styles.alertBanner, { backgroundColor: colors.warningLight }]}>
          <Text style={[styles.alertText, { color: colors.warning }]}>
            ⏰ Only {daysRemaining} days left — plan trips carefully
          </Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
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
    color: colors.textSecondary,
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
    color: colors.text,
  },
  breakdownLabel: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
  },
  breakdownDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  leaveInfo: {
    marginTop: SPACING.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  leaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  leaveIcon: {
    fontSize: 18,
  },
  leaveDetail: {
    flex: 1,
  },
  leaveLabel: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
  },
  leaveDate: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
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
    textAlign: 'center',
    lineHeight: 20,
  },
});
