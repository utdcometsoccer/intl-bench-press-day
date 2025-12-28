import { type FC, useState, useEffect, useCallback } from 'react';
import type { FiveThreeOneCycle, WorkoutSchedule, DefaultWorkoutTimes } from '../types';
import { workoutScheduleStorage } from '../services/workoutScheduleStorage';
import { userPreferencesStorage } from '../services/userPreferencesStorage';
import { notificationService } from '../services/notificationService';
import { generateUUID } from '../utils/idGenerator';
import './WorkoutScheduleManager.css';

interface WorkoutScheduleManagerProps {
  cycle?: FiveThreeOneCycle;
}

const WorkoutScheduleManager: FC<WorkoutScheduleManagerProps> = ({ cycle }) => {
  const [schedules, setSchedules] = useState<WorkoutSchedule[]>([]);
  const [defaultTimes, setDefaultTimes] = useState<DefaultWorkoutTimes>({});
  const [notificationLeadTime, setNotificationLeadTime] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [selectedWorkout, setSelectedWorkout] = useState<string>('');
  const [enableNotification, setEnableNotification] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      await workoutScheduleStorage.initialize();
      
      // Load schedules
      if (cycle) {
        const cycleSchedules = await workoutScheduleStorage.getSchedulesForCycle(cycle.id);
        setSchedules(cycleSchedules);
      } else {
        const allSchedules = await workoutScheduleStorage.getAllSchedules();
        setSchedules(allSchedules);
      }

      // Load user preferences
      const preferences = userPreferencesStorage.getPreferences();
      setDefaultTimes(preferences.defaultWorkoutTimes || {});
      setNotificationLeadTime(preferences.notificationLeadTime || 30);
    } catch (error) {
      console.error('Failed to load workout schedules:', error);
      console.error('Failed to load workout schedules. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, [cycle]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScheduleWorkout = async () => {
    if (!selectedDate || !selectedWorkout || !cycle) {
      console.error('Please select a workout and date before scheduling.');
      return;
    }

    try {
      console.error('');
      const workout = cycle.workouts.find(w => w.id === selectedWorkout);
      if (!workout) return;

      const newSchedule: WorkoutSchedule = {
        id: generateUUID(),
        cycleId: cycle.id,
        workoutId: workout.id,
        scheduledDate: new Date(selectedDate),
        scheduledTime: selectedTime,
        isCompleted: false,
        notificationEnabled: enableNotification,
        notificationLeadMinutes: notificationLeadTime,
      };

      await workoutScheduleStorage.addSchedule(newSchedule);

      // Schedule notification if enabled
      if (enableNotification && notificationService.getPermissionStatus().granted) {
        const scheduledDateTime = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        
        // Validate time format
        if (isNaN(hours) || isNaN(minutes)) {
          console.error('Invalid time format. Please use HH:mm format (e.g., 09:00).');
          return;
        }
        
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        
        // Schedule notification before workout time
        const notificationTime = new Date(scheduledDateTime.getTime() - notificationLeadTime * 60 * 1000);
        
        // Only schedule if notification time is in the future and within setTimeout limit (24 days)
        const timeUntilNotification = notificationTime.getTime() - Date.now();
        const MAX_TIMEOUT = 24 * 24 * 60 * 60 * 1000; // 24 days in ms
        
        if (timeUntilNotification > 0 && timeUntilNotification < MAX_TIMEOUT) {
          await notificationService.scheduleNotification({
            id: `workout-${newSchedule.id}`,
            title: 'Workout Reminder 💪',
            body: `Your ${workout.exerciseName} workout is scheduled in ${notificationLeadTime} minutes!`,
            scheduledTime: notificationTime,
            workoutId: workout.id,
          });
        }
      }

      // Reload schedules
      await loadData();
      
      // Reset form
      setSelectedDate('');
      setSelectedWorkout('');
      setShowScheduleForm(false);
    } catch (error) {
      console.error('Failed to schedule workout:', error);
      console.error('Unable to schedule your workout. Please try again and check your notification permissions if the problem continues.');
    }
  };

  const handleCompleteSchedule = async (scheduleId: string) => {
    try {
      await workoutScheduleStorage.completeSchedule(scheduleId);
      await loadData();
    } catch (error) {
      console.error('Failed to complete schedule:', error);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await workoutScheduleStorage.deleteSchedule(scheduleId);
      // Cancel associated notification
      notificationService.cancelScheduledNotification(`workout-${scheduleId}`);
      await loadData();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const handleSaveDefaultTimes = () => {
    userPreferencesStorage.setDefaultWorkoutTimes(defaultTimes);
    userPreferencesStorage.setNotificationLeadTime(notificationLeadTime);
  };

  const handleDefaultTimeChange = (day: keyof DefaultWorkoutTimes, time: string) => {
    setDefaultTimes(prev => ({
      ...prev,
      [day]: time,
    }));
  };

  const dayNames: { key: keyof DefaultWorkoutTimes; label: string }[] = [
    { key: 'day1', label: 'Monday' },
    { key: 'day2', label: 'Tuesday' },
    { key: 'day3', label: 'Wednesday' },
    { key: 'day4', label: 'Thursday' },
    { key: 'day5', label: 'Friday' },
    { key: 'day6', label: 'Saturday' },
    { key: 'day7', label: 'Sunday' },
  ];

  if (isLoading) {
    return (
      <div className="workout-schedule-manager" role="status" aria-live="polite">
        <p>Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="workout-schedule-manager">
      <div className="schedule-header">
        <h3>Workout Schedule</h3>
        {cycle && (
          <button
            className="btn btn-primary"
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            aria-expanded={showScheduleForm}
            aria-controls="schedule-form"
          >
            {showScheduleForm ? 'Cancel' : 'Schedule Workout'}
          </button>
        )}
      </div>

      {showScheduleForm && cycle && (
        <div id="schedule-form" className="schedule-form" role="form" aria-label="Schedule workout form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="workout-select">Select Workout</label>
              <select
                id="workout-select"
                value={selectedWorkout}
                onChange={(e) => setSelectedWorkout(e.target.value)}
                aria-required="true"
              >
                <option value="">-- Choose a workout --</option>
                {cycle.workouts.map((workout) => (
                  <option key={workout.id} value={workout.id}>
                    Week {workout.week}, Day {workout.day} - {workout.exerciseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="schedule-date">Date</label>
              <input
                type="date"
                id="schedule-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                aria-required="true"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="schedule-time">Time</label>
              <input
                type="time"
                id="schedule-time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notification-lead">Notification Lead Time (minutes)</label>
              <input
                type="number"
                id="notification-lead"
                value={notificationLeadTime}
                onChange={(e) => setNotificationLeadTime(Number(e.target.value))}
                min="5"
                max="120"
                step="5"
              />
            </div>
          </div>

          <div className="form-checkbox">
            <input
              type="checkbox"
              id="enable-notification"
              checked={enableNotification}
              onChange={(e) => setEnableNotification(e.target.checked)}
            />
            <label htmlFor="enable-notification">
              Send notification before workout
            </label>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowScheduleForm(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleScheduleWorkout}
              disabled={!selectedDate || !selectedWorkout}
            >
              Schedule Workout
            </button>
          </div>
        </div>
      )}

      <div className="scheduled-workouts-list" role="list" aria-label="Scheduled workouts">
        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">📅</div>
            <p>No scheduled workouts yet.</p>
            {cycle && <p>Click "Schedule Workout" to add your first scheduled workout.</p>}
          </div>
        ) : (
          schedules
            .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
            .map((schedule) => {
              const workout = cycle?.workouts?.find(w => w.id === schedule.workoutId);
              return (
                <div
                  key={schedule.id}
                  className={`scheduled-workout-card ${schedule.isCompleted ? 'completed' : ''}`}
                  role="listitem"
                >
                  <div className="workout-info">
                    <div className="workout-title">
                      {workout ? `${workout.exerciseName} - Week ${workout.week}, Day ${workout.day}` : 'Custom Workout'}
                    </div>
                    <div className="workout-details">
                      <span>📅 {schedule.scheduledDate.toLocaleDateString()}</span>
                      <span>🕒 {schedule.scheduledTime}</span>
                      {schedule.isCompleted && schedule.completedDate && (
                        <span>✅ Completed {schedule.completedDate.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="workout-actions">
                    {!schedule.isCompleted && (
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleCompleteSchedule(schedule.id)}
                        aria-label={`Mark ${workout?.exerciseName || 'workout'} as completed`}
                      >
                        Complete
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      aria-label={`Delete ${workout?.exerciseName || 'workout'} schedule`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>

      <div className="default-times-section">
        <h4>Default Workout Times</h4>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Set your preferred workout times for each day of the week. These will be used as defaults when scheduling new workouts.
        </p>
        <div className="default-times-grid">
          {dayNames.map(({ key, label }) => (
            <div key={key} className="time-input-group">
              <label htmlFor={`default-time-${key}`}>{label}</label>
              <input
                type="time"
                id={`default-time-${key}`}
                value={defaultTimes[key] || ''}
                onChange={(e) => handleDefaultTimeChange(key, e.target.value)}
                aria-label={`Default workout time for ${label}`}
              />
            </div>
          ))}
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleSaveDefaultTimes}
          >
            Save Default Times
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutScheduleManager;
