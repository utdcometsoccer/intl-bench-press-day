import { type FC } from 'react';
import { type FiveThreeOneCycle } from '../services/fiveThreeOneStorage';

interface WorkoutWeekProps {
  cycle: FiveThreeOneCycle;
  week: number;
}

const WorkoutWeek: FC<WorkoutWeekProps> = ({ cycle, week }) => {
  const weekWorkouts = cycle.workouts.filter(w => w.week === week);
  const weekName = week === 4 ? `Week ${week} (Deload)` : `Week ${week}`;

  return (
    <div className="workout-week">
      <h4 className="week-title">
        {weekName}
      </h4>

      <div className="workouts-grid">
        {weekWorkouts.sort((a, b) => a.day - b.day).map(workout => (
          <div key={workout.id} className="workout-card">
            <h5 className="workout-title">
              Day {workout.day}: {workout.exerciseName}
            </h5>

            {/* Warmup Sets */}
            <div className="workout-section">
              <strong className="workout-section-title">Warmup:</strong>
              {workout.warmupSets.map((set, index) => (
                <div key={index} className="workout-set-detail">
                  {set.reps} × {set.weight} lbs ({set.percentage}%)
                </div>
              ))}
            </div>

            {/* Main Sets */}
            <div className="workout-section">
              <strong className="workout-section-title main-sets">Main Sets:</strong>
              {workout.mainSets.map((set, index) => (
                <div key={index} className={`workout-set-detail ${set.isAmrap ? 'amrap' : ''}`}>
                  {set.reps}{set.isAmrap ? '+' : ''} × {set.weight} lbs ({set.percentage}%)
                  {set.isAmrap && <span className="amrap-indicator"> (AMRAP)</span>}
                </div>
              ))}
            </div>

            {/* Assistance Exercises */}
            {workout.assistanceExercises && workout.assistanceExercises.length > 0 && (
              <div>
                <strong className="workout-section-title">Suggested Assistance:</strong>
                <div className="assistance-exercises">
                  {workout.assistanceExercises.slice(0, 3).join(', ')}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutWeek;