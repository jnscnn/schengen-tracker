import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { DaysCounter } from '../src/components/DaysCounter';
import { Timeline } from '../src/components/Timeline';
import { ResetSchedule } from '../src/components/ResetSchedule';
import { useTripsContext } from '../src/hooks/TripsContext';
import { getSchengenStatus, getResetSchedule, findNextEntryDate } from '../src/utils/schengen';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/constants/theme';
import { format, parseISO } from 'date-fns';

export default function DashboardScreen() {
  const { trips, loading, refresh } = useTripsContext();

  const status = useMemo(() => getSchengenStatus(trips), [trips]);
  const resetEvents = useMemo(() => getResetSchedule(trips), [trips]);

  const nextFullReset = useMemo(() => {
    // Find when all 90 days are available
    const event = resetEvents.find((e) => e.cumulativeDaysAvailable >= 90);
    return event?.date || null;
  }, [resetEvents]);

  const next30DayEntry = useMemo(() => {
    if (status.daysRemaining >= 30) return null;
    return findNextEntryDate(trips, 30);
  }, [trips, status.daysRemaining]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      <View style={styles.headerContainer}>
        <Text style={styles.appTitle}>🇪🇺 Schengen Tracker</Text>
        <Text style={styles.appSubtitle}>90/180 Day Rule</Text>
      </View>

      <DaysCounter status={status} />

      {trips.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>
            Go to the Trips tab to add your Schengen Area visits.
            The tracker will calculate your remaining days automatically.
          </Text>
        </View>
      )}

      {trips.length > 0 && (
        <>
          {/* Quick Info Cards */}
          <View style={styles.infoCards}>
            {status.currentTrip && (
              <View style={[styles.infoCard, { backgroundColor: COLORS.primaryLight }]}>
                <Text style={styles.infoCardEmoji}>📍</Text>
                <Text style={[styles.infoCardTitle, { color: COLORS.primaryDark }]}>
                  Currently in Schengen
                </Text>
                <Text style={[styles.infoCardValue, { color: COLORS.primaryDark }]}>
                  {status.currentTrip.note || 'Current trip'}
                </Text>
              </View>
            )}

            {nextFullReset && (
              <View style={[styles.infoCard, { backgroundColor: COLORS.successLight }]}>
                <Text style={styles.infoCardEmoji}>🔄</Text>
                <Text style={[styles.infoCardTitle, { color: COLORS.success }]}>
                  Full 90 days available
                </Text>
                <Text style={[styles.infoCardValue, { color: COLORS.success }]}>
                  {format(parseISO(nextFullReset), 'MMM d, yyyy')}
                </Text>
              </View>
            )}

            {next30DayEntry && (
              <View style={[styles.infoCard, { backgroundColor: COLORS.warningLight }]}>
                <Text style={styles.infoCardEmoji}>📅</Text>
                <Text style={[styles.infoCardTitle, { color: COLORS.warning }]}>
                  Can stay 30+ days from
                </Text>
                <Text style={[styles.infoCardValue, { color: COLORS.warning }]}>
                  {format(parseISO(next30DayEntry), 'MMM d, yyyy')}
                </Text>
              </View>
            )}
          </View>

          <Timeline trips={trips} />
          <ResetSchedule events={resetEvents} daysRemaining={status.daysRemaining} />
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Based on the Schengen Area 90/180 day rule.{'\n'}
          Both entry and exit days count as full days.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  appTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  appSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  infoCard: {
    flex: 1,
    minWidth: 140,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoCardEmoji: {
    fontSize: 24,
  },
  infoCardTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCardValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
