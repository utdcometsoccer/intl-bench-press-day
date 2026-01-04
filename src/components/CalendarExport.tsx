import { type FC, useState, useEffect, useRef } from 'react';
import type { FiveThreeOneCycle, WorkoutSchedule } from '../types';
import { exportToCalendar, generateGoogleCalendarURL, generateOutlookCalendarURL } from '../services/calendarExportService';
import './CalendarExport.css';

interface CalendarExportProps {
  cycle: FiveThreeOneCycle;
  schedules: WorkoutSchedule[];
  onClose: () => void;
}

const CalendarExport: FC<CalendarExportProps> = ({ cycle, schedules, onClose }) => {
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management: save previous focus and set focus on modal
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Focus the modal on mount
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Restore focus on unmount
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  const handleExport = (format: 'ics' | 'google' | 'outlook') => {
    try {
      setExportStatus('idle');
      setErrorMessage('');

      if (schedules.length === 0) {
        setErrorMessage('No scheduled workouts to export');
        setExportStatus('error');
        return;
      }

      if (format === 'ics') {
        exportToCalendar({
          format: 'ics',
          schedules,
          cycle,
          filename: `${cycle.name.replace(/\s+/g, '-').toLowerCase()}-workout-schedule.ics`
        });
        setExportStatus('success');
      } else if (format === 'google') {
        const workout = cycle.workouts.find(w => w.id === schedules[0].workoutId) || null;
        const url = generateGoogleCalendarURL(schedules[0], workout, cycle.name);
        window.open(url, '_blank', 'noopener,noreferrer');
        setExportStatus('success');
      } else if (format === 'outlook') {
        const workout = cycle.workouts.find(w => w.id === schedules[0].workoutId) || null;
        const url = generateOutlookCalendarURL(schedules[0], workout, cycle.name);
        window.open(url, '_blank', 'noopener,noreferrer');
        setExportStatus('success');
      }
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to export calendar');
      setExportStatus('error');
    }
  };

  return (
    <div className="calendar-export-overlay" onClick={onClose}>
      <div 
        ref={modalRef}
        className="calendar-export-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-export-title"
        aria-describedby="calendar-export-description"
        tabIndex={-1}
      >
        <div className="calendar-export-header">
          <h2 id="calendar-export-title">Export Workout Calendar</h2>
          <button
            className="calendar-export-close"
            onClick={onClose}
            aria-label="Close calendar export dialog"
          >
            ×
          </button>
        </div>

        <div className="calendar-export-content">
          <p id="calendar-export-description">
            Export your workout schedule to your preferred calendar application.
            {schedules.length > 0 && ` You have ${schedules.length} scheduled workout${schedules.length === 1 ? '' : 's'}.`}
          </p>

          <div className="calendar-export-options">
            <button
              className="calendar-export-button ics-button"
              onClick={() => handleExport('ics')}
              aria-label="Download ICS calendar file compatible with all calendar applications"
            >
              <span className="export-icon">📅</span>
              <div className="export-text">
                <strong>Download ICS File</strong>
                <small>Works with all calendar apps (Apple Calendar, Outlook, Google Calendar)</small>
              </div>
            </button>

            <button
              className="calendar-export-button google-button"
              onClick={() => handleExport('google')}
              aria-label="Add workout to Google Calendar"
            >
              <span className="export-icon">🗓️</span>
              <div className="export-text">
                <strong>Google Calendar</strong>
                <small>Opens Google Calendar to add event</small>
              </div>
            </button>

            <button
              className="calendar-export-button outlook-button"
              onClick={() => handleExport('outlook')}
              aria-label="Add workout to Outlook Calendar"
            >
              <span className="export-icon">📆</span>
              <div className="export-text">
                <strong>Outlook Calendar</strong>
                <small>Opens Outlook Calendar to add event</small>
              </div>
            </button>
          </div>

          {exportStatus === 'success' && (
            <div className="export-status export-success" role="status" aria-live="polite">
              ✓ Calendar export successful!
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="export-status export-error" role="alert" aria-live="assertive">
              ⚠ {errorMessage}
            </div>
          )}

          <div className="calendar-export-info">
            <h3>About Calendar Export</h3>
            <ul>
              <li><strong>ICS File:</strong> Download a calendar file that works with any calendar application. Import it into Apple Calendar, Outlook, Google Calendar, or any other calendar app.</li>
              <li><strong>Google Calendar:</strong> Opens a new window to add the workout directly to your Google Calendar account.</li>
              <li><strong>Outlook Calendar:</strong> Opens a new window to add the workout directly to your Outlook Calendar account.</li>
            </ul>
            <p className="calendar-export-note">
              <strong>Note:</strong> Google and Outlook options add events one at a time. 
              For multiple workouts, use the ICS file download option.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarExport;
