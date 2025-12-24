import { type FC, useState, useMemo, useEffect } from 'react';
import type { FiveThreeOneCycle, WorkoutSchedule } from '../types';
import type { WorkoutResult } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { workoutScheduleStorage } from '../services/workoutScheduleStorage';
import './CalendarView.css';

// Calendar constants
const DAYS_PER_WEEK = 7;
const WEEKS_PER_CYCLE = 4;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Default workout day mapping (configurable workout schedule)
// Maps day of week (0=Sunday, 1=Monday, etc.) to workout day number (1-4)
const DEFAULT_WORKOUT_DAY_MAP: Record<number, number> = {
  1: 1, // Monday - Workout Day 1 (e.g., Squat)
  2: 2, // Tuesday - Workout Day 2 (e.g., Bench)
  4: 3, // Thursday - Workout Day 3 (e.g., Deadlift)
  5: 4, // Friday - Workout Day 4 (e.g., OHP)
};

interface CalendarViewProps {
  cycle: FiveThreeOneCycle;
  results: WorkoutResult[];
}

const CalendarView: FC<CalendarViewProps> = ({ cycle, results }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<WorkoutSchedule[]>([]);

  const loadSchedules = async () => {
    try {
      await workoutScheduleStorage.initialize();
      if (cycle) {
        const cycleSchedules = await workoutScheduleStorage.getSchedulesForCycle(cycle.id);
        setSchedules(cycleSchedules);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  };

  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getWorkoutForDay = (date: Date): WorkoutResult | undefined => {
    return results.find(result =>
      isSameDay(new Date(result.datePerformed), date)
    );
  };

  const getScheduledWorkoutForDay = (date: Date): WorkoutSchedule | undefined => {
    return schedules.find(schedule =>
      isSameDay(new Date(schedule.scheduledDate), date)
    );
  };

  const getPlannedWorkoutForDay = (date: Date): { week: number; day: number; exerciseName: string } | undefined => {
    const cycleStart = new Date(cycle.startDate);
    const daysDiff = Math.floor((date.getTime() - cycleStart.getTime()) / MS_PER_DAY);
    
    // Assuming 2 days between workouts, roughly 4 workouts per week
    if (daysDiff < 0) return undefined;
    
    const week = Math.floor(daysDiff / DAYS_PER_WEEK) + 1;
    if (week > WEEKS_PER_CYCLE) return undefined;
    
    // Map workout days based on day of week
    const dayOfWeek = getDay(date);
    const workoutDay = DEFAULT_WORKOUT_DAY_MAP[dayOfWeek];
    if (!workoutDay) return undefined;
    
    const workout = cycle.workouts?.find(w => w.week === week && w.day === workoutDay);
    if (!workout) return undefined;
    
    return {
      week,
      day: workoutDay,
      exerciseName: workout.exerciseName,
    };
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get empty cells for the start of the month
  const startDayOfWeek = getDay(startOfMonth(currentMonth));
  const emptyStartCells = Array(startDayOfWeek).fill(null);

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button
          className="calendar-nav-button"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 className="calendar-title">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          className="calendar-nav-button"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="calendar-grid">
        {/* Weekday headers */}
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}

        {/* Empty cells for start of month */}
        {emptyStartCells.map((_, index) => (
          <div key={`empty-${index}`} className="calendar-day empty" />
        ))}

        {/* Calendar days */}
        {calendarDays.map(day => {
          const completedWorkout = getWorkoutForDay(day);
          const plannedWorkout = getPlannedWorkoutForDay(day);
          const scheduledWorkout = getScheduledWorkoutForDay(day);
          const isToday = isSameDay(day, new Date());

          // Get workout name from scheduled workout if available
          const workout = scheduledWorkout && cycle?.workouts ? 
            cycle.workouts.find(w => w.id === scheduledWorkout.workoutId) : 
            null;

          return (
            <div
              key={day.toISOString()}
              className={`calendar-day ${isToday ? 'today' : ''} ${completedWorkout ? 'completed' : ''} ${(plannedWorkout || scheduledWorkout) && !completedWorkout ? 'planned' : ''}`}
              title={
                completedWorkout
                  ? `${completedWorkout.exerciseName} (Completed)`
                  : scheduledWorkout && workout
                  ? `${workout.exerciseName} at ${scheduledWorkout.scheduledTime} (Scheduled)`
                  : plannedWorkout
                  ? `${plannedWorkout.exerciseName} (Planned)`
                  : undefined
              }
            >
              <span className="day-number">{format(day, 'd')}</span>
              {completedWorkout && (
                <div className="workout-indicator completed-indicator">
                  <span className="indicator-icon">✓</span>
                  <span className="indicator-text">{completedWorkout.exerciseName.substring(0, 2)}</span>
                </div>
              )}
              {!completedWorkout && scheduledWorkout && workout && (
                <div className="workout-indicator scheduled-indicator">
                  <span className="indicator-time">{scheduledWorkout.scheduledTime}</span>
                  <span className="indicator-text">{workout.exerciseName.substring(0, 2)}</span>
                </div>
              )}
              {!completedWorkout && !scheduledWorkout && plannedWorkout && (
                <div className="workout-indicator planned-indicator">
                  <span className="indicator-text">{plannedWorkout.exerciseName.substring(0, 2)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot completed" />
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot scheduled" />
          <span>Scheduled</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot planned" />
          <span>Planned</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot today-dot" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
