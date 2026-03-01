import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, addDays, differenceInDays, eachDayOfInterval } from 'date-fns';
import { useTripsContext } from '../src/hooks/TripsContext';
import { planTrip, findNextEntryDate, getSchengenStatus, countDaysInWindow, getResetSchedule } from '../src/utils/schengen';
import { SPACING, FONT_SIZE, RADIUS, SCHENGEN , ThemeColors } from '../src/constants/theme';
import { useTheme } from '../src/hooks/ThemeContext';
import { subDays, startOfDay } from 'date-fns';

type PlannerMode = 'max' | 'custom';
type CustomPhase = 'start' | 'end';

export default function PlannerScreen() {
  const { trips } = useTripsContext();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [mode, setMode] = useState<PlannerMode>('max');

  // Max stay mode
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Custom trip mode
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [customPhase, setCustomPhase] = useState<CustomPhase>('start');

  const arrivalDate = useMemo(
    () => (selectedDate ? parseISO(selectedDate) : null),
    [selectedDate]
  );

  const planResult = useMemo(() => {
    if (!arrivalDate) return null;
    return planTrip(trips, arrivalDate);
  }, [trips, arrivalDate]);

  // Upcoming resets from the perspective of a selected/custom date
  const upcomingResets = useMemo(() => {
    const refDate = mode === 'max' && selectedDate
      ? parseISO(selectedDate)
      : mode === 'custom' && customStart
      ? parseISO(customStart)
      : new Date();
    const events = getResetSchedule(trips, refDate, 120);
    // Group consecutive days into spans
    if (events.length === 0) return [];
    const spans: { start: string; end: string; freed: number; available: number }[] = [];
    let cur = { start: events[0].date, end: events[0].date, freed: events[0].daysFreed, available: events[0].cumulativeDaysAvailable };
    for (let i = 1; i < events.length; i++) {
      const prevDate = parseISO(events[i-1].date);
      const currDate = parseISO(events[i].date);
      if (differenceInDays(currDate, prevDate) <= 1) {
        cur.end = events[i].date;
        cur.freed += events[i].daysFreed;
        cur.available = events[i].cumulativeDaysAvailable;
      } else {
        spans.push(cur);
        cur = { start: events[i].date, end: events[i].date, freed: events[i].daysFreed, available: events[i].cumulativeDaysAvailable };
      }
    }
    spans.push(cur);
    return spans.slice(0, 5);
  }, [trips, mode, selectedDate, customStart]);

  const status = useMemo(() => getSchengenStatus(trips), [trips]);

  // Custom trip analysis
  const customAnalysis = useMemo(() => {
    if (!customStart || !customEnd) return null;
    const start = parseISO(customStart);
    const end = parseISO(customEnd);
    if (end < start) return null;

    const tripDays = differenceInDays(end, start) + 1;

    // For each day of the hypothetical trip, check if 90-day limit is exceeded
    let worstDayUsed = 0;
    let overLimit = false;
    let firstOverDate: string | null = null;

    for (let i = 0; i <= differenceInDays(end, start); i++) {
      const checkDate = addDays(start, i);
      const windowStart = subDays(checkDate, SCHENGEN.WINDOW_DAYS - 1);

      // Existing days used in window
      const existingDays = countDaysInWindow(trips, windowStart, checkDate);
      // Hypothetical days: from trip start to checkDate
      const hypoStart = start > windowStart ? start : windowStart;
      const hypoDays = differenceInDays(checkDate, hypoStart) + 1;
      // Subtract overlap between existing trips and hypothetical trip
      const overlap = countDaysInWindow(trips, hypoStart, checkDate);
      const totalUsed = existingDays + hypoDays - overlap;

      if (totalUsed > worstDayUsed) worstDayUsed = totalUsed;
      if (totalUsed > SCHENGEN.MAX_STAY_DAYS && !firstOverDate) {
        overLimit = true;
        firstOverDate = format(checkDate, 'yyyy-MM-dd');
      }
    }

    // Days available after the trip (checking on the departure date)
    const departureWindowStart = subDays(end, SCHENGEN.WINDOW_DAYS - 1);
    const existingAtDeparture = countDaysInWindow(trips, departureWindowStart, end);
    const hypoStartClamped = start > departureWindowStart ? start : departureWindowStart;
    const hypoDaysAtDep = differenceInDays(end, hypoStartClamped) + 1;
    const overlapAtDep = countDaysInWindow(trips, hypoStartClamped, end);
    const totalAtDeparture = existingAtDeparture + hypoDaysAtDep - overlapAtDep;
    const daysRemainingAfter = Math.max(0, SCHENGEN.MAX_STAY_DAYS - totalAtDeparture);

    return {
      tripDays,
      worstDayUsed: Math.min(worstDayUsed, SCHENGEN.MAX_STAY_DAYS + tripDays),
      overLimit,
      firstOverDate,
      daysRemainingAfter,
      totalUsedAtDeparture: totalAtDeparture,
    };
  }, [trips, customStart, customEnd]);

  // Quick scenarios
  const nextWeekTrip = useMemo(() => findNextEntryDate(trips, 7), [trips]);
  const nextTwoWeekTrip = useMemo(() => findNextEntryDate(trips, 14), [trips]);
  const nextMonthTrip = useMemo(() => findNextEntryDate(trips, 30), [trips]);
  const nextFullTrip = useMemo(() => findNextEntryDate(trips, 90), [trips]);

  // Max stay calendar marks
  const maxMarkedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    if (selectedDate && planResult?.canStay && planResult.warningDate) {
      const start = parseISO(selectedDate);
      const end = parseISO(planResult.warningDate);
      const days = eachDayOfInterval({ start, end });
      days.forEach((d, i) => {
        marks[format(d, 'yyyy-MM-dd')] = {
          color: colors.primary,
          textColor: colors.textInverse,
          startingDay: i === 0,
          endingDay: i === days.length - 1,
        };
      });
    } else if (selectedDate) {
      marks[selectedDate] = {
        color: planResult?.canStay === false ? colors.danger : colors.primary,
        textColor: colors.textInverse,
        startingDay: true,
        endingDay: true,
      };
    }
    return marks;
  }, [selectedDate, planResult]);

  // Custom trip calendar marks
  const customMarkedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    if (customStart && customEnd) {
      try {
        const days = eachDayOfInterval({ start: parseISO(customStart), end: parseISO(customEnd) });
        const isOver = customAnalysis?.overLimit;
        days.forEach((d, i) => {
          marks[format(d, 'yyyy-MM-dd')] = {
            color: isOver ? colors.danger : colors.accent,
            textColor: colors.textInverse,
            startingDay: i === 0,
            endingDay: i === days.length - 1,
          };
        });
      } catch {}
    } else if (customStart) {
      marks[customStart] = {
        color: colors.accent,
        textColor: colors.textInverse,
        startingDay: true,
        endingDay: true,
      };
    }
    return marks;
  }, [customStart, customEnd, customAnalysis]);

  const handleMaxDayPress = (day: DateData) => setSelectedDate(day.dateString);

  const handleCustomDayPress = (day: DateData) => {
    if (customPhase === 'start') {
      setCustomStart(day.dateString);
      setCustomEnd('');
      setCustomPhase('end');
    } else {
      if (day.dateString < customStart) {
        setCustomStart(day.dateString);
        setCustomEnd('');
      } else {
        setCustomEnd(day.dateString);
        setCustomPhase('start');
      }
    }
  };

  const calendarTheme = {
    backgroundColor: colors.surface,
    calendarBackground: colors.surface,
    textSectionTitleColor: colors.textSecondary,
    todayTextColor: colors.accent,
    dayTextColor: colors.text,
    textDisabledColor: colors.textTertiary,
    arrowColor: colors.primary,
    monthTextColor: colors.text,
    textMonthFontWeight: '700' as const,
    textDayFontSize: 15,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 13,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔮 Quick Look</Text>
        <Text style={styles.sectionSubtitle}>When can you next visit for...</Text>

        <View style={styles.quickCards}>
          <QuickCard label="1 week" date={nextWeekTrip} available={status.daysRemaining >= 7} />
          <QuickCard label="2 weeks" date={nextTwoWeekTrip} available={status.daysRemaining >= 14} />
          <QuickCard label="1 month" date={nextMonthTrip} available={status.daysRemaining >= 30} />
          <QuickCard label="Full 90 days" date={nextFullTrip} available={status.daysRemaining >= 90} />
        </View>
      </View>

      {/* Mode toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Plan a Trip</Text>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'max' && styles.modeButtonActive]}
            onPress={() => setMode('max')}
          >
            <Text style={[styles.modeButtonText, mode === 'max' && styles.modeButtonTextActive]}>
              Max Stay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'custom' && styles.modeButtonActive]}
            onPress={() => setMode('custom')}
          >
            <Text style={[styles.modeButtonText, mode === 'custom' && styles.modeButtonTextActive]}>
              Custom Dates
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'max' ? (
          <>
            <Text style={styles.modeHint}>
              Tap an arrival date to see the longest you can stay
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
              markedDates={maxMarkedDates}
              onDayPress={handleMaxDayPress}
              minDate={format(new Date(), 'yyyy-MM-dd')}
              theme={calendarTheme}
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
                      <ResultRow label="Days available on arrival" value={`${planResult.daysAvailableOnArrival}`} color={colors.primary} />
                      <ResultRow label="Max consecutive stay" value={`${planResult.maxConsecutiveDays} days`} color={colors.success} />
                      {planResult.warningDate && (
                        <ResultRow label="Must leave by" value={format(parseISO(planResult.warningDate), 'MMM d, yyyy')} color={colors.warning} />
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultEmoji}>❌</Text>
                    <Text style={styles.resultTitle}>
                      Cannot enter on {format(arrivalDate, 'MMM d, yyyy')}
                    </Text>
                    <Text style={styles.resultSubtext}>
                      All 90 days are used in the 180-day window. Check Quick Look above for when you can next enter.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.modeHint}>
              {customPhase === 'start'
                ? 'Tap your arrival date'
                : 'Now tap your departure date'}
            </Text>

            {/* Date display */}
            <View style={styles.dateDisplayRow}>
              <View style={[styles.dateDisplay, customPhase === 'start' && styles.dateDisplayActive]}>
                <Text style={styles.dateDisplayLabel}>Arrival</Text>
                <Text style={styles.dateDisplayValue}>
                  {customStart ? format(parseISO(customStart), 'MMM d, yyyy') : '—'}
                </Text>
              </View>
              <Text style={styles.dateArrow}>→</Text>
              <View style={[styles.dateDisplay, customPhase === 'end' && styles.dateDisplayActive]}>
                <Text style={styles.dateDisplayLabel}>Departure</Text>
                <Text style={styles.dateDisplayValue}>
                  {customEnd ? format(parseISO(customEnd), 'MMM d, yyyy') : '—'}
                </Text>
              </View>
            </View>

            <Calendar
              markingType="period"
              markedDates={customMarkedDates}
              onDayPress={handleCustomDayPress}
              minDate={format(new Date(), 'yyyy-MM-dd')}
              theme={calendarTheme}
              style={styles.calendar}
            />

            {customAnalysis && (
              <View style={styles.resultCard}>
                {!customAnalysis.overLimit ? (
                  <>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultEmoji}>✅</Text>
                      <Text style={styles.resultTitle}>This trip works!</Text>
                    </View>
                    <View style={styles.resultDetails}>
                      <ResultRow label="Trip duration" value={`${customAnalysis.tripDays} days`} color={colors.text} />
                      <ResultRow label="Days used after trip" value={`${customAnalysis.totalUsedAtDeparture} / 90`} color={colors.primary} />
                      <ResultRow label="Days remaining after" value={`${customAnalysis.daysRemainingAfter}`} color={colors.success} />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultEmoji}>⚠️</Text>
                      <Text style={styles.resultTitle}>This trip exceeds the limit!</Text>
                    </View>
                    <View style={styles.resultDetails}>
                      <ResultRow label="Trip duration" value={`${customAnalysis.tripDays} days`} color={colors.text} />
                      <ResultRow label="Over limit starting" value={format(parseISO(customAnalysis.firstOverDate!), 'MMM d, yyyy')} color={colors.danger} />
                    </View>
                    <Text style={styles.resultSubtext}>
                      You would exceed 90 days in the rolling 180-day window during this trip.
                    </Text>
                  </>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* Upcoming resets */}
      {upcomingResets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Upcoming Resets</Text>
          <Text style={styles.sectionSubtitle}>When more days become available</Text>
          <View style={styles.resetsCard}>
            {upcomingResets.map((span, i) => {
              const isSingle = span.start === span.end;
              const avail = Math.min(span.available, 90);
              return (
                <View key={i} style={styles.resetRow}>
                  <View style={styles.resetDates}>
                    <Text style={styles.resetDateText}>{format(parseISO(span.start), 'MMM d')}</Text>
                    {!isSingle && (
                      <>
                        <Text style={styles.resetArrow}> → </Text>
                        <Text style={styles.resetDateText}>{format(parseISO(span.end), 'MMM d')}</Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.resetFreed}>+{span.freed}d</Text>
                  <Text style={[styles.resetAvail, { color: avail >= 60 ? colors.success : avail >= 30 ? colors.warning : colors.danger }]}>
                    → {avail} avail
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About the 90/180 Rule</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            US citizens can stay in the Schengen Area for up to <Text style={styles.bold}>90 days</Text> within
            any <Text style={styles.bold}>180-day rolling window</Text>.
          </Text>
          <Text style={styles.infoText}>
            Both arrival and departure days count as full days. The rule applies across all Schengen countries combined.
          </Text>
          <Text style={styles.infoText}>
            ⚠️ Overstaying can result in fines, deportation, and future entry bans.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ResultRow({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, { color }]}>{value}</Text>
    </View>
  );
}

function QuickCard({ label, date, available }: { label: string; date: string | null; available: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={[styles.quickCard, available && styles.quickCardAvailable]}>
      <Text style={styles.quickCardLabel}>{label}</Text>
      {available ? (
        <Text style={[styles.quickCardDate, { color: colors.success }]}>Now! ✓</Text>
      ) : date ? (
        <Text style={[styles.quickCardDate, { color: colors.warning }]}>{format(parseISO(date), 'MMM d')}</Text>
      ) : (
        <Text style={[styles.quickCardDate, { color: colors.textTertiary }]}>365+ days</Text>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: SPACING.xxl },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text },
  sectionSubtitle: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginTop: SPACING.xs, marginBottom: SPACING.md },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: RADIUS.md,
    padding: 3,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: colors.textSecondary },
  modeButtonTextActive: { color: colors.primary },
  modeHint: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginBottom: SPACING.sm, textAlign: 'center' },

  // Date display for custom mode
  dateDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  dateDisplay: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  dateDisplayActive: { borderColor: colors.accent, backgroundColor: '#F5F3FF' },
  dateDisplayLabel: { fontSize: FONT_SIZE.xs, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  dateDisplayValue: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: colors.text, marginTop: 2 },
  dateArrow: { fontSize: FONT_SIZE.lg, color: colors.textTertiary },

  // Calendar & banner
  selectedDateBanner: {
    backgroundColor: colors.primaryLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  selectedDateText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.primaryDark },
  calendar: { borderRadius: RADIUS.md, overflow: 'hidden' },

  // Quick cards
  quickCards: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  quickCard: {
    flex: 1, minWidth: 140, backgroundColor: colors.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  quickCardAvailable: { borderWidth: 1, borderColor: colors.success },
  quickCardLabel: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginBottom: SPACING.xs },
  quickCardDate: { fontSize: FONT_SIZE.md, fontWeight: '700' },

  // Result card
  resultCard: {
    backgroundColor: colors.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginTop: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  resultHeader: { alignItems: 'center', gap: SPACING.sm },
  resultEmoji: { fontSize: 32 },
  resultTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text, textAlign: 'center' },
  resultSubtext: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: SPACING.sm },
  resultDetails: { marginTop: SPACING.md, gap: SPACING.xs },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  resultLabel: { fontSize: FONT_SIZE.md, color: colors.textSecondary },
  resultValue: { fontSize: FONT_SIZE.lg, fontWeight: '700' },

  // Info
  infoBox: { backgroundColor: colors.surface, borderRadius: RADIUS.md, padding: SPACING.lg, gap: SPACING.md },
  infoText: { fontSize: FONT_SIZE.md, color: colors.textSecondary, lineHeight: 22 },
  bold: { fontWeight: '700', color: colors.text },

  // Resets section
  resetsCard: {
    backgroundColor: colors.surface, borderRadius: RADIUS.md, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  resetRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: SPACING.sm,
  },
  resetDates: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  resetDateText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: colors.text },
  resetArrow: { fontSize: FONT_SIZE.xs, color: colors.textTertiary },
  resetFreed: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: colors.success, width: 40, textAlign: 'right' },
  resetAvail: { fontSize: FONT_SIZE.sm, fontWeight: '600', width: 70, textAlign: 'right' },
});
