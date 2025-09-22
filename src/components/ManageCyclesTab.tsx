import { type FC } from 'react';
import { type FiveThreeOneCycle } from '../types';
import InfoMessage from './InfoMessage';
import CycleCard from './CycleCard';

interface ManageCyclesTabProps {
  cycles: FiveThreeOneCycle[];
  onViewCycle: (cycle: FiveThreeOneCycle) => void;
  onSetActiveCycle: (cycleId: string) => void;
  onDeleteCycle: (cycleId: string) => void;
}

const ManageCyclesTab: FC<ManageCyclesTabProps> = ({
  cycles,
  onViewCycle,
  onSetActiveCycle,
  onDeleteCycle
}) => {
  return (
    <div>
      <h3>Manage Cycles</h3>

      {cycles.length === 0 ? (
        <InfoMessage message='No cycles created yet. Create your first cycle in the "Create Cycle" tab.' />
      ) : (
        <div className="cycles-grid">
          {cycles.map(cycle => (
            <CycleCard
              key={cycle.id}
              cycle={cycle}
              onView={onViewCycle}
              onSetActive={onSetActiveCycle}
              onDelete={onDeleteCycle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageCyclesTab;