import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { subDays, startOfDay, format, parseISO, eachDayOfInterval, differenceInDays } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { Trip } from '../types';
import { SCHENGEN } from '../constants/theme';

interface TimelineProps {
  trips: Trip[];
  referenceDate?: Date;
}

export function Timeline({ trips, referenceDate }: TimelineProps) {
  const today = startOfDay(referenceDate || new Date());
  const windowStart = subDays(today, SCHENGEN.WINDOW_DAYS - 1);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const todayStr = format(today, 'yyyy-MM-dd');

    for (const trip of trips) {
      const tripStart = parseISO(trip.startDate);
      const tripEnd = parseISO(trip.endDate);

      // Only mark days within the 180-day window
      const clampedStart = tripStart < windowStart ? windowStart : tripStart;
      const clampedEnd = tripEnd > today ? today : tripEnd;

      if (clampedStart > clampedEnd) continue;

      const days = eachDayOfInterval({ start: clampedStart, end: clampedEnd });
      days.forEach((d, i) => {
        const key = format(d, 'yyyy-MM-dd');
        marks[key] = {
          color: COLORS.schengenDay,
          textColor: COLORS.textInverse,
          startingDay: i === 0,
          endingDay: i === days.length - 1,
        };
      });
    }

    // Mark today with a special indicator
    if (marks[todayStr]) {
      marks[todayStr] = { ...marks[todayStr], todayTextColor: COLORS.accent };
    } else {
      marks[todayStr] = {
        color: COLORS.surfaceSecondary,
        textColor: COLORS.accent,
        startingDay: true,
        endingDay: true,
      };
    }

    return marks;
  }, [trips, today, windowStart]);

  // Count days in Schengen
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗓 180-Day Window</Text>
      <Text style={styles.subtitle}>
        {format(windowStart, 'MMM d, yyyy')} — {format(today, 'MMM d, yyyy')} · {daysInSchengen} day{daysInSchengen !== 1 ? 's' : ''} in Schengen
      </Text>

      <Calendar
        markingType="period"
        markedDates={markedDates}
        minDate={format(windowStart, 'yyyy-MM-dd')}
        maxDate={format(today, 'yyyy-MM-dd')}
        initialDate={format(today, 'yyyy-MM-dd')}
        hideExtraDays
        theme={{
          backgroundColor: COLORS.surface,
          calendarBackground: COLORS.surface,
          textSectionTitleColor: COLORS.textSecondary,
          todayTextColor: COLORS.accent,
          dayTextColor: COLORS.text,
          textDisabledColor: COLORS.textTertiary,
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.text,
          textMonthFontWeight: '700',
          textDayFontSize: 14,
          textMonthFontSize: 15,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.schengenDay }]} />
          <Text style={styles.legendText}>In Schengen</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.surfaceSecondary }]} />
          <Text style={styles.legendText}>Outside</Text>
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
    marginBottom: SPACING.sm,
  },
  calendar: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
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
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
});
