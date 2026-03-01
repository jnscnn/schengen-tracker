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

const DAY_SIZE = 14;
const DAY_GAP = 2;
const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Returns 0=Mon, 1=Tue, ..., 6=Sun (ISO weekday)
function isoWeekday(date: Date): number {
  const d = getDay(date); // 0=Sun, 1=Mon, ...
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
  month: number; // 0-indexed
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

  return (
    <View style={compactStyles.monthContainer}>
      <Text style={compactStyles.monthTitle}>{format(monthStart, 'MMM yyyy')}</Text>
      {/* Day-of-week headers */}
      <View style={compactStyles.weekRow}>
        {DAY_HEADERS.map((h, i) => (
          <Text key={i} style={compactStyles.dayHeader}>{h}</Text>
        ))}
      </View>
      {/* Day grid */}
      <View style={compactStyles.dayGrid}>
        {/* Empty cells for offset */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <View key={`empty-${i}`} style={compactStyles.dayCell} />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const inSchengen = schengenDays.has(key);
          const isToday = key === todayStr;
          const inWindow =
            (isAfter(day, windowStart) || isSameDay(day, windowStart)) &&
            (isBefore(day, windowEnd) || isSameDay(day, windowEnd));

          return (
            <View
              key={key}
              style={[
                compactStyles.dayCell,
                inWindow && inSchengen && { backgroundColor: COLORS.schengenDay },
                inWindow && !inSchengen && { backgroundColor: COLORS.surfaceSecondary },
                !inWindow && { backgroundColor: COLORS.borderLight, opacity: 0.4 },
                isToday && compactStyles.todayCell,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

export function Timeline({ trips, referenceDate }: TimelineProps) {
  const today = startOfDay(referenceDate || new Date());
  const windowStart = subDays(today, SCHENGEN.WINDOW_DAYS - 1);

  // Build a set of all Schengen days for fast lookup
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

  // Count days in Schengen within window
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

  // Generate the months to display (covering the 180-day window)
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

const compactStyles = StyleSheet.create({
  monthContainer: {
    width: '48%',
    marginBottom: SPACING.sm,
  },
  monthTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    gap: DAY_GAP,
    marginBottom: 2,
    justifyContent: 'center',
  },
  dayHeader: {
    width: DAY_SIZE,
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DAY_GAP,
    justifyContent: 'center',
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: 3,
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
    justifyContent: 'space-between',
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
    borderRadius: 3,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
});
