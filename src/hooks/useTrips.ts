import { useState, useEffect, useCallback } from 'react';
import { Trip } from '../types';
import { apiGetTrips, apiAddTrip, apiUpdateTrip, apiDeleteTrip } from '../utils/api';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await apiGetTrips();
      // Sort by start date descending
      loaded.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
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
    await apiAddTrip(trip);
    await refresh();
    return trips;
  }, [refresh, trips]);

  const updateTrip = useCallback(async (trip: Trip) => {
    await apiUpdateTrip(trip);
    await refresh();
    return trips;
  }, [refresh, trips]);

  const deleteTrip = useCallback(async (tripId: string) => {
    await apiDeleteTrip(tripId);
    await refresh();
    return trips;
  }, [refresh, trips]);

  return { trips, loading, refresh, addTrip, updateTrip, deleteTrip };
}
