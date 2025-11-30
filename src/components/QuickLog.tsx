import { type FC, useState } from 'react';
import type { FiveThreeOneCycle, FiveThreeOneWorkout } from '../types';
import type { WorkoutResult, WorkoutSetResult } from '../types';
import { workoutResultsStorage, calculateEstimated1RM } from '../services/workoutResultsStorage';
import './QuickLog.css';

interface QuickLogProps {
  cycle: FiveThreeOneCycle;
  workout: FiveThreeOneWorkout;
  onComplete: () => void;
  onCancel: () => void;
}

const QuickLog: FC<QuickLogProps> = ({
  cycle,
  workout,
  onComplete,
  onCancel,
}) => {
  const [mainSetResults, setMainSetResults] = useState<WorkoutSetResult[]>(
    workout.mainSets.map(set => ({
      plannedReps: set.reps,
      plannedWeight: set.weight,
      actualReps: set.reps,
      actualWeight: set.weight,
      percentage: set.percentage,
      isAmrap: set.isAmrap || false,
    }))
  );
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const updateMainSetResult = (index: number, field: 'actualReps' | 'actualWeight', value: number) => {
    setMainSetResults(prev =>
      prev.map((result, i) =>
        i === index ? { ...result, [field]: value } : result
      )
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      const workoutResult: WorkoutResult = {
        id: `result_${workout.id}_${Date.now()}`,
        cycleId: cycle.id,
        cycleName: cycle.name,
        workoutId: workout.id,
        exerciseId: workout.exerciseId,
        exerciseName: workout.exerciseName,
        week: workout.week,
        day: workout.day,
        datePerformed: new Date(),
        warmupResults: [],
        mainSetResults: mainSetResults.filter(r => r.actualReps > 0),
        overallRpe: undefined,
        workoutNotes: workoutNotes.trim() || undefined,
      };

      await workoutResultsStorage.saveWorkoutResult(workoutResult);
      onComplete();
    } catch (err) {
      setError(`Failed to save workout: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getEstimated1RM = (weight: number, reps: number): number => {
    return calculateEstimated1RM(weight, reps);
  };

  return (
    <div className="quick-log-overlay" onClick={onCancel}>
      <div className="quick-log-modal" onClick={e => e.stopPropagation()}>
        <div className="quick-log-header">
          <h3>Quick Log: {workout.exerciseName}</h3>
          <button
            className="close-button"
            onClick={onCancel}
            aria-label="Close quick log"
          >
            ✕
          </button>
        </div>

        <div className="quick-log-content">
          <div className="workout-info-bar">
            <span>Week {workout.week}</span>
            <span>•</span>
            <span>Day {workout.day}</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>

          <div className="main-sets-section">
            <h4>Main Sets</h4>
            {mainSetResults.map((result, index) => (
              <div
                key={index}
                className={`quick-set-row ${result.isAmrap ? 'amrap' : ''}`}
              >
                <div className="set-info">
                  <span className="set-number">Set {index + 1}</span>
                  {result.isAmrap && (
                    <span className="amrap-badge">AMRAP</span>
                  )}
                </div>

                <div className="set-inputs">
                  <div className="input-group">
                    <label htmlFor={`reps-${index}`}>Reps</label>
                    <input
                      id={`reps-${index}`}
                      type="number"
                      min="0"
                      value={result.actualReps}
                      onChange={e =>
                        updateMainSetResult(index, 'actualReps', Number(e.target.value))
                      }
                      className={result.isAmrap ? 'amrap-input' : ''}
                    />
                  </div>

                  <span className="input-separator">×</span>

                  <div className="input-group">
                    <label htmlFor={`weight-${index}`}>Weight</label>
                    <input
                      id={`weight-${index}`}
                      type="number"
                      min="0"
                      step="2.5"
                      value={result.actualWeight}
                      onChange={e =>
                        updateMainSetResult(index, 'actualWeight', Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                {result.actualReps > 0 && result.actualWeight > 0 && (
                  <div className="estimated-1rm">
                    Est. 1RM: {getEstimated1RM(result.actualWeight, result.actualReps)} lbs
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="notes-section">
            <label htmlFor="workout-notes">Quick Notes (optional)</label>
            <textarea
              id="workout-notes"
              value={workoutNotes}
              onChange={e => setWorkoutNotes(e.target.value)}
              placeholder="How did it feel?"
              rows={2}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="quick-log-actions">
          <button
            className="cancel-button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickLog;
