import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { ResetEvent } from '../types';

interface ResetScheduleProps {
  events: ResetEvent[];
  daysRemaining: number;
}

interface ResetSpan {
  startDate: string;
  endDate: string;
  totalDaysFreed: number;
  cumulativeDaysAvailable: number;
}

/**
 * Group consecutive (or near-consecutive) reset events into spans.
 * e.g. "Apr 5 → Apr 15: +11 days freed"
 */
function groupIntoSpans(events: ResetEvent[]): ResetSpan[] {
  if (events.length === 0) return [];

  const spans: ResetSpan[] = [];
  let currentSpan: ResetSpan = {
    startDate: events[0].date,
    endDate: events[0].date,
    totalDaysFreed: events[0].daysFreed,
    cumulativeDaysAvailable: events[0].cumulativeDaysAvailable,
  };

  for (let i = 1; i < events.length; i++) {
    const prev = parseISO(events[i - 1].date);
    const curr = parseISO(events[i].date);
    const gap = differenceInDays(curr, prev);

    // Group if days are consecutive (gap of 1) or same day
    if (gap <= 1) {
      currentSpan.endDate = events[i].date;
      currentSpan.totalDaysFreed += events[i].daysFreed;
      currentSpan.cumulativeDaysAvailable = events[i].cumulativeDaysAvailable;
    } else {
      spans.push(currentSpan);
      currentSpan = {
        startDate: events[i].date,
        endDate: events[i].date,
        totalDaysFreed: events[i].daysFreed,
        cumulativeDaysAvailable: events[i].cumulativeDaysAvailable,
      };
    }
  }
  spans.push(currentSpan);

  return spans;
}

export function ResetSchedule({ events, daysRemaining }: ResetScheduleProps) {
  const spans = useMemo(() => groupIntoSpans(events), [events]);

  if (spans.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📅 Days Reset Schedule</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No upcoming resets — you have all 90 days available!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Days Reset Schedule</Text>
      <Text style={styles.subtitle}>
        When you'll get days back as old trips fall off the 180-day window
      </Text>

      <View style={styles.spansList}>
        {spans.map((span, index) => {
          const startDate = parseISO(span.startDate);
          const endDate = parseISO(span.endDate);
          const isSingleDay = span.startDate === span.endDate;
          const availCapped = Math.min(span.cumulativeDaysAvailable, 90);

          return (
            <View key={`${span.startDate}-${index}`} style={styles.spanRow}>
              {/* Date range column */}
              <View style={styles.spanDates}>
                <Text style={styles.spanDateText}>
                  {format(startDate, 'MMM d')}
                </Text>
                {!isSingleDay && (
                  <>
                    <Text style={styles.spanDateSeparator}>→</Text>
                    <Text style={styles.spanDateText}>
                      {format(endDate, 'MMM d')}
                    </Text>
                  </>
                )}
              </View>

              {/* Details column */}
              <View style={styles.spanDetails}>
                <Text style={styles.spanFreed}>
                  +{span.totalDaysFreed} day{span.totalDaysFreed !== 1 ? 's' : ''} freed
                </Text>
                <Text style={styles.spanCumulative}>
                  → {availCapped} day{availCapped !== 1 ? 's' : ''} available after
                </Text>
              </View>

              {/* Badge */}
              <View
                style={[
                  styles.spanBadge,
                  {
                    backgroundColor:
                      availCapped >= 60 ? COLORS.successLight :
                      availCapped >= 30 ? COLORS.warningLight :
                      COLORS.dangerLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.spanBadgeText,
                    {
                      color:
                        availCapped >= 60 ? COLORS.success :
                        availCapped >= 30 ? COLORS.warning :
                        COLORS.danger,
                    },
                  ]}
                >
                  {availCapped}
                </Text>
              </View>
            </View>
          );
        })}
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
  emptyState: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  spansList: {
    gap: SPACING.xs,
  },
  spanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  spanDates: {
    width: 110,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  spanDateText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  spanDateSeparator: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
  },
  spanDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  spanFreed: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.success,
  },
  spanCumulative: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  spanBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  spanBadgeText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
