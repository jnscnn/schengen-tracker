import React, { createContext, useContext, ReactNode } from 'react';
import { useTrips } from './useTrips';
import { Trip } from '../types';

interface TripsContextType {
  trips: Trip[];
  loading: boolean;
  refresh: () => Promise<void>;
  addTrip: (trip: Trip) => Promise<Trip[]>;
  updateTrip: (trip: Trip) => Promise<Trip[]>;
  deleteTrip: (tripId: string) => Promise<Trip[]>;
}

const TripsContext = createContext<TripsContextType | null>(null);

export function TripsProvider({ children }: { children: ReactNode }) {
  const tripsData = useTrips();

  return (
    <TripsContext.Provider value={tripsData}>
      {children}
    </TripsContext.Provider>
  );
}

export function useTripsContext(): TripsContextType {
  const context = useContext(TripsContext);
  if (!context) {
    throw new Error('useTripsContext must be used within a TripsProvider');
  }
  return context;
}
