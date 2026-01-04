import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarExport from '../components/CalendarExport';
import type { FiveThreeOneCycle, WorkoutSchedule } from '../types';
import * as calendarExportService from '../services/calendarExportService';

describe('CalendarExport', () => {
  const mockWorkout = {
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

  const mockCycle: FiveThreeOneCycle = {
    id: 'cycle-1',
    name: 'Test Cycle',
    startDate: new Date('2025-01-01'),
    createdDate: new Date('2024-12-20'),
    maxes: [],
    workouts: [mockWorkout],
    isActive: true
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

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.open
    vi.stubGlobal('open', vi.fn());
  });

  it('should render calendar export modal', () => {
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Export Workout Calendar')).toBeInTheDocument();
    expect(screen.getByText(/You have 1 scheduled workout/)).toBeInTheDocument();
  });

  it('should display correct plural text for multiple schedules', () => {
    const schedule2 = { ...mockSchedule, id: 'schedule-2' };
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule, schedule2]}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/You have 2 scheduled workouts/)).toBeInTheDocument();
  });

  it('should render all export options', () => {
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Download ICS File')).toBeInTheDocument();
    expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Outlook Calendar')).toBeInTheDocument();
  });

  it('should have proper ARIA labels', () => {
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'calendar-export-title');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'calendar-export-description');
    expect(screen.getByLabelText('Close calendar export dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Download ICS calendar file/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Add workout to Google Calendar/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Add workout to Outlook Calendar/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close calendar export dialog');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', () => {
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not close when modal content is clicked', () => {
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    const modal = screen.getByRole('dialog');
    fireEvent.click(modal);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should export ICS file when Download ICS button is clicked', async () => {
    const exportSpy = vi.spyOn(calendarExportService, 'exportToCalendar').mockReturnValue(undefined);

    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    const icsButton = screen.getByText('Download ICS File').closest('button');
    if (icsButton) {
      fireEvent.click(icsButton);

      await waitFor(() => {
        expect(exportSpy).toHaveBeenCalledWith({
          format: 'ics',
          schedules: [mockSchedule],
          cycle: mockCycle,
          filename: 'test-cycle-workout-schedule.ics'
        });
      });

      expect(screen.getByText('✓ Calendar export successful!')).toBeInTheDocument();
    }
  });

  it('should open Google Calendar when Google Calendar button is clicked', async () => {
    const mockUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    vi.spyOn(calendarExportService, 'generateGoogleCalendarURL').mockReturnValue(mockUrl);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    const googleButton = screen.getByText('Google Calendar').closest('button');
    if (googleButton) {
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith(mockUrl, '_blank', 'noopener,noreferrer');
      });

      expect(screen.getByText('✓ Calendar export successful!')).toBeInTheDocument();
    }
  });

  it('should open Outlook Calendar when Outlook Calendar button is clicked', async () => {
    const mockUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
    vi.spyOn(calendarExportService, 'generateOutlookCalendarURL').mockReturnValue(mockUrl);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    const outlookButton = screen.getByText('Outlook Calendar').closest('button');
    if (outlookButton) {
      fireEvent.click(outlookButton);

      await waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith(mockUrl, '_blank', 'noopener,noreferrer');
      });

      expect(screen.getByText('✓ Calendar export successful!')).toBeInTheDocument();
    }
  });

  it('should show error when no schedules are available', async () => {
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[]}
        onClose={mockOnClose}
      />
    );

    const icsButton = screen.getByText('Download ICS File').closest('button');
    if (icsButton) {
      fireEvent.click(icsButton);

      await waitFor(() => {
        expect(screen.getByText('⚠ No scheduled workouts to export')).toBeInTheDocument();
      });
    }
  });

  it('should handle export errors gracefully', async () => {
    const errorMessage = 'Export failed';
    vi.spyOn(calendarExportService, 'exportToCalendar').mockImplementation(() => {
      throw new Error(errorMessage);
    });

    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    const icsButton = screen.getByText('Download ICS File').closest('button');
    if (icsButton) {
      fireEvent.click(icsButton);

      await waitFor(() => {
        expect(screen.getByText(`⚠ ${errorMessage}`)).toBeInTheDocument();
      });
    }
  });

  it('should display informational content', () => {
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('About Calendar Export')).toBeInTheDocument();
    expect(screen.getByText(/ICS File:/)).toBeInTheDocument();
    expect(screen.getByText(/Google Calendar:/)).toBeInTheDocument();
    expect(screen.getByText(/Outlook Calendar:/)).toBeInTheDocument();
  });

  it('should have keyboard navigation support', () => {
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('should display success message with proper role', async () => {
    vi.spyOn(calendarExportService, 'exportToCalendar').mockReturnValue(undefined);

    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    const icsButton = screen.getByText('Download ICS File').closest('button');
    if (icsButton) {
      fireEvent.click(icsButton);

      await waitFor(() => {
        const successMessage = screen.getByRole('status');
        expect(successMessage).toHaveAttribute('aria-live', 'polite');
        expect(successMessage).toHaveTextContent('✓ Calendar export successful!');
      });
    }
  });

  it('should display error message with proper role', async () => {
    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[]}
        onClose={mockOnClose}
      />
    );

    const icsButton = screen.getByText('Download ICS File').closest('button');
    if (icsButton) {
      fireEvent.click(icsButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
        expect(errorMessage).toHaveTextContent('⚠ No scheduled workouts to export');
      });
    }
  });

  it('should clear status messages between exports', async () => {
    vi.spyOn(calendarExportService, 'exportToCalendar').mockReturnValue(undefined);

    render(
      <CalendarExport
        cycle={mockCycle}
        schedules={[mockSchedule]}
        onClose={mockOnClose}
      />
    );

    const icsButton = screen.getByText('Download ICS File').closest('button');
    if (icsButton) {
      // First export
      fireEvent.click(icsButton);
      await waitFor(() => {
        expect(screen.getByText('✓ Calendar export successful!')).toBeInTheDocument();
      });

      // Second export
      fireEvent.click(icsButton);
      // Status should be cleared initially before showing success again
      await waitFor(() => {
        expect(screen.getByText('✓ Calendar export successful!')).toBeInTheDocument();
      });
    }
  });
});
