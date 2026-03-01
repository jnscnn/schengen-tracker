import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { subDays, startOfDay, format, parseISO } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { Trip } from '../types';
import { getDayStatuses } from '../utils/schengen';
import { SCHENGEN } from '../constants/theme';

interface TimelineProps {
  trips: Trip[];
  referenceDate?: Date;
}

export function Timeline({ trips, referenceDate }: TimelineProps) {
  const today = startOfDay(referenceDate || new Date());
  const windowStart = subDays(today, SCHENGEN.WINDOW_DAYS - 1);

  const dayStatuses = useMemo(
    () => getDayStatuses(trips, windowStart, today),
    [trips, windowStart, today]
  );

  // Group days into months for labeling
  const months: { label: string; startIndex: number }[] = [];
  let lastMonth = '';
  dayStatuses.forEach((day, index) => {
    const month = format(parseISO(day.date), 'MMM yyyy');
    if (month !== lastMonth) {
      months.push({ label: format(parseISO(day.date), 'MMM'), startIndex: index });
      lastMonth = month;
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗓 180-Day Window</Text>
      <Text style={styles.subtitle}>
        {format(windowStart, 'MMM d, yyyy')} — {format(today, 'MMM d, yyyy')}
      </Text>

      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {dayStatuses.map((day, index) => (
            <View
              key={day.date}
              style={[
                styles.dayDot,
                {
                  backgroundColor: day.inSchengen
                    ? COLORS.schengenDay
                    : COLORS.freeDay,
                },
                day.date === format(today, 'yyyy-MM-dd') && styles.todayDot,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.schengenDay }]} />
          <Text style={styles.legendText}>In Schengen</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.freeDay }]} />
          <Text style={styles.legendText}>Outside</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.todayDot, { backgroundColor: COLORS.freeDay }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
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
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  gridContainer: {
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    maxWidth: 360,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  todayDot: {
    borderWidth: 1.5,
    borderColor: COLORS.todayRing,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
});
