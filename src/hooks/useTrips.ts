import { useState, useEffect, useCallback } from 'react';
import { Trip } from '../types';
import { loadTrips, saveTrips, addTrip as addTripStorage, updateTrip as updateTripStorage, deleteTrip as deleteTripStorage } from '../utils/storage';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await loadTrips();
      setTrips(loaded);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTrip = useCallback(async (trip: Trip) => {
    const updated = await addTripStorage(trip);
    setTrips(updated);
    return updated;
  }, []);

  const updateTrip = useCallback(async (trip: Trip) => {
    const updated = await updateTripStorage(trip);
    setTrips(updated);
    return updated;
  }, []);

  const deleteTrip = useCallback(async (tripId: string) => {
    const updated = await deleteTripStorage(tripId);
    setTrips(updated);
    return updated;
  }, []);

  return {
    trips,
    loading,
    refresh,
    addTrip,
    updateTrip,
    deleteTrip,
  };
}
