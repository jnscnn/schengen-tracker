import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subDays, startOfDay, parseISO } from 'date-fns';
import { useTripsContext } from '../src/hooks/TripsContext';
import { TripCard } from '../src/components/TripCard';
import { TripForm } from '../src/components/TripForm';
import { Trip } from '../src/types';
import { getSchengenStatus } from '../src/utils/schengen';
import { COLORS, SPACING, FONT_SIZE, RADIUS, SCHENGEN } from '../src/constants/theme';

export default function TripsScreen() {
  const { trips, addTrip, updateTrip, deleteTrip, loading } = useTripsContext();
  const [formVisible, setFormVisible] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const status = getSchengenStatus(trips);

  // Split trips into recent (within 180-day window) and past
  const { recentTrips, pastTrips } = useMemo(() => {
    const cutoff = subDays(startOfDay(new Date()), SCHENGEN.WINDOW_DAYS - 1);
    const recent: Trip[] = [];
    const past: Trip[] = [];
    for (const trip of trips) {
      const tripEnd = parseISO(trip.endDate);
      if (tripEnd >= cutoff) {
        recent.push(trip);
      } else {
        past.push(trip);
      }
    }
    return { recentTrips: recent, pastTrips: past };
  }, [trips]);

  const handleAdd = useCallback(() => {
    setEditingTrip(null);
    setFormVisible(true);
  }, []);

  const handleEdit = useCallback((trip: Trip) => {
    setEditingTrip(trip);
    setFormVisible(true);
  }, []);

  const handleDelete = useCallback(
    (tripId: string) => {
      const doDelete = () => deleteTrip(tripId);

      if (Platform.OS === 'web') {
        if (window.confirm('Delete this trip?')) {
          doDelete();
        }
      } else {
        Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]);
      }
    },
    [deleteTrip]
  );

  const handleSave = useCallback(
    async (trip: Trip) => {
      if (editingTrip) {
        await updateTrip(trip);
      } else {
        await addTrip(trip);
      }
      setFormVisible(false);
      setEditingTrip(null);
    },
    [editingTrip, addTrip, updateTrip]
  );

  const handleCancel = useCallback(() => {
    setFormVisible(false);
    setEditingTrip(null);
  }, []);

  const renderTrip = useCallback(
    ({ item }: { item: Trip }) => (
      <TripCard
        trip={item}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isActive={status.currentTrip?.id === item.id}
      />
    ),
    [handleEdit, handleDelete, status.currentTrip]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={recentTrips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{trips.length}</Text>
                <Text style={styles.summaryLabel}>
                  trip{trips.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
                  {status.daysUsed}
                </Text>
                <Text style={styles.summaryLabel}>days used</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  {status.daysRemaining}
                </Text>
                <Text style={styles.summaryLabel}>remaining</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌍</Text>
            <Text style={styles.emptyTitle}>No trips recorded</Text>
            <Text style={styles.emptyText}>
              Tap the + button to add your first trip to the Schengen Area.
            </Text>
          </View>
        }
        ListFooterComponent={
          pastTrips.length > 0 ? (
            <View style={styles.pastSection}>
              <TouchableOpacity
                style={styles.pastHeader}
                onPress={() => setShowPast(!showPast)}
              >
                <Text style={styles.pastHeaderText}>
                  Past Trips ({pastTrips.length})
                </Text>
                <Text style={styles.pastToggle}>
                  {showPast ? '▲ Hide' : '▼ Show'}
                </Text>
              </TouchableOpacity>
              {showPast && pastTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={COLORS.textInverse} />
      </TouchableOpacity>

      <TripForm
        visible={formVisible}
        trip={editingTrip}
        existingTrips={trips}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingTop: SPACING.md,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: COLORS.textInverse,
    fontWeight: '400',
    lineHeight: 30,
  },
  pastSection: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  pastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  pastHeaderText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pastToggle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
