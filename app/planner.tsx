import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, addDays, startOfDay } from 'date-fns';
import { useTripsContext } from '../src/hooks/TripsContext';
import { planTrip, findNextEntryDate, getSchengenStatus } from '../src/utils/schengen';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/constants/theme';

export default function PlannerScreen() {
  const { trips } = useTripsContext();
  const [selectedDate, setSelectedDate] = useState<string>('');

  const arrivalDate = useMemo(
    () => (selectedDate ? parseISO(selectedDate) : null),
    [selectedDate]
  );

  const planResult = useMemo(() => {
    if (!arrivalDate) return null;
    return planTrip(trips, arrivalDate);
  }, [trips, arrivalDate]);

  const status = useMemo(() => getSchengenStatus(trips), [trips]);

  // Quick scenarios
  const nextWeekTrip = useMemo(() => findNextEntryDate(trips, 7), [trips]);
  const nextTwoWeekTrip = useMemo(() => findNextEntryDate(trips, 14), [trips]);
  const nextMonthTrip = useMemo(() => findNextEntryDate(trips, 30), [trips]);
  const nextFullTrip = useMemo(() => findNextEntryDate(trips, 90), [trips]);

  // Calendar marked dates: selected + hypothetical stay range
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    if (selectedDate && planResult?.canStay && planResult.warningDate) {
      // Mark the range from arrival to max stay
      const start = parseISO(selectedDate);
      const end = parseISO(planResult.warningDate);
      let current = start;
      let i = 0;
      const totalDays = planResult.maxConsecutiveDays;
      while (current <= end) {
        const key = format(current, 'yyyy-MM-dd');
        marks[key] = {
          color: COLORS.primary,
          textColor: COLORS.textInverse,
          startingDay: i === 0,
          endingDay: i === totalDays - 1,
        };
        current = addDays(current, 1);
        i++;
      }
    } else if (selectedDate) {
      marks[selectedDate] = {
        color: planResult?.canStay === false ? COLORS.danger : COLORS.primary,
        textColor: COLORS.textInverse,
        startingDay: true,
        endingDay: true,
      };
    }

    return marks;
  }, [selectedDate, planResult]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔮 Quick Look</Text>
        <Text style={styles.sectionSubtitle}>
          When can you next visit for...
        </Text>

        <View style={styles.quickCards}>
          <QuickCard label="1 week" days={7} date={nextWeekTrip} available={status.daysRemaining >= 7} />
          <QuickCard label="2 weeks" days={14} date={nextTwoWeekTrip} available={status.daysRemaining >= 14} />
          <QuickCard label="1 month" days={30} date={nextMonthTrip} available={status.daysRemaining >= 30} />
          <QuickCard label="Full 90 days" days={90} date={nextFullTrip} available={status.daysRemaining >= 90} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Plan a Trip</Text>
        <Text style={styles.sectionSubtitle}>
          Tap a date to see how long you can stay
        </Text>

        {selectedDate && arrivalDate && (
          <View style={styles.selectedDateBanner}>
            <Text style={styles.selectedDateText}>
              ✈️ Arriving {format(arrivalDate, 'MMM d, yyyy')}
            </Text>
          </View>
        )}

        <Calendar
          markingType="period"
          markedDates={markedDates}
          onDayPress={handleDayPress}
          minDate={format(new Date(), 'yyyy-MM-dd')}
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
            textDayFontSize: 15,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
          style={styles.calendar}
        />

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
        <Text style={[styles.quickCardDate, { color: COLORS.success }]}>Now! ✓</Text>
      ) : date ? (
        <Text style={[styles.quickCardDate, { color: COLORS.warning }]}>{format(parseISO(date), 'MMM d')}</Text>
      ) : (
        <Text style={[styles.quickCardDate, { color: COLORS.textTertiary }]}>365+ days</Text>
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
  selectedDateBanner: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  selectedDateText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  calendar: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
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
