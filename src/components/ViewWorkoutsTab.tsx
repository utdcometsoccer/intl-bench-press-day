import { type FC } from 'react';
import { type FiveThreeOneCycle } from '../types';
import WorkoutWeek from './WorkoutWeek';
import CycleSelector from './CycleSelector';

interface ViewWorkoutsTabProps {
  activeCycle: FiveThreeOneCycle | null;
  selectedCycle: FiveThreeOneCycle | null;
  onBackToActiveCycle: () => void;
}

const ViewWorkoutsTab: FC<ViewWorkoutsTabProps> = ({
  activeCycle,
  selectedCycle,
  onBackToActiveCycle
}) => {
  return (
    <div>
      <h3>View Workouts</h3>

      {!selectedCycle && activeCycle && (
        <>
          <p>Showing workouts for active cycle: <strong>{activeCycle.name}</strong></p>
          <div className="view-workouts-section">
            {[1, 2, 3, 4].map(week => (
              <WorkoutWeek key={week} cycle={activeCycle} week={week} />
            ))}
          </div>
        </>
      )}

      {selectedCycle && (
        <CycleSelector
          selectedCycle={selectedCycle}
          onBackToActiveCycle={onBackToActiveCycle}
        />
      )}

      {!activeCycle && !selectedCycle && (
        <div className="info-message">
          <h4>👀 View Your Training Plan</h4>
          <p>No active training cycle to display. Once you create and activate a cycle, you'll see:</p>
          <ul className="info-message-list">
            <li><strong>All 4 weeks</strong> of your training program</li>
            <li><strong>Detailed workout breakdowns</strong> for each day</li>
            <li><strong>Set-by-set prescriptions</strong> with weights and reps</li>
            <li><strong>Percentage-based calculations</strong> from your training max</li>
          </ul>
          <p className="help-text">
            💡 <strong>Next Step:</strong> Create a training cycle in the "Create Cycle" tab, 
            then activate it in "Manage Cycles" to view your workouts here.
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewWorkoutsTab;