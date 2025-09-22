import { type FC } from 'react';
import { type FiveThreeOneCycle } from '../services/fiveThreeOneStorage';
import WorkoutWeek from './WorkoutWeek';

interface CycleSelectorProps {
  selectedCycle: FiveThreeOneCycle;
  onBackToActiveCycle: () => void;
}

const CycleSelector: FC<CycleSelectorProps> = ({ 
  selectedCycle, 
  onBackToActiveCycle 
}) => {
  return (
    <>
      <div className="view-cycle-selector">
        <p>Showing workouts for: <strong>{selectedCycle.name}</strong></p>
        <button
          onClick={onBackToActiveCycle}
          className="cycle-action-button view"
        >
          Back to Active Cycle
        </button>
      </div>

      <div className="view-workouts-section">
        {[1, 2, 3, 4].map(week => (
          <WorkoutWeek key={week} cycle={selectedCycle} week={week} />
        ))}
      </div>
    </>
  );
};

export default CycleSelector;