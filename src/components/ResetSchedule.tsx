import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { format, parseISO } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { ResetEvent } from '../types';

interface ResetScheduleProps {
  events: ResetEvent[];
  daysRemaining: number;
}

export function ResetSchedule({ events, daysRemaining }: ResetScheduleProps) {
  if (events.length === 0) {
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

  // Consolidate events by grouping them into meaningful chunks
  const consolidatedEvents: ResetEvent[] = [];
  let currentEvent: ResetEvent | null = null;

  for (const event of events) {
    if (
      currentEvent &&
      currentEvent.date === event.date
    ) {
      currentEvent.daysFreed += event.daysFreed;
      currentEvent.cumulativeDaysAvailable = event.cumulativeDaysAvailable;
    } else {
      if (currentEvent) consolidatedEvents.push(currentEvent);
      currentEvent = { ...event };
    }
  }
  if (currentEvent) consolidatedEvents.push(currentEvent);

  // Show up to 10 events
  const displayEvents = consolidatedEvents.slice(0, 10);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Days Reset Schedule</Text>
      <Text style={styles.subtitle}>
        When you'll get days back as old trips fall off the 180-day window
      </Text>

      <View style={styles.eventsList}>
        {displayEvents.map((event, index) => {
          const date = parseISO(event.date);
          return (
            <View key={`${event.date}-${index}`} style={styles.eventRow}>
              <View style={styles.eventDate}>
                <Text style={styles.eventMonth}>
                  {format(date, 'MMM')}
                </Text>
                <Text style={styles.eventDay}>
                  {format(date, 'd')}
                </Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventDaysFreed}>
                  +{event.daysFreed} day{event.daysFreed !== 1 ? 's' : ''} freed
                </Text>
                <Text style={styles.eventCumulative}>
                  → {Math.min(event.cumulativeDaysAvailable, 90)} days available
                </Text>
              </View>
              <View
                style={[
                  styles.eventBadge,
                  {
                    backgroundColor:
                      event.cumulativeDaysAvailable >= 60 ? COLORS.successLight :
                      event.cumulativeDaysAvailable >= 30 ? COLORS.warningLight :
                      COLORS.dangerLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.eventBadgeText,
                    {
                      color:
                        event.cumulativeDaysAvailable >= 60 ? COLORS.success :
                        event.cumulativeDaysAvailable >= 30 ? COLORS.warning :
                        COLORS.danger,
                    },
                  ]}
                >
                  {Math.min(event.cumulativeDaysAvailable, 90)}
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
  eventsList: {
    gap: SPACING.sm,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  eventDate: {
    width: 48,
    alignItems: 'center',
  },
  eventMonth: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  eventDay: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  eventDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  eventDaysFreed: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.success,
  },
  eventCumulative: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  eventBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBadgeText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
