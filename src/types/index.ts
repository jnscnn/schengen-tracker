export interface Trip {
  id: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
  note?: string;
}

export interface DayStatus {
  date: string;
  inSchengen: boolean;
  tripId?: string;
}

export interface SchengenStatus {
  daysUsed: number;
  daysRemaining: number;
  maxDays: number;
  windowStart: string;
  windowEnd: string;
  isOverstay: boolean;
  currentTrip: Trip | null;
}

export interface ResetEvent {
  date: string;
  daysFreed: number;
  cumulativeDaysAvailable: number;
  tripNote?: string;
}

export interface PlanResult {
  canStay: boolean;
  maxConsecutiveDays: number;
  daysAvailableOnArrival: number;
  warningDate?: string; // date when you'd need to leave
}
