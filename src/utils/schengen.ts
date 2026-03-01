import {
  parseISO,
  differenceInDays,
  addDays,
  subDays,
  format,
  isWithinInterval,
  startOfDay,
  isBefore,
  isAfter,
  isSameDay,
  eachDayOfInterval,
  min,
  max,
} from 'date-fns';
import { Trip, SchengenStatus, ResetEvent, PlanResult } from '../types';
import { SCHENGEN } from '../constants/theme';

/**
 * Count the number of days spent in the Schengen area within a window.
 * Both entry and exit days count as full days.
 */
export function countDaysInWindow(
  trips: Trip[],
  windowStart: Date,
  windowEnd: Date
): number {
  let count = 0;
  const start = startOfDay(windowStart);
  const end = startOfDay(windowEnd);

  for (const trip of trips) {
    const tripStart = startOfDay(parseISO(trip.startDate));
    const tripEnd = startOfDay(parseISO(trip.endDate));

    // Find the overlap between the trip and the window
    const overlapStart = max([tripStart, start]);
    const overlapEnd = min([tripEnd, end]);

    if (!isAfter(overlapStart, overlapEnd)) {
      // +1 because both start and end days count
      count += differenceInDays(overlapEnd, overlapStart) + 1;
    }
  }

  return count;
}

/**
 * Get the current Schengen status for a given date.
 */
export function getSchengenStatus(
  trips: Trip[],
  referenceDate: Date = new Date()
): SchengenStatus {
  const today = startOfDay(referenceDate);
  const windowStart = subDays(today, SCHENGEN.WINDOW_DAYS - 1);

  const daysUsed = countDaysInWindow(trips, windowStart, today);
  const daysRemaining = Math.max(0, SCHENGEN.MAX_STAY_DAYS - daysUsed);
  const isOverstay = daysUsed > SCHENGEN.MAX_STAY_DAYS;

  // Find current trip (if any)
  const currentTrip = trips.find((trip) => {
    const tripStart = startOfDay(parseISO(trip.startDate));
    const tripEnd = startOfDay(parseISO(trip.endDate));
    return (
      (isBefore(tripStart, today) || isSameDay(tripStart, today)) &&
      (isAfter(tripEnd, today) || isSameDay(tripEnd, today))
    );
  }) || null;

  return {
    daysUsed,
    daysRemaining,
    maxDays: SCHENGEN.MAX_STAY_DAYS,
    windowStart: format(windowStart, 'yyyy-MM-dd'),
    windowEnd: format(today, 'yyyy-MM-dd'),
    isOverstay,
    currentTrip,
  };
}

/**
 * Calculate when days will "reset" (fall off the 180-day window).
 * Returns a list of dates when days become available again.
 */
export function getResetSchedule(
  trips: Trip[],
  referenceDate: Date = new Date(),
  lookAheadDays: number = 180
): ResetEvent[] {
  const today = startOfDay(referenceDate);
  const events: ResetEvent[] = [];

  // For each day in the future, check if a trip day falls off the window
  // A trip day from date X falls off the window on date X + 180
  const windowStart = subDays(today, SCHENGEN.WINDOW_DAYS - 1);

  // Get all individual days spent in Schengen within the current window
  const schengenDays: { date: Date; tripNote?: string }[] = [];
  for (const trip of trips) {
    const tripStart = startOfDay(parseISO(trip.startDate));
    const tripEnd = startOfDay(parseISO(trip.endDate));
    const overlapStart = max([tripStart, windowStart]);
    const overlapEnd = min([tripEnd, today]);

    if (!isAfter(overlapStart, overlapEnd)) {
      const days = eachDayOfInterval({ start: overlapStart, end: overlapEnd });
      for (const day of days) {
        schengenDays.push({ date: day, tripNote: trip.note });
      }
    }
  }

  // Sort by date
  schengenDays.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Each day falls off the window 180 days after it occurred
  let cumulativeFreed = 0;
  const currentStatus = getSchengenStatus(trips, referenceDate);
  let runningAvailable = currentStatus.daysRemaining;
  let lastResetDate: string | null = null;

  for (const schengenDay of schengenDays) {
    const resetDate = addDays(schengenDay.date, SCHENGEN.WINDOW_DAYS);

    if (isAfter(resetDate, today)) {
      const resetDateStr = format(resetDate, 'yyyy-MM-dd');

      // Consolidate consecutive days from the same "batch"
      if (lastResetDate === resetDateStr && events.length > 0) {
        events[events.length - 1].daysFreed += 1;
        events[events.length - 1].cumulativeDaysAvailable += 1;
        runningAvailable += 1;
      } else {
        cumulativeFreed += 1;
        runningAvailable += 1;
        events.push({
          date: resetDateStr,
          daysFreed: 1,
          cumulativeDaysAvailable: runningAvailable,
          tripNote: schengenDay.tripNote,
        });
      }
      lastResetDate = resetDateStr;
    }
  }

  // Only return events within the look-ahead window
  const lookAheadEnd = addDays(today, lookAheadDays);
  return events.filter((e) => !isAfter(parseISO(e.date), lookAheadEnd));
}

/**
 * Plan a future trip: "If I arrive on X, how long can I stay?"
 */
export function planTrip(
  trips: Trip[],
  arrivalDate: Date
): PlanResult {
  const arrival = startOfDay(arrivalDate);

  // Calculate days available on arrival
  const statusOnArrival = getSchengenStatus(trips, arrival);
  let daysAvailable = statusOnArrival.daysRemaining;

  if (daysAvailable <= 0) {
    return {
      canStay: false,
      maxConsecutiveDays: 0,
      daysAvailableOnArrival: 0,
    };
  }

  // Simulate day by day to find the max consecutive stay
  let maxDays = 0;
  for (let i = 0; i < SCHENGEN.MAX_STAY_DAYS; i++) {
    const checkDate = addDays(arrival, i);
    const windowStart = subDays(checkDate, SCHENGEN.WINDOW_DAYS - 1);

    // Count existing trip days in the window
    const existingDays = countDaysInWindow(trips, windowStart, checkDate);

    // Add the days of this hypothetical trip (arrival to checkDate)
    const hypotheticalDays = i + 1;

    // But we need to subtract any overlap between existing trips and our hypothetical trip
    const hypotheticalOverlap = countDaysInWindow(trips, arrival, checkDate);
    const totalDays = existingDays + hypotheticalDays - hypotheticalOverlap;

    if (totalDays <= SCHENGEN.MAX_STAY_DAYS) {
      maxDays = i + 1;
    } else {
      break;
    }
  }

  const warningDate = maxDays > 0 ? format(addDays(arrival, maxDays - 1), 'yyyy-MM-dd') : undefined;

  return {
    canStay: maxDays > 0,
    maxConsecutiveDays: maxDays,
    daysAvailableOnArrival: daysAvailable,
    warningDate,
  };
}

/**
 * Find the next date when the user can enter for at least `minDays` days.
 */
export function findNextEntryDate(
  trips: Trip[],
  minDays: number = 1,
  startFrom: Date = new Date(),
  maxSearch: number = 365
): string | null {
  const start = startOfDay(startFrom);

  for (let i = 0; i <= maxSearch; i++) {
    const checkDate = addDays(start, i);
    const result = planTrip(trips, checkDate);

    if (result.maxConsecutiveDays >= minDays) {
      return format(checkDate, 'yyyy-MM-dd');
    }
  }

  return null;
}

/**
 * Get day-by-day status for a date range (for timeline visualization).
 */
export function getDayStatuses(
  trips: Trip[],
  rangeStart: Date,
  rangeEnd: Date
): { date: string; inSchengen: boolean; tripId?: string }[] {
  const days = eachDayOfInterval({
    start: startOfDay(rangeStart),
    end: startOfDay(rangeEnd),
  });

  return days.map((day) => {
    const matchingTrip = trips.find((trip) => {
      const tripStart = startOfDay(parseISO(trip.startDate));
      const tripEnd = startOfDay(parseISO(trip.endDate));
      return (
        (isBefore(tripStart, day) || isSameDay(tripStart, day)) &&
        (isAfter(tripEnd, day) || isSameDay(tripEnd, day))
      );
    });

    return {
      date: format(day, 'yyyy-MM-dd'),
      inSchengen: !!matchingTrip,
      tripId: matchingTrip?.id,
    };
  });
}

/**
 * Validate that trips don't overlap.
 */
export function validateTrips(trips: Trip[]): string[] {
  const errors: string[] = [];
  const sorted = [...trips].sort(
    (a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const currentEnd = parseISO(current.endDate);
    const nextStart = parseISO(next.startDate);

    if (isBefore(nextStart, currentEnd) || isSameDay(nextStart, currentEnd)) {
      // Allow same day: exit one trip, enter another on the same day is fine
      // But if nextStart is before currentEnd, that's an overlap
      if (isBefore(nextStart, currentEnd)) {
        errors.push(
          `Trip "${current.note || current.startDate}" overlaps with "${next.note || next.startDate}"`
        );
      }
    }
  }

  return errors;
}

/**
 * Generate a unique ID for a trip.
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
