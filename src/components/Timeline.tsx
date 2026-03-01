import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  subDays,
  startOfDay,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  eachDayOfInterval,
  getDay,
  getDate,
  differenceInDays,
  addMonths,
  isSameDay,
  isBefore,
  isAfter,
} from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { Trip } from '../types';
import { SCHENGEN } from '../constants/theme';

interface TimelineProps {
  trips: Trip[];
  referenceDate?: Date;
}

const CELL_SIZE = 20;
const CELL_GAP = 1;
const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function isoWeekday(date: Date): number {
  const d = getDay(date);
  return d === 0 ? 6 : d - 1;
}

function CompactMonth({
  year,
  month,
  schengenDays,
  windowStart,
  windowEnd,
  today,
}: {
  year: number;
  month: number;
  schengenDays: Set<string>;
  windowStart: Date;
  windowEnd: Date;
  today: Date;
}) {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = isoWeekday(monthStart);
  const todayStr = format(today, 'yyyy-MM-dd');

  // Build week rows for proper grid alignment
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(startOffset).fill(null);

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  return (
    <View style={compactStyles.monthContainer}>
      <Text style={compactStyles.monthTitle}>{format(monthStart, 'MMM yyyy')}</Text>
      {/* Day-of-week headers */}
      <View style={compactStyles.weekRow}>
        {DAY_HEADERS.map((h, i) => (
          <View key={i} style={compactStyles.cellWrapper}>
            <Text style={compactStyles.dayHeader}>{h}</Text>
          </View>
        ))}
      </View>
      {/* Week rows */}
      {weeks.map((week, wi) => (
        <View key={wi} style={compactStyles.weekRow}>
          {week.map((day, di) => {
            if (!day) {
              return <View key={`e-${wi}-${di}`} style={compactStyles.cellWrapper} />;
            }
            const key = format(day, 'yyyy-MM-dd');
            const inSchengen = schengenDays.has(key);
            const isToday = key === todayStr;
            const inWindow =
              (isAfter(day, windowStart) || isSameDay(day, windowStart)) &&
              (isBefore(day, windowEnd) || isSameDay(day, windowEnd));

            return (
              <View key={key} style={compactStyles.cellWrapper}>
                <View
                  style={[
                    compactStyles.dayCell,
                    inWindow && inSchengen && { backgroundColor: COLORS.schengenDay },
                    inWindow && !inSchengen && { backgroundColor: COLORS.surfaceSecondary },
                    !inWindow && { backgroundColor: COLORS.borderLight, opacity: 0.35 },
                    isToday && compactStyles.todayCell,
                  ]}
                >
                  <Text
                    style={[
                      compactStyles.dayNumber,
                      inSchengen && inWindow && { color: COLORS.textInverse },
                      isToday && !inSchengen && { color: COLORS.accent, fontWeight: '700' },
                    ]}
                  >
                    {getDate(day)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function Timeline({ trips, referenceDate }: TimelineProps) {
  const today = startOfDay(referenceDate || new Date());
  const windowStart = subDays(today, SCHENGEN.WINDOW_DAYS - 1);

  const schengenDays = useMemo(() => {
    const days = new Set<string>();
    for (const trip of trips) {
      const tripStart = parseISO(trip.startDate);
      const tripEnd = parseISO(trip.endDate);
      const interval = eachDayOfInterval({ start: tripStart, end: tripEnd });
      for (const d of interval) {
        days.add(format(d, 'yyyy-MM-dd'));
      }
    }
    return days;
  }, [trips]);

  const daysInSchengen = useMemo(() => {
    let count = 0;
    for (const trip of trips) {
      const tripStart = parseISO(trip.startDate);
      const tripEnd = parseISO(trip.endDate);
      const clampedStart = tripStart < windowStart ? windowStart : tripStart;
      const clampedEnd = tripEnd > today ? today : tripEnd;
      if (clampedStart <= clampedEnd) {
        count += differenceInDays(clampedEnd, clampedStart) + 1;
      }
    }
    return count;
  }, [trips, today, windowStart]);

  const months = useMemo(() => {
    const result: { year: number; month: number }[] = [];
    const first = startOfMonth(windowStart);
    const last = startOfMonth(today);
    let current = first;
    while (current <= last) {
      result.push({ year: current.getFullYear(), month: current.getMonth() });
      current = addMonths(current, 1);
    }
    return result;
  }, [windowStart, today]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗓 180-Day Window</Text>
      <Text style={styles.subtitle}>
        {format(windowStart, 'MMM d, yyyy')} — {format(today, 'MMM d, yyyy')} · {daysInSchengen} day{daysInSchengen !== 1 ? 's' : ''} in Schengen
      </Text>

      <View style={styles.monthsGrid}>
        {months.map((m) => (
          <CompactMonth
            key={`${m.year}-${m.month}`}
            year={m.year}
            month={m.month}
            schengenDays={schengenDays}
            windowStart={windowStart}
            windowEnd={today}
            today={today}
          />
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.schengenDay }]} />
          <Text style={styles.legendText}>In Schengen</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.surfaceSecondary }]} />
          <Text style={styles.legendText}>Outside</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.surfaceSecondary, borderWidth: 1.5, borderColor: COLORS.accent }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
}

const MONTH_WIDTH = 7 * CELL_SIZE + 6 * CELL_GAP + 8; // cells + gaps + padding

const compactStyles = StyleSheet.create({
  monthContainer: {
    width: MONTH_WIDTH,
    marginBottom: SPACING.md,
    padding: 4,
  },
  monthTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cellWrapper: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginHorizontal: CELL_GAP / 2,
    marginVertical: CELL_GAP / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    fontSize: 7,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
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
    paddingHorizontal: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    maxWidth: MONTH_WIDTH * 4 + SPACING.md * 3,
    alignSelf: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
});
