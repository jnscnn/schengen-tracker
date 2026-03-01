import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '../types';

const TRIPS_KEY = '@schengen_trips';

export async function loadTrips(): Promise<Trip[]> {
  try {
    const json = await AsyncStorage.getItem(TRIPS_KEY);
    if (json) {
      const trips: Trip[] = JSON.parse(json);
      // Sort by start date descending (most recent first)
      return trips.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    }
    return [];
  } catch (error) {
    console.error('Failed to load trips:', error);
    return [];
  }
}

export async function saveTrips(trips: Trip[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  } catch (error) {
    console.error('Failed to save trips:', error);
    throw error;
  }
}

export async function addTrip(trip: Trip): Promise<Trip[]> {
  const trips = await loadTrips();
  trips.push(trip);
  await saveTrips(trips);
  return loadTrips();
}

export async function updateTrip(updatedTrip: Trip): Promise<Trip[]> {
  const trips = await loadTrips();
  const index = trips.findIndex((t) => t.id === updatedTrip.id);
  if (index !== -1) {
    trips[index] = updatedTrip;
    await saveTrips(trips);
  }
  return loadTrips();
}

export async function deleteTrip(tripId: string): Promise<Trip[]> {
  const trips = await loadTrips();
  const filtered = trips.filter((t) => t.id !== tripId);
  await saveTrips(filtered);
  return loadTrips();
}
