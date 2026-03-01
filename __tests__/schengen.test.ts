import {
  countDaysInWindow,
  getSchengenStatus,
  getResetSchedule,
  planTrip,
  findNextEntryDate,
  getDayStatuses,
  validateTrips,
  generateId,
} from '../src/utils/schengen';
import { Trip } from '../src/types';
import { parseISO, subDays, addDays, startOfDay } from 'date-fns';

// Helper to create trips easily
function trip(start: string, end: string, note?: string): Trip {
  return { id: generateId(), startDate: start, endDate: end, note };
}

describe('countDaysInWindow', () => {
  it('counts days for a single trip within the window', () => {
    const trips = [trip('2026-01-10', '2026-01-20')];
    const windowStart = parseISO('2026-01-01');
    const windowEnd = parseISO('2026-01-31');
    // Jan 10 to Jan 20 = 11 days
    expect(countDaysInWindow(trips, windowStart, windowEnd)).toBe(11);
  });

  it('counts days when trip extends beyond window', () => {
    const trips = [trip('2025-12-25', '2026-01-05')];
    const windowStart = parseISO('2026-01-01');
    const windowEnd = parseISO('2026-01-31');
    // Only Jan 1-5 count = 5 days
    expect(countDaysInWindow(trips, windowStart, windowEnd)).toBe(5);
  });

  it('counts days for multiple trips', () => {
    const trips = [
      trip('2026-01-10', '2026-01-12'), // 3 days
      trip('2026-01-20', '2026-01-22'), // 3 days
    ];
    const windowStart = parseISO('2026-01-01');
    const windowEnd = parseISO('2026-01-31');
    expect(countDaysInWindow(trips, windowStart, windowEnd)).toBe(6);
  });

  it('returns 0 when no trips overlap the window', () => {
    const trips = [trip('2025-06-01', '2025-06-10')];
    const windowStart = parseISO('2026-01-01');
    const windowEnd = parseISO('2026-01-31');
    expect(countDaysInWindow(trips, windowStart, windowEnd)).toBe(0);
  });

  it('counts a single-day trip as 1 day', () => {
    const trips = [trip('2026-01-15', '2026-01-15')];
    const windowStart = parseISO('2026-01-01');
    const windowEnd = parseISO('2026-01-31');
    expect(countDaysInWindow(trips, windowStart, windowEnd)).toBe(1);
  });
});

describe('getSchengenStatus', () => {
  it('shows 90 days remaining with no trips', () => {
    const status = getSchengenStatus([], new Date('2026-03-01'));
    expect(status.daysRemaining).toBe(90);
    expect(status.daysUsed).toBe(0);
    expect(status.isOverstay).toBe(false);
    expect(status.currentTrip).toBeNull();
  });

  it('correctly calculates days used', () => {
    const trips = [trip('2026-02-01', '2026-02-10')]; // 10 days
    const status = getSchengenStatus(trips, new Date('2026-03-01'));
    expect(status.daysUsed).toBe(10);
    expect(status.daysRemaining).toBe(80);
    expect(status.isOverstay).toBe(false);
  });

  it('detects an active trip', () => {
    const trips = [trip('2026-02-25', '2026-03-10', 'Berlin visit')];
    const status = getSchengenStatus(trips, new Date('2026-03-01'));
    expect(status.currentTrip).not.toBeNull();
    expect(status.currentTrip?.note).toBe('Berlin visit');
  });

  it('detects overstay', () => {
    // Trip of 91 days entirely within the 180-day window
    const trips = [trip('2025-12-01', '2026-03-01')]; // 92 days
    const status = getSchengenStatus(trips, new Date('2026-03-01'));
    expect(status.daysUsed).toBeGreaterThan(90);
    expect(status.isOverstay).toBe(true);
    expect(status.daysRemaining).toBe(0);
  });

  it('handles trips that partially fall outside the 180-day window', () => {
    // Reference: 2026-03-01
    // 180-day window: 2025-09-03 to 2026-03-01
    // Trip: 2025-08-01 to 2025-09-10
    // Only 2025-09-03 to 2025-09-10 is within window = 8 days
    const trips = [trip('2025-08-01', '2025-09-10')];
    const status = getSchengenStatus(trips, new Date('2026-03-01'));
    expect(status.daysUsed).toBe(8);
    expect(status.daysRemaining).toBe(82);
  });
});

describe('getResetSchedule', () => {
  it('returns empty for no trips', () => {
    const events = getResetSchedule([], new Date('2026-03-01'));
    expect(events).toEqual([]);
  });

  it('returns reset events for trips in the window', () => {
    const trips = [trip('2026-01-15', '2026-01-20')]; // 6 days
    const events = getResetSchedule(trips, new Date('2026-03-01'));
    expect(events.length).toBeGreaterThan(0);
    // The first day (Jan 15) falls off at Jan 15 + 180 = Jul 14
    expect(events[0].date).toBe('2026-07-14');
  });

  it('shows cumulative days available increasing', () => {
    const trips = [trip('2026-01-15', '2026-01-20')]; // 6 days
    const events = getResetSchedule(trips, new Date('2026-03-01'));

    // Each subsequent event should have equal or more days available
    for (let i = 1; i < events.length; i++) {
      expect(events[i].cumulativeDaysAvailable).toBeGreaterThanOrEqual(
        events[i - 1].cumulativeDaysAvailable
      );
    }
  });
});

describe('planTrip', () => {
  it('allows entry with no previous trips', () => {
    const result = planTrip([], new Date('2026-03-15'));
    expect(result.canStay).toBe(true);
    expect(result.maxConsecutiveDays).toBe(90);
    expect(result.daysAvailableOnArrival).toBe(90);
  });

  it('correctly limits stay based on previous trips', () => {
    // Used 80 days, 10 remaining
    const trips = [trip('2026-01-01', '2026-02-19')]; // 50 days
    const result = planTrip(trips, new Date('2026-03-01'));
    expect(result.canStay).toBe(true);
    expect(result.maxConsecutiveDays).toBe(40);
    expect(result.daysAvailableOnArrival).toBe(40);
  });

  it('denies entry when all days are used', () => {
    const trips = [trip('2025-12-02', '2026-03-01')]; // 90 days
    const result = planTrip(trips, new Date('2026-03-02'));
    expect(result.canStay).toBe(false);
    expect(result.maxConsecutiveDays).toBe(0);
  });
});

describe('findNextEntryDate', () => {
  it('returns today if enough days are available', () => {
    const result = findNextEntryDate([], 30, new Date('2026-03-01'));
    expect(result).toBe('2026-03-01');
  });

  it('finds a future date when days are not currently available', () => {
    // Use all 90 days, ending today
    const trips = [trip('2025-12-02', '2026-03-01')];
    const result = findNextEntryDate(trips, 1, new Date('2026-03-01'));
    expect(result).not.toBeNull();
    // Should be after today
    expect(result! > '2026-03-01').toBe(true);
  });
});

describe('getDayStatuses', () => {
  it('marks days correctly', () => {
    const trips = [trip('2026-01-05', '2026-01-07')];
    const statuses = getDayStatuses(
      trips,
      parseISO('2026-01-01'),
      parseISO('2026-01-10')
    );
    expect(statuses.length).toBe(10);
    expect(statuses[0].inSchengen).toBe(false); // Jan 1
    expect(statuses[4].inSchengen).toBe(true);  // Jan 5
    expect(statuses[5].inSchengen).toBe(true);  // Jan 6
    expect(statuses[6].inSchengen).toBe(true);  // Jan 7
    expect(statuses[7].inSchengen).toBe(false); // Jan 8
  });
});

describe('validateTrips', () => {
  it('returns no errors for non-overlapping trips', () => {
    const trips = [
      trip('2026-01-01', '2026-01-10'),
      trip('2026-01-11', '2026-01-20'),
    ];
    expect(validateTrips(trips)).toEqual([]);
  });

  it('detects overlapping trips', () => {
    const trips = [
      trip('2026-01-01', '2026-01-15'),
      trip('2026-01-10', '2026-01-20'),
    ];
    expect(validateTrips(trips).length).toBeGreaterThan(0);
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
