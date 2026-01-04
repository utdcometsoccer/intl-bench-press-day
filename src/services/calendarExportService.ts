/**
 * Calendar Export Service
 * 
 * This service provides functionality to export workout schedules to various calendar formats:
 * - ICS (iCalendar) files for download
 * - Google Calendar add URLs
 * - Outlook Calendar add URLs
 * - Apple Calendar compatible ICS files
 * 
 * All exports include workout details, times, and locations (if available).
 */

import type { WorkoutSchedule, FiveThreeOneCycle, FiveThreeOneWorkout } from '../types';
import { format } from 'date-fns';

/**
 * Generate a unique identifier for calendar events
 */
function generateUID(scheduleId: string): string {
  return `${scheduleId}@intl-bench-press-day.app`;
}

/**
 * Format a date for iCalendar format in UTC (YYYYMMDDTHHMMSSZ)
 * Uses UTC to avoid timezone ambiguity per RFC 5545
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Parse time string (HH:mm) and combine with date
 */
function parseDateWithTime(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * Escape special characters for iCalendar text fields
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Fold long lines according to RFC 5545 (max 75 octets per line)
 * Lines are broken and continued with a space prefix
 */
function foldLine(line: string): string {
  if (line.length <= 75) {
    return line;
  }
  
  const result: string[] = [];
  let currentPos = 0;
  
  // First line can be 75 characters
  result.push(line.substring(0, 75));
  currentPos = 75;
  
  // Continuation lines can be 74 characters (accounting for leading space)
  while (currentPos < line.length) {
    result.push(' ' + line.substring(currentPos, currentPos + 74));
    currentPos += 74;
  }
  
  return result.join('\r\n');
}

/**
 * Generate workout description for calendar event
 */
function generateWorkoutDescription(workout: FiveThreeOneWorkout): string {
  const lines: string[] = [
    `Exercise: ${workout.exerciseName}`,
    `Week ${workout.week}, Day ${workout.day}`,
    '',
    'Main Sets:'
  ];

  workout.mainSets.forEach((set, index) => {
    const amrap = set.isAmrap ? ' (AMRAP)' : '';
    lines.push(`  ${index + 1}. ${set.reps} reps @ ${set.percentage}% (${set.weight}lbs)${amrap}`);
  });

  if (workout.warmupSets && workout.warmupSets.length > 0) {
    lines.push('', 'Warmup Sets:');
    workout.warmupSets.forEach((set, index) => {
      lines.push(`  ${index + 1}. ${set.reps} reps @ ${set.percentage}% (${set.weight}lbs)`);
    });
  }

  if (workout.assistanceExercises && workout.assistanceExercises.length > 0) {
    lines.push('', 'Assistance Work:');
    workout.assistanceExercises.forEach(exercise => {
      lines.push(`  - ${exercise}`);
    });
  }

  return lines.join('\n');
}

/**
 * Generate ICS file content for a single workout schedule
 */
export function generateICSEvent(
  schedule: WorkoutSchedule,
  workout: FiveThreeOneWorkout | null,
  cycleName?: string
): string {
  const startDate = parseDateWithTime(schedule.scheduledDate, schedule.scheduledTime);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  const now = new Date();

  const summary = workout 
    ? `${workout.exerciseName} - Week ${workout.week} Day ${workout.day}`
    : 'Workout Session';
  
  const description = workout 
    ? generateWorkoutDescription(workout)
    : 'Scheduled workout session';

  const location = cycleName ? `${cycleName} Training` : 'Gym';

  const lines = [
    'BEGIN:VEVENT',
    `UID:${generateUID(schedule.id)}`,
    foldLine(`DTSTAMP:${formatICalDate(now)}`),
    foldLine(`DTSTART:${formatICalDate(startDate)}`),
    foldLine(`DTEND:${formatICalDate(endDate)}`),
    foldLine(`SUMMARY:${escapeICalText(summary)}`),
    foldLine(`DESCRIPTION:${escapeICalText(description)}`),
    foldLine(`LOCATION:${escapeICalText(location)}`),
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT'
  ];

  return lines.join('\r\n');
}

/**
 * Generate complete ICS file for multiple workout schedules
 */
export function generateICSFile(
  schedules: WorkoutSchedule[],
  cycle: FiveThreeOneCycle | null
): string {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//International Bench Press Day//Workout Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Workout Schedule',
    'X-WR-CALDESC:5/3/1 Workout Schedule'
  ];

  const events = schedules.map(schedule => {
    const workout = cycle?.workouts.find(w => w.id === schedule.workoutId) || null;
    return generateICSEvent(schedule, workout, cycle?.name);
  });

  const footer = ['END:VCALENDAR'];

  return [...header, ...events, ...footer].join('\r\n');
}

/**
 * Download ICS file to user's device
 */
export function downloadICSFile(content: string, filename: string = 'workout-schedule.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar add URL for a single workout
 */
export function generateGoogleCalendarURL(
  schedule: WorkoutSchedule,
  workout: FiveThreeOneWorkout | null,
  cycleName?: string
): string {
  const startDate = parseDateWithTime(schedule.scheduledDate, schedule.scheduledTime);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const title = workout 
    ? `${workout.exerciseName} - Week ${workout.week} Day ${workout.day}`
    : 'Workout Session';
  
  const description = workout 
    ? generateWorkoutDescription(workout)
    : 'Scheduled workout session';

  const location = cycleName ? `${cycleName} Training` : 'Gym';

  // Google Calendar date format: YYYYMMDDTHHmmss
  const startStr = format(startDate, "yyyyMMdd'T'HHmmss");
  const endStr = format(endDate, "yyyyMMdd'T'HHmmss");

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: description,
    location: location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar add URL for a single workout
 */
export function generateOutlookCalendarURL(
  schedule: WorkoutSchedule,
  workout: FiveThreeOneWorkout | null,
  cycleName?: string
): string {
  const startDate = parseDateWithTime(schedule.scheduledDate, schedule.scheduledTime);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const title = workout 
    ? `${workout.exerciseName} - Week ${workout.week} Day ${workout.day}`
    : 'Workout Session';
  
  const description = workout 
    ? generateWorkoutDescription(workout)
    : 'Scheduled workout session';

  const location = cycleName ? `${cycleName} Training` : 'Gym';

  // Outlook uses ISO 8601 format
  const startStr = startDate.toISOString();
  const endStr = endDate.toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: startStr,
    enddt: endStr,
    body: description,
    location: location
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Export options interface
 */
export interface CalendarExportOptions {
  format: 'ics' | 'google' | 'outlook';
  schedules: WorkoutSchedule[];
  cycle: FiveThreeOneCycle | null;
  filename?: string;
}

/**
 * Main export function that handles all formats
 */
export function exportToCalendar(options: CalendarExportOptions): string | void {
  const { format, schedules, cycle, filename } = options;

  switch (format) {
    case 'ics': {
      const content = generateICSFile(schedules, cycle);
      downloadICSFile(content, filename);
      return;
    }
    case 'google': {
      // For multiple events, we'll open them sequentially
      // In practice, users typically export all at once via ICS
      if (schedules.length > 0) {
        const workout = cycle?.workouts.find(w => w.id === schedules[0].workoutId) || null;
        return generateGoogleCalendarURL(schedules[0], workout, cycle?.name);
      }
      return '';
    }
    case 'outlook': {
      // Same approach as Google Calendar
      if (schedules.length > 0) {
        const workout = cycle?.workouts.find(w => w.id === schedules[0].workoutId) || null;
        return generateOutlookCalendarURL(schedules[0], workout, cycle?.name);
      }
      return '';
    }
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
