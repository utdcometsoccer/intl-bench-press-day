import { type FC } from 'react';
import type { CycleProgress } from '../services/workoutSuggestionService';
import './ProgressSummary.css';

interface ProgressSummaryProps {
  progress: CycleProgress;
  onViewFullProgress: () => void;
}

const ProgressSummary: FC<ProgressSummaryProps> = ({
  progress,
  onViewFullProgress,
}) => {
  const { completedWorkouts, totalWorkouts, percentComplete, weeksProgress, currentWeek } = progress;

  return (
    <div className="progress-summary">
      <div className="progress-header">
        <h3>Progress</h3>
        <button
          className="view-full-button"
          onClick={onViewFullProgress}
          aria-label="View full progress charts"
        >
          View Charts →
        </button>
      </div>

      {/* Overall progress bar */}
      <div className="overall-progress">
        <div className="progress-stats">
          <span className="progress-count">
            {completedWorkouts} / {totalWorkouts} workouts
          </span>
          <span className="progress-percent">{percentComplete}%</span>
        </div>
        <div 
          className="progress-bar"
          role="progressbar"
          aria-valuenow={percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Cycle progress: ${percentComplete}% complete`}
        >
          <div
            className="progress-fill"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Week-by-week progress */}
      <div className="weeks-progress">
        {weeksProgress && weeksProgress.map(week => (
          <div
            key={week.week}
            className={`week-progress ${week.week === currentWeek ? 'current' : ''} ${week.isComplete ? 'complete' : ''}`}
          >
            <div className="week-header">
              <span className="week-number">Week {week.week}</span>
              {week.week === currentWeek && (
                <span className="current-badge">Current</span>
              )}
              {week.isComplete && (
                <span className="complete-badge">✓</span>
              )}
            </div>
            <div className="week-days">
              {[1, 2, 3, 4].map(day => (
                <div
                  key={day}
                  className={`day-dot ${week.completedDays.includes(day) ? 'completed' : ''}`}
                  title={`Day ${day}: ${week.completedDays.includes(day) ? 'Completed' : 'Pending'}`}
                  aria-label={`Week ${week.week} Day ${day}: ${week.completedDays.includes(day) ? 'Completed' : 'Pending'}`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Motivational message */}
      <div className="progress-message">
        {percentComplete === 100 ? (
          <p className="complete-message">
            🎉 Cycle Complete! Time to increase those maxes!
          </p>
        ) : percentComplete >= 75 ? (
          <p className="almost-message">
            💪 Almost there! Keep pushing!
          </p>
        ) : percentComplete >= 50 ? (
          <p className="halfway-message">
            🏋️ Halfway through! Stay consistent!
          </p>
        ) : (
          <p className="start-message">
            🚀 You're building momentum!
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgressSummary;
