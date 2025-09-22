import { type FC } from 'react';
import { type FiveThreeOneCycle } from '../types';
import InfoMessage from './InfoMessage';
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
        <InfoMessage message="No active cycle found. Create a cycle first to view workouts." />
      )}
    </div>
  );
};

export default ViewWorkoutsTab;