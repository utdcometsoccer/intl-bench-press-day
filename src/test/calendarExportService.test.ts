import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateICSEvent,
  generateICSFile,
  downloadICSFile,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL,
  exportToCalendar
} from '../services/calendarExportService';
import type { WorkoutSchedule, FiveThreeOneCycle, FiveThreeOneWorkout } from '../types';

describe('calendarExportService', () => {
  // Mock data
  const mockWorkout: FiveThreeOneWorkout = {
    id: 'workout-1',
    week: 1,
    day: 1,
    exerciseId: 'squat',
    exerciseName: 'Squat',
    mainSets: [
      { reps: 5, percentage: 65, weight: 195, isAmrap: false },
      { reps: 5, percentage: 75, weight: 225, isAmrap: false },
      { reps: 5, percentage: 85, weight: 255, isAmrap: true }
    ],
    warmupSets: [
      { reps: 5, percentage: 40, weight: 120 },
      { reps: 5, percentage: 50, weight: 150 }
    ],
    assistanceExercises: ['Leg Press', 'Leg Curls']
  };

  const mockSchedule: WorkoutSchedule = {
    id: 'schedule-1',
    cycleId: 'cycle-1',
    workoutId: 'workout-1',
    scheduledDate: new Date('2025-01-15T09:00:00'),
    scheduledTime: '09:00',
    isCompleted: false,
    notificationEnabled: true,
    notificationLeadMinutes: 30
  };

  const mockCycle: FiveThreeOneCycle = {
    id: 'cycle-1',
    name: 'Test Cycle',
    startDate: new Date('2025-01-01'),
    createdDate: new Date('2024-12-20'),
    maxes: [],
    workouts: [mockWorkout],
    isActive: true
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('generateICSEvent', () => {
    it('should generate valid ICS event with workout details', () => {
      const ics = generateICSEvent(mockSchedule, mockWorkout, 'Test Cycle');

      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('SUMMARY:Squat - Week 1 Day 1');
      expect(ics).toContain('DESCRIPTION:');
      expect(ics).toContain('Exercise: Squat');
      expect(ics).toContain('Week 1\\, Day 1'); // Escaped comma in ICS format
      expect(ics).toContain('Main Sets:');
      expect(ics).toContain('LOCATION:Test Cycle Training');
      expect(ics).toContain('STATUS:CONFIRMED');
    });

    it('should include warmup sets in description', () => {
      const ics = generateICSEvent(mockSchedule, mockWorkout);

      expect(ics).toContain('Warmup Sets:');
      expect(ics).toContain('40%');
      expect(ics).toContain('50%');
    });

    it('should include assistance exercises in description', () => {
      const ics = generateICSEvent(mockSchedule, mockWorkout);

      expect(ics).toContain('Assistance Work:');
      expect(ics).toContain('Leg Press');
      expect(ics).toContain('Leg Curls');
    });

    it('should handle schedule without workout', () => {
      const ics = generateICSEvent(mockSchedule, null);

      expect(ics).toContain('SUMMARY:Workout Session');
      expect(ics).toContain('DESCRIPTION:Scheduled workout session');
    });

    it('should properly format dates', () => {
      const ics = generateICSEvent(mockSchedule, mockWorkout);

      // Should contain properly formatted dates (YYYYMMDDTHHMMSS)
      expect(ics).toMatch(/DTSTART:\d{8}T\d{6}/);
      expect(ics).toMatch(/DTEND:\d{8}T\d{6}/);
      expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}/);
    });

    it('should generate unique UID', () => {
      const ics = generateICSEvent(mockSchedule, mockWorkout);

      expect(ics).toContain('UID:schedule-1@intl-bench-press-day.app');
    });

    it('should mark AMRAP sets correctly', () => {
      const ics = generateICSEvent(mockSchedule, mockWorkout);

      expect(ics).toContain('(AMRAP)');
    });

    it('should escape special characters in text fields', () => {
      const workoutWithSpecialChars: FiveThreeOneWorkout = {
        ...mockWorkout,
        exerciseName: 'Squat; Test, Name\nWith Special\\Chars'
      };

      const ics = generateICSEvent(mockSchedule, workoutWithSpecialChars);

      expect(ics).toContain('\\;');
      expect(ics).toContain('\\,');
      expect(ics).toContain('\\n');
      expect(ics).toContain('\\\\');
    });
  });

  describe('generateICSFile', () => {
    it('should generate valid ICS file with header and footer', () => {
      const schedules = [mockSchedule];
      const ics = generateICSFile(schedules, mockCycle);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//International Bench Press Day//Workout Calendar//EN');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('should include all scheduled events', () => {
      const schedule2: WorkoutSchedule = {
        ...mockSchedule,
        id: 'schedule-2',
        scheduledDate: new Date('2025-01-17T10:00:00'),
        scheduledTime: '10:00'
      };

      const schedules = [mockSchedule, schedule2];
      const ics = generateICSFile(schedules, mockCycle);

      const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
      expect(eventCount).toBe(2);
    });

    it('should handle empty schedules array', () => {
      const ics = generateICSFile([], mockCycle);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).not.toContain('BEGIN:VEVENT');
    });

    it('should handle null cycle', () => {
      const schedules = [mockSchedule];
      const ics = generateICSFile(schedules, null);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
    });
  });

  describe('downloadICSFile', () => {
    it('should create and trigger download', () => {
      // Mock URL.createObjectURL and URL.revokeObjectURL which don't exist in jsdom
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      // Mock DOM elements and methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      } as unknown as HTMLAnchorElement;
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);

      const content = 'BEGIN:VCALENDAR\nEND:VCALENDAR';
      downloadICSFile(content, 'test.ics');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toBe('test.ics');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should use default filename if not provided', () => {
      // Mock URL methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      } as unknown as HTMLAnchorElement;
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);

      const content = 'BEGIN:VCALENDAR\nEND:VCALENDAR';
      downloadICSFile(content);

      expect(mockLink.download).toBe('workout-schedule.ics');
    });
  });

  describe('generateGoogleCalendarURL', () => {
    it('should generate valid Google Calendar URL', () => {
      const url = generateGoogleCalendarURL(mockSchedule, mockWorkout, 'Test Cycle');

      expect(url).toContain('https://calendar.google.com/calendar/render');
      expect(url).toContain('action=TEMPLATE');
      expect(url).toContain('text=Squat');
      expect(url).toContain('Week+1+Day+1');
    });

    it('should include workout details in URL', () => {
      const url = generateGoogleCalendarURL(mockSchedule, mockWorkout, 'Test Cycle');

      expect(url).toContain('details=');
      expect(url).toContain('location=Test+Cycle+Training');
    });

    it('should format dates correctly', () => {
      const url = generateGoogleCalendarURL(mockSchedule, mockWorkout);

      // Google Calendar format: YYYYMMDDTHHmmss (URL encoded as %2F for /)
      expect(url).toContain('dates=');
      expect(url).toMatch(/dates=\d{8}T\d{6}(%2F|\/)\d{8}T\d{6}/);
    });

    it('should handle schedule without workout', () => {
      const url = generateGoogleCalendarURL(mockSchedule, null);

      expect(url).toContain('text=Workout+Session');
    });
  });

  describe('generateOutlookCalendarURL', () => {
    it('should generate valid Outlook Calendar URL', () => {
      const url = generateOutlookCalendarURL(mockSchedule, mockWorkout, 'Test Cycle');

      expect(url).toContain('https://outlook.live.com/calendar/0/deeplink/compose');
      expect(url).toContain('rru=addevent');
      expect(url).toContain('subject=Squat');
    });

    it('should include workout details in URL', () => {
      const url = generateOutlookCalendarURL(mockSchedule, mockWorkout, 'Test Cycle');

      expect(url).toContain('body=');
      expect(url).toContain('location=Test+Cycle+Training');
    });

    it('should format dates in ISO format', () => {
      const url = generateOutlookCalendarURL(mockSchedule, mockWorkout);

      expect(url).toContain('startdt=');
      expect(url).toContain('enddt=');
      // ISO format includes T and Z
      expect(url).toMatch(/startdt=\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}/);
    });

    it('should handle schedule without workout', () => {
      const url = generateOutlookCalendarURL(mockSchedule, null);

      expect(url).toContain('subject=Workout+Session');
    });
  });

  describe('exportToCalendar', () => {
    it('should export ICS file for ics format', () => {
      // Mock URL methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      } as unknown as HTMLAnchorElement;
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);

      const result = exportToCalendar({
        format: 'ics',
        schedules: [mockSchedule],
        cycle: mockCycle,
        filename: 'test.ics'
      });

      expect(result).toBeUndefined();
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should return Google Calendar URL for google format', () => {
      const url = exportToCalendar({
        format: 'google',
        schedules: [mockSchedule],
        cycle: mockCycle
      });

      expect(url).toContain('https://calendar.google.com');
    });

    it('should return Outlook Calendar URL for outlook format', () => {
      const url = exportToCalendar({
        format: 'outlook',
        schedules: [mockSchedule],
        cycle: mockCycle
      });

      expect(url).toContain('https://outlook.live.com');
    });

    it('should handle empty schedules for Google Calendar', () => {
      const url = exportToCalendar({
        format: 'google',
        schedules: [],
        cycle: mockCycle
      });

      expect(url).toBe('');
    });

    it('should handle empty schedules for Outlook Calendar', () => {
      const url = exportToCalendar({
        format: 'outlook',
        schedules: [],
        cycle: mockCycle
      });

      expect(url).toBe('');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        exportToCalendar({
          format: 'invalid' as 'ics' | 'google' | 'outlook',
          schedules: [mockSchedule],
          cycle: mockCycle
        });
      }).toThrow('Unsupported export format');
    });
  });
});
