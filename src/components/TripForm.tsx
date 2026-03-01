import React, { useState, useEffect } from 'react';
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
import { format, parseISO, isValid, isBefore, startOfDay } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { Trip } from '../types';
import { generateId } from '../utils/schengen';

interface TripFormProps {
  visible: boolean;
  trip?: Trip | null;
  onSave: (trip: Trip) => void;
  onCancel: () => void;
}

function parseDateInput(input: string): Date | null {
  // Accept YYYY-MM-DD or MM/DD/YYYY
  let date: Date | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    date = parseISO(input);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
    const [m, d, y] = input.split('/').map(Number);
    date = new Date(y, m - 1, d);
  }

  return date && isValid(date) ? date : null;
}

export function TripForm({ visible, trip, onSave, onCancel }: TripFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (trip) {
      setStartDate(trip.startDate);
      setEndDate(trip.endDate);
      setNote(trip.note || '');
    } else {
      setStartDate('');
      setEndDate('');
      setNote('');
    }
    setError('');
  }, [trip, visible]);

  const handleSave = () => {
    setError('');

    const start = parseDateInput(startDate);
    const end = parseDateInput(endDate);

    if (!start) {
      setError('Please enter a valid start date (YYYY-MM-DD)');
      return;
    }
    if (!end) {
      setError('Please enter a valid end date (YYYY-MM-DD)');
      return;
    }
    if (isBefore(startOfDay(end), startOfDay(start))) {
      setError('End date must be on or after start date');
      return;
    }

    onSave({
      id: trip?.id || generateId(),
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
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
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Arrival Date</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numbers-and-punctuation"
                autoFocus={!trip}
              />
              <Text style={styles.hint}>The day you entered the Schengen Area</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Departure Date</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.hint}>The day you left (or will leave) the Schengen Area</Text>
            </View>

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
    padding: SPACING.lg,
    gap: SPACING.lg,
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
  hint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
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
