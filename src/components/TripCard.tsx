import React, { useState , useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, differenceInDays } from 'date-fns';
import { SPACING, FONT_SIZE, RADIUS , ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/ThemeContext';
import { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: string) => void;
  isActive?: boolean;
}

export function TripCard({ trip, onEdit, onDelete, isActive }: TripCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [showActions, setShowActions] = useState(false);
  const startDate = parseISO(trip.startDate);
  const endDate = parseISO(trip.endDate);
  const duration = differenceInDays(endDate, startDate) + 1;

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={() => setShowActions(!showActions)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.dateRange}>
            <Text style={styles.dateText}>
              {format(startDate, 'MMM d')} → {format(endDate, 'MMM d, yyyy')}
            </Text>
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>NOW</Text>
              </View>
            )}
          </View>
          <View style={styles.details}>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{duration} day{duration !== 1 ? 's' : ''}</Text>
            </View>
            {trip.note ? (
              <Text style={styles.note} numberOfLines={1}>{trip.note}</Text>
            ) : null}
          </View>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton} onPress={() => { onEdit(trip); setShowActions(false); }}>
            <Ionicons name="pencil" size={14} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => { onDelete(trip.id); setShowActions(false); }}>
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  activeContainer: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: colors.text,
  },
  activeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  activeBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  durationBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  durationText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  note: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: SPACING.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  editButtonText: {
    fontSize: FONT_SIZE.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  deleteButtonText: {
    fontSize: FONT_SIZE.sm,
    color: colors.danger,
    fontWeight: '600',
  },
});
