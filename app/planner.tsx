import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { format, parseISO, isValid, addDays, startOfDay } from 'date-fns';
import { useTripsContext } from '../src/hooks/TripsContext';
import { planTrip, findNextEntryDate, getSchengenStatus } from '../src/utils/schengen';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/constants/theme';

function parseDateInput(input: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const d = parseISO(input);
    return isValid(d) ? d : null;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
    const [m, d, y] = input.split('/').map(Number);
    const date = new Date(y, m - 1, d);
    return isValid(date) ? date : null;
  }
  return null;
}

export default function PlannerScreen() {
  const { trips } = useTripsContext();
  const [arrivalInput, setArrivalInput] = useState('');
  const [desiredDaysInput, setDesiredDaysInput] = useState('');

  const arrivalDate = useMemo(() => parseDateInput(arrivalInput), [arrivalInput]);
  const desiredDays = useMemo(() => {
    const n = parseInt(desiredDaysInput, 10);
    return isNaN(n) || n <= 0 ? null : n;
  }, [desiredDaysInput]);

  const planResult = useMemo(() => {
    if (!arrivalDate) return null;
    return planTrip(trips, arrivalDate);
  }, [trips, arrivalDate]);

  const status = useMemo(() => getSchengenStatus(trips), [trips]);

  // Quick scenarios
  const nextWeekTrip = useMemo(
    () => findNextEntryDate(trips, 7),
    [trips]
  );
  const nextTwoWeekTrip = useMemo(
    () => findNextEntryDate(trips, 14),
    [trips]
  );
  const nextMonthTrip = useMemo(
    () => findNextEntryDate(trips, 30),
    [trips]
  );
  const nextFullTrip = useMemo(
    () => findNextEntryDate(trips, 90),
    [trips]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔮 Quick Look</Text>
        <Text style={styles.sectionSubtitle}>
          When can you next visit for...
        </Text>

        <View style={styles.quickCards}>
          <QuickCard
            label="1 week"
            days={7}
            date={nextWeekTrip}
            available={status.daysRemaining >= 7}
          />
          <QuickCard
            label="2 weeks"
            days={14}
            date={nextTwoWeekTrip}
            available={status.daysRemaining >= 14}
          />
          <QuickCard
            label="1 month"
            days={30}
            date={nextMonthTrip}
            available={status.daysRemaining >= 30}
          />
          <QuickCard
            label="Full 90 days"
            days={90}
            date={nextFullTrip}
            available={status.daysRemaining >= 90}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Plan a Trip</Text>
        <Text style={styles.sectionSubtitle}>
          Enter an arrival date to see how long you can stay
        </Text>

        <View style={styles.inputRow}>
          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Arrival Date</Text>
            <TextInput
              style={styles.input}
              value={arrivalInput}
              onChangeText={setArrivalInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        {planResult && arrivalDate && (
          <View style={styles.resultCard}>
            {planResult.canStay ? (
              <>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultEmoji}>✅</Text>
                  <Text style={styles.resultTitle}>
                    You can enter on {format(arrivalDate, 'MMM d, yyyy')}
                  </Text>
                </View>

                <View style={styles.resultDetails}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Days available on arrival</Text>
                    <Text style={[styles.resultValue, { color: COLORS.primary }]}>
                      {planResult.daysAvailableOnArrival}
                    </Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Max consecutive stay</Text>
                    <Text style={[styles.resultValue, { color: COLORS.success }]}>
                      {planResult.maxConsecutiveDays} days
                    </Text>
                  </View>
                  {planResult.warningDate && (
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Must leave by</Text>
                      <Text style={[styles.resultValue, { color: COLORS.warning }]}>
                        {format(parseISO(planResult.warningDate), 'MMM d, yyyy')}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.resultHeader}>
                <Text style={styles.resultEmoji}>❌</Text>
                <Text style={styles.resultTitle}>
                  You cannot enter on {format(arrivalDate, 'MMM d, yyyy')}
                </Text>
                <Text style={styles.resultSubtext}>
                  You've used all 90 days in the 180-day window ending on this date.
                  Check the Quick Look section above to see when you can next enter.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About the 90/180 Rule</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            US citizens can stay in the Schengen Area for up to <Text style={styles.bold}>90 days</Text> within
            any <Text style={styles.bold}>180-day rolling window</Text>.
          </Text>
          <Text style={styles.infoText}>
            The 180 days are counted backward from any date you want to check.
            Both arrival and departure days count as full days.
          </Text>
          <Text style={styles.infoText}>
            The rule applies to the entire Schengen Area (most of the EU + a few more countries),
            not per country. Days in Germany, France, Italy etc. all count together.
          </Text>
          <Text style={styles.infoText}>
            ⚠️ Overstaying can result in fines, deportation, and future entry bans.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function QuickCard({
  label,
  days,
  date,
  available,
}: {
  label: string;
  days: number;
  date: string | null;
  available: boolean;
}) {
  return (
    <View style={[styles.quickCard, available && styles.quickCardAvailable]}>
      <Text style={styles.quickCardLabel}>{label}</Text>
      {available ? (
        <Text style={[styles.quickCardDate, { color: COLORS.success }]}>
          Now! ✓
        </Text>
      ) : date ? (
        <Text style={[styles.quickCardDate, { color: COLORS.warning }]}>
          {format(parseISO(date), 'MMM d')}
        </Text>
      ) : (
        <Text style={[styles.quickCardDate, { color: COLORS.textTertiary }]}>
          365+ days
        </Text>
      )}
    </View>
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
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  quickCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickCardAvailable: {
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  quickCardLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  quickCardDate: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputField: {
    flex: 1,
    gap: SPACING.xs,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resultEmoji: {
    fontSize: 32,
  },
  resultTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  resultSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultDetails: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  resultLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  resultValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.text,
  },
});
