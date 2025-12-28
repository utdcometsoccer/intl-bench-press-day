import { type FC } from 'react';
import type { WorkoutSuggestion } from '../services/workoutSuggestionService';
import './TodaysWorkout.css';

interface TodaysWorkoutProps {
  suggestion: WorkoutSuggestion;
  onStartWorkout: () => void;
  onViewFullLogger: () => void;
}

const TodaysWorkout: FC<TodaysWorkoutProps> = ({
  suggestion,
  onStartWorkout,
  onViewFullLogger,
}) => {
  const { workout, recommendation, exerciseName, week, day } = suggestion;

  const getRecommendationStyles = () => {
    switch (recommendation) {
      case 'today':
        return {
          className: 'today',
          badge: '🎯 Today',
          badgeClass: 'badge-today',
        };
      case 'overdue':
        return {
          className: 'overdue',
          badge: '⚠️ Overdue',
          badgeClass: 'badge-overdue',
        };
      case 'upcoming':
        return {
          className: 'upcoming',
          badge: '📅 Next Up',
          badgeClass: 'badge-upcoming',
        };
      default:
        return {
          className: '',
          badge: '',
          badgeClass: '',
        };
    }
  };

  const styles = getRecommendationStyles();

  // Get week description
  const weekDescriptions: Record<number, string> = {
    1: '5/5/5+ Week',
    2: '3/3/3+ Week',
    3: '5/3/1+ Week',
    4: 'Deload Week',
  };

  return (
    <div className={`todays-workout ${styles.className}`}>
      <div className="workout-header">
        <span className={`workout-badge ${styles.badgeClass}`}>
          {styles.badge}
        </span>
        <h3 className="workout-title">Your Next Workout</h3>
      </div>

      <div className="workout-details">
        <div className="exercise-name">
          <span className="exercise-icon" aria-hidden="true">🏋️</span>
          <strong>{exerciseName}</strong>
        </div>
        
        <div className="workout-info">
          {week !== undefined && (
            <>
              <span className="info-item">
                <span className="info-label">Week</span>
                <span className="info-value">{week}</span>
              </span>
              <span className="info-item">
                <span className="info-label">Day</span>
                <span className="info-value">{day}</span>
              </span>
              <span className="info-item">
                <span className="info-label">Type</span>
                <span className="info-value">{weekDescriptions[week] || `Week ${week}`}</span>
              </span>
            </>
          )}
        </div>

        {workout && (
          <div className="workout-sets-preview">
            <h4>Main Sets Preview</h4>
            <div className="sets-list">
              {workout.mainSets.map((set, index) => (
                <div key={index} className={`set-preview ${set.isAmrap ? 'amrap' : ''}`}>
                  <span className="set-number">Set {index + 1}</span>
                  <span className="set-details">
                    {set.reps}{set.isAmrap ? '+' : ''} × {set.weight} lbs
                    {set.isAmrap && <span className="amrap-label"> (AMRAP)</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="workout-actions">
        <button
          className="start-workout-button"
          onClick={onStartWorkout}
          aria-label={`Start ${exerciseName} workout`}
        >
          Quick Log
        </button>
        <button
          className="full-logger-button"
          onClick={onViewFullLogger}
          aria-label="Open full workout logger"
        >
          Full Logger
        </button>
      </div>
    </div>
  );
};

export default TodaysWorkout;
