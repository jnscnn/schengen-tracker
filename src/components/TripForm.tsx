import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, differenceInDays, eachDayOfInterval, isBefore, isAfter, startOfDay } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { Trip } from '../types';
import { generateId } from '../utils/schengen';

interface TripFormProps {
  visible: boolean;
  trip?: Trip | null;
  existingTrips?: Trip[];
  onSave: (trip: Trip) => void;
  onCancel: () => void;
}

type SelectionPhase = 'start' | 'end';

export function TripForm({ visible, trip, existingTrips, onSave, onCancel }: TripFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<SelectionPhase>('start');

  useEffect(() => {
    if (trip) {
      setStartDate(trip.startDate);
      setEndDate(trip.endDate);
      setNote(trip.note || '');
      setPhase('start');
    } else {
      setStartDate('');
      setEndDate('');
      setNote('');
      setPhase('start');
    }
    setError('');
  }, [trip, visible]);

  const handleDayPress = (day: DateData) => {
    if (phase === 'start') {
      setStartDate(day.dateString);
      setEndDate('');
      setPhase('end');
    } else {
      // If selected day is before start, swap it to be the new start
      if (day.dateString < startDate) {
        setStartDate(day.dateString);
        setEndDate('');
        // Stay in 'end' phase
      } else {
        setEndDate(day.dateString);
        setPhase('start');
      }
    }
    setError('');
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    if (startDate && endDate) {
      try {
        const days = eachDayOfInterval({
          start: parseISO(startDate),
          end: parseISO(endDate),
        });
        days.forEach((d, i) => {
          const key = format(d, 'yyyy-MM-dd');
          marks[key] = {
            color: COLORS.primary,
            textColor: COLORS.textInverse,
            startingDay: i === 0,
            endingDay: i === days.length - 1,
          };
        });
      } catch {}
    } else if (startDate) {
      marks[startDate] = {
        color: COLORS.primary,
        textColor: COLORS.textInverse,
        startingDay: true,
        endingDay: true,
      };
    }

    return marks;
  }, [startDate, endDate]);

  // Check for overlap with existing trips
  const overlapWarning = useMemo(() => {
    if (!startDate || !endDate || !existingTrips) return null;
    const newStart = startOfDay(parseISO(startDate));
    const newEnd = startOfDay(parseISO(endDate));
    for (const existing of existingTrips) {
      if (trip && existing.id === trip.id) continue; // skip self when editing
      const exStart = startOfDay(parseISO(existing.startDate));
      const exEnd = startOfDay(parseISO(existing.endDate));
      // Overlap: newStart <= exEnd && newEnd >= exStart
      if (!isAfter(newStart, exEnd) && !isBefore(newEnd, exStart)) {
        return `Overlaps with ${existing.note || `trip ${format(exStart, 'MMM d')} – ${format(exEnd, 'MMM d')}`}`;
      }
    }
    return null;
  }, [startDate, endDate, existingTrips, trip]);

  const duration = useMemo(() => {
    if (startDate && endDate) {
      return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
    }
    return 0;
  }, [startDate, endDate]);

  const handleSave = () => {
    setError('');
    if (!startDate) {
      setError('Please select an arrival date on the calendar');
      return;
    }
    if (!endDate) {
      setError('Please select a departure date on the calendar');
      return;
    }

    onSave({
      id: trip?.id || generateId(),
      startDate,
      endDate,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {trip ? 'Edit Trip' : 'Add Trip'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveButton, (!startDate || !endDate) && { opacity: 0.4 }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Selection prompt */}
            <View style={styles.promptContainer}>
              <Text style={styles.promptText}>
                {phase === 'start'
                  ? '✈️ Tap your arrival date'
                  : '🏠 Now tap your departure date'}
              </Text>
            </View>

            {/* Selected range display */}
            <View style={styles.dateDisplayRow}>
              <View style={[styles.dateDisplay, phase === 'start' && styles.dateDisplayActive]}>
                <Text style={styles.dateDisplayLabel}>Arrival</Text>
                <Text style={styles.dateDisplayValue}>
                  {startDate ? format(parseISO(startDate), 'MMM d, yyyy') : '—'}
                </Text>
              </View>
              <Text style={styles.dateArrow}>→</Text>
              <View style={[styles.dateDisplay, phase === 'end' && styles.dateDisplayActive]}>
                <Text style={styles.dateDisplayLabel}>Departure</Text>
                <Text style={styles.dateDisplayValue}>
                  {endDate ? format(parseISO(endDate), 'MMM d, yyyy') : '—'}
                </Text>
              </View>
            </View>

            {duration > 0 && (
              <Text style={styles.durationText}>
                {duration} day{duration !== 1 ? 's' : ''} in Schengen
              </Text>
            )}

            {/* Calendar */}
            <Calendar
              markingType="period"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              initialDate={startDate || undefined}
              theme={{
                backgroundColor: COLORS.surface,
                calendarBackground: COLORS.surface,
                textSectionTitleColor: COLORS.textSecondary,
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.textInverse,
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

            {/* Note field */}
            <View style={styles.field}>
              <Text style={styles.label}>Note (optional)</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="e.g., Berlin trip, Christmas visit..."
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {overlapWarning && !error ? (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>⚠️ {overlapWarning}</Text>
              </View>
            ) : null}

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 How to count days</Text>
              <Text style={styles.infoText}>
                Both your arrival and departure days count as full days in the Schengen Area.
                If you arrived Jan 1 and left Jan 3, that's 3 days.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  cancelButton: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  saveButton: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  form: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  promptContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  promptText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  dateDisplay: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dateDisplayActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  dateDisplayLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateDisplayValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  dateArrow: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textTertiary,
  },
  durationText: {
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  calendar: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  field: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.md,
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
  errorContainer: {
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  infoTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    lineHeight: 20,
  },
});
