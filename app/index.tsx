import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DaysCounter } from '../src/components/DaysCounter';
import { Timeline } from '../src/components/Timeline';
import { ResetSchedule } from '../src/components/ResetSchedule';
import { useTripsContext } from '../src/hooks/TripsContext';
import { getSchengenStatus, getResetSchedule, findNextEntryDate } from '../src/utils/schengen';
import { SPACING, FONT_SIZE, RADIUS , ThemeColors } from '../src/constants/theme';
import { useTheme } from '../src/hooks/ThemeContext';
import { format, parseISO, differenceInDays, startOfDay, isBefore } from 'date-fns';

export default function DashboardScreen() {
  const { trips, loading, refresh } = useTripsContext();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

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

  // Next upcoming trip countdown
  const nextFutureTrip = useMemo(() => {
    const today = startOfDay(new Date());
    const future = trips
      .filter(t => isBefore(today, parseISO(t.startDate)))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    if (future.length === 0) return null;
    const trip = future[0];
    const daysUntil = differenceInDays(parseISO(trip.startDate), today);
    return { ...trip, daysUntil };
  }, [trips]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      <DaysCounter status={status} />

      {/* Next trip countdown */}
      {nextFutureTrip && !status.currentTrip && (
        <View style={styles.nextTripBanner}>
          <Text style={styles.nextTripEmoji}>✈️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.nextTripText}>
              {nextFutureTrip.daysUntil === 0
                ? 'Your trip starts today!'
                : `${nextFutureTrip.daysUntil} day${nextFutureTrip.daysUntil !== 1 ? 's' : ''} until ${nextFutureTrip.note || 'your next trip'}`}
            </Text>
            <Text style={styles.nextTripDate}>
              {format(parseISO(nextFutureTrip.startDate), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
      )}

      {trips.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>
            Add your Schengen Area visits to start tracking your remaining days.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/trips')}
          >
            <Ionicons name="add-circle" size={20} color={colors.textInverse} />
            <Text style={styles.emptyButtonText}>Add Your First Trip</Text>
          </TouchableOpacity>
        </View>
      )}

      {trips.length > 0 && (
        <>
          {/* Quick Info Cards */}
          <View style={styles.infoCards}>
            {status.currentTrip && (
              <View style={[styles.infoCard, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.infoCardEmoji}>📍</Text>
                <Text style={[styles.infoCardTitle, { color: colors.primaryDark }]}>
                  Currently in Schengen
                </Text>
                <Text style={[styles.infoCardValue, { color: colors.primaryDark }]}>
                  {status.currentTrip.note || 'Current trip'}
                </Text>
              </View>
            )}

            {nextFullReset && (
              <View style={[styles.infoCard, { backgroundColor: colors.successLight }]}>
                <Text style={styles.infoCardEmoji}>🔄</Text>
                <Text style={[styles.infoCardTitle, { color: colors.success }]}>
                  Full 90 days available
                </Text>
                <Text style={[styles.infoCardValue, { color: colors.success }]}>
                  {format(parseISO(nextFullReset), 'MMM d, yyyy')}
                </Text>
              </View>
            )}

            {next30DayEntry && (
              <View style={[styles.infoCard, { backgroundColor: colors.warningLight }]}>
                <Text style={styles.infoCardEmoji}>📅</Text>
                <Text style={[styles.infoCardTitle, { color: colors.warning }]}>
                  Can stay 30+ days from
                </Text>
                <Text style={[styles.infoCardValue, { color: colors.warning }]}>
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

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  nextTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  nextTripEmoji: {
    fontSize: 24,
  },
  nextTripText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: colors.accent,
  },
  nextTripDate: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  emptyButtonText: {
    color: colors.textInverse,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
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
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
