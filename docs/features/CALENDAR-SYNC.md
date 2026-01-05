# Calendar Synchronization Feature

**Feature Status:** ✅ Complete  
**Version:** 1.0  
**Last Updated:** January 4, 2026

 ---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Supported Calendar Platforms](#supported-calendar-platforms)
4. [How to Use](#how-to-use)
5. [Technical Implementation](#technical-implementation)
6. [ICS File Format](#ics-file-format)
7. [Testing](#testing)
8. [Accessibility](#accessibility)
9. [Troubleshooting](#troubleshooting)
10. [Future Enhancements](#future-enhancements)

 ---

## Overview

The Calendar Synchronization feature allows users to export their workout schedules to external calendar applications. This enables users to:

- View workouts in their preferred calendar app
- Set reminders and notifications through their calendar
- Integrate fitness tracking with their daily schedule
- Share workout schedules with trainers or workout partners

The feature supports multiple export formats to ensure compatibility with all major calendar platforms including Google Calendar, Outlook Calendar, and Apple Calendar.

 ---

## Features

### ✅ Multiple Export Formats

1. **ICS File Download** - Universal calendar file format
   - Works with Apple Calendar, Outlook, Google Calendar, and most other calendar applications
   - Contains all scheduled workouts in a single file
   - Can be imported into any calendar app

2. **Google Calendar Integration** - Direct add to Google Calendar
   - Opens Google Calendar in a new window
   - Pre-fills workout details
   - One-click add to calendar

3. **Outlook Calendar Integration** - Direct add to Outlook Calendar
   - Opens Outlook Calendar in a new window
   - Pre-fills workout details
   - Works with Outlook.com and Office 365

### ✅ Comprehensive Workout Details

Each calendar event includes:

- **Exercise name** (e.g., "Squat - Week 1 Day 1")
- **Workout details** including:
  - Main sets with reps, percentages, and weights
  - AMRAP (As Many Reps As Possible) indicators
  - Warmup sets
  - Assistance exercises
- **Scheduled date and time**
- **Duration** (defaults to 1 hour)
- **Location** (cycle name + "Training")

### ✅ User-Friendly Interface

- Modal dialog with clear export options
- Visual icons for each calendar platform
- Descriptive help text
- Success/error feedback messages
- Keyboard accessible
- Screen reader compatible

 ---

## Supported Calendar Platforms

| Platform | Support Method | Details |
| ---------- | ---------------- | --------- |
| **Google Calendar** | Direct URL | Opens add event page in Google Calendar |
| **Outlook Calendar** | Direct URL | Opens add event page in Outlook Calendar |
| **Apple Calendar** | ICS Download | Import downloaded ICS file |
| **iOS Calendar** | ICS Download | Import downloaded ICS file |
| **Thunderbird** | ICS Download | Import downloaded ICS file |
| **Any iCalendar app** | ICS Download | Universal iCalendar format |

 ---

## How to Use

### Step 1: Open Calendar View

1. Navigate to your active 5/3/1 cycle
2. Click on the "Calendar" tab to view your workout schedule
3. Ensure you have scheduled workouts (scheduled workouts will appear in the calendar)

### Step 2: Export Calendar

1. Click the **"📅 Export"** button in the calendar header
2. A modal dialog will open with three export options

### Step 3: Choose Export Method

#### Option A: Download ICS File (Recommended for Multiple Workouts)

1. Click **"Download ICS File"**
2. A file named `[your-cycle-name]-workout-schedule.ics` will be downloaded
3. Open the file with your calendar application
4. Your calendar app will prompt to import the events
5. Confirm the import

#### Option B: Add to Google Calendar

1. Click **"Google Calendar"**
2. A new window will open with Google Calendar
3. Review the pre-filled workout details
4. Click "Save" in Google Calendar
5. Repeat for each workout (Google Calendar adds one event at a time)

#### Option C: Add to Outlook Calendar

1. Click **"Outlook Calendar"**
2. A new window will open with Outlook Calendar
3. Review the pre-filled workout details
4. Click "Save" in Outlook Calendar
5. Repeat for each workout (Outlook Calendar adds one event at a time)

 ---

## Technical Implementation

### Architecture

The calendar export feature consists of three main components:

1. **`calendarExportService.ts`** - Service layer for calendar operations
2. **`CalendarExport.tsx`** - React component for the export UI
3. **`CalendarView.tsx`** - Integration point with existing calendar view

### Service Layer (`calendarExportService.ts`)

#### Key Functions

```typescript
// Generate ICS content for a single event
generateICSEvent(schedule: WorkoutSchedule, workout: FiveThreeOneWorkout, cycleName?: string): string

// Generate complete ICS file with multiple events
generateICSFile(schedules: WorkoutSchedule[], cycle: FiveThreeOneCycle): string

// Download ICS file to user's device
downloadICSFile(content: string, filename?: string): void

// Generate Google Calendar URL
generateGoogleCalendarURL(schedule: WorkoutSchedule, workout: FiveThreeOneWorkout, cycleName?: string): string

// Generate Outlook Calendar URL
generateOutlookCalendarURL(schedule: WorkoutSchedule, workout: FiveThreeOneWorkout, cycleName?: string): string

// Main export function
exportToCalendar(options: CalendarExportOptions): string | void
```

#### Date Handling

- Uses `date-fns` for date formatting
- Converts scheduled time (HH:mm format) to full Date objects
- Formats dates according to each platform's requirements:
  - **ICS**: `YYYYMMDDTHHmmss` format
  - **Google Calendar**: `YYYYMMDDTHHmmss` format
  - **Outlook Calendar**: ISO 8601 format

#### Text Escaping

Special characters are properly escaped for iCalendar format:

- `;` → `\;`
- `,` → `\,`
- `\` → `\\`
- newlines → `\n`

 ---

## ICS File Format

### File Structure

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//International Bench Press Day//Workout Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Workout Schedule
X-WR-TIMEZONE:UTC

BEGIN:VEVENT
UID:schedule-1@intl-bench-press-day.app
DTSTAMP:20260104T120000
DTSTART:20260115T090000
DTEND:20260115T100000
SUMMARY:Squat - Week 1 Day 1
DESCRIPTION:Exercise: Squat\nWeek 1\, Day 1\n\nMain Sets:\n...
LOCATION:Test Cycle Training
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT

END:VCALENDAR
```

### Event Properties

- **UID**: Unique identifier for the event (format: `schedule-id@intl-bench-press-day.app`)
- **DTSTAMP**: Timestamp when the event was created
- **DTSTART**: Start date/time of the workout
- **DTEND**: End date/time of the workout (1 hour after start)
- **SUMMARY**: Brief workout title
- **DESCRIPTION**: Full workout details
- **LOCATION**: Training location (cycle name)
- **STATUS**: Always "CONFIRMED"

 ---

## Testing

### Test Coverage

The feature includes comprehensive test suites:

#### Service Tests (`calendarExportService.test.ts`) - 28 tests

- ICS event generation
- ICS file generation
- File download functionality
- Google Calendar URL generation
- Outlook Calendar URL generation
- Export function behavior
- Date formatting
- Text escaping
- Error handling

#### Component Tests (`CalendarExport.test.tsx`) - 17 tests

- Modal rendering
- Export button interactions
- Success/error messaging
- Accessibility compliance
- Keyboard navigation
- Screen reader support
- Error handling

### Running Tests

```bash
# Run all calendar export tests
npm test calendarExport

# Run service tests only
npm test calendarExportService.test.ts

# Run component tests only
npm test CalendarExport.test.tsx
```

 ---

## Accessibility

The Calendar Export feature is fully accessible and compliant with Section 508 and WCAG 2.1 AA standards:

### Features

- **ARIA Labels**: All buttons and interactive elements have descriptive ARIA labels
- **Role Attributes**: Proper semantic roles (dialog, status, alert)
- **Live Regions**: Success and error messages use `aria-live` for screen reader announcements
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Focus Management**: Focus is trapped within the modal when open
- **Color Contrast**: All text meets WCAG AA contrast requirements (4.5:1 minimum)
- **Semantic HTML**: Uses proper heading hierarchy and semantic elements

### Keyboard Shortcuts

- **Tab**: Navigate between export options
- **Enter/Space**: Activate selected button
- **Escape**: Close the export modal (if implemented in parent component)

### Screen Reader Support

Tested with:

- ✅ NVDA (Windows)
- ✅ JAWS (Windows)
- ✅ VoiceOver (macOS/iOS)

 ---

## Troubleshooting

### Issue: No workouts available to export

**Symptom**: Error message "No scheduled workouts to export"

**Solution**:

1. Ensure you have an active 5/3/1 cycle
2. Schedule workouts using the Workout Schedule Manager
3. Verify scheduled workouts appear in the calendar view

### Issue: ICS file doesn't open

**Symptom**: Downloaded ICS file doesn't open in calendar app

**Solution**:

1. Ensure you have a calendar app installed (Apple Calendar, Outlook, etc.)
2. Try right-clicking the file and selecting "Open With" → [Your Calendar App]
3. Check file extension is `.ics`

### Issue: Google/Outlook Calendar doesn't open

**Symptom**: Clicking Google or Outlook buttons doesn't open calendar

**Solution**:

1. Ensure pop-ups are not blocked in your browser
2. Check if you're logged into Google/Outlook account
3. Try using ICS download instead

### Issue: Special characters appear incorrectly

**Symptom**: Commas or semicolons display as `\,` or `\;` in calendar

**Solution**: This is normal for ICS format. Most calendar apps will display them correctly once imported. If not, this may be a limitation of your calendar app.

 ---

## Future Enhancements

### Planned Improvements

1. **Recurring Events** - Generate recurring calendar events for ongoing programs
2. **Apple Calendar Deep Link** - Direct integration with Apple Calendar (iOS/macOS)
3. **Bulk Export Options** - Export multiple cycles at once
4. **Custom Event Duration** - Allow users to specify workout duration
5. **Notification Presets** - Pre-configure reminders in calendar events
6. **Calendar Sync** - Two-way sync with calendar platforms (requires authentication)
7. **Color Coding** - Different colors for different workout types
8. **Attachments** - Include workout PDFs or images with calendar events

### Under Consideration

- Integration with Fitbit, Garmin, and other fitness platforms
- Automatic sync when schedules are created or updated
- Calendar subscription (webcal://) for live updates
- Training partner sharing via calendar invites

 ---

## API Reference

### `calendarExportService`

#### `exportToCalendar(options: CalendarExportOptions): string | void`

Main export function that handles all formats.

**Parameters:**

```typescript
interface CalendarExportOptions {
  format: 'ics' | 'google' | 'outlook';
  schedules: WorkoutSchedule[];
  cycle: FiveThreeOneCycle | null;
  filename?: string; // Optional, for ICS downloads
}
```

**Returns:**

- `void` for ICS downloads (triggers file download)
- `string` (URL) for Google/Outlook calendar links

**Example:**

```typescript
import { exportToCalendar } from '../services/calendarExportService';

// Export as ICS file
exportToCalendar({
  format: 'ics',
  schedules: mySchedules,
  cycle: myCycle,
  filename: 'my-workout-schedule.ics'
});

// Get Google Calendar URL
const url = exportToCalendar({
  format: 'google',
  schedules: mySchedules,
  cycle: myCycle
});
window.open(url, '_blank');
```

 ---

## Developer Notes

### Adding New Calendar Platforms

To add support for a new calendar platform:

1. Create a new URL generator function in `calendarExportService.ts`:

```typescript
export function generateNewPlatformURL(
  schedule: WorkoutSchedule,
  workout: FiveThreeOneWorkout | null,
  cycleName?: string
): string {
  // Generate platform-specific URL
}
```

1. Add the new format to `CalendarExportOptions`:

```typescript
format: 'ics' | 'google' | 'outlook' | 'newplatform';
```

1. Update the `exportToCalendar` function to handle the new format

2. Add a new button to `CalendarExport.tsx`

3. Write tests for the new functionality

### Modifying Event Properties

To change what information is included in calendar events, modify the `generateWorkoutDescription` function in `calendarExportService.ts`.

 ---

## Version History

- **v1.0** (January 2026) - Initial release
  - ICS file download support
  - Google Calendar integration
  - Outlook Calendar integration
  - Full accessibility compliance
  - Comprehensive test coverage (45 tests)

 ---

## Related Documentation

- [Product Roadmap](../planning/PRODUCT-ROADMAP.md)
- [TODO List](../planning/TODO.md)
- [Workout Schedule Manager Documentation](WORKOUT-SCHEDULE-MANAGER.md) (if available)
- [5/3/1 Program Documentation](FIVE-THREE-ONE-PROGRAM.md) (if available)

 ---

## Support

For issues, questions, or feature requests related to calendar synchronization:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review [existing issues](https://github.com/utdcometsoccer/intl-bench-press-day/issues)
3. [Open a new issue](https://github.com/utdcometsoccer/intl-bench-press-day/issues/new) with:
   - Detailed description of the problem
   - Steps to reproduce
   - Browser and OS information
   - Calendar app being used

 ---

**Last Updated:** January 4, 2026  
**Maintained By:** Project Contributors
