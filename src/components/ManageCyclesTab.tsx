import { type FC } from 'react';
import { type FiveThreeOneCycle } from '../types';
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
        <div className="info-message">
          <h4>📋 Create Your First Training Cycle</h4>
          <p>You haven't created any 5/3/1 training cycles yet. This is where you'll manage all your training programs.</p>
          <p><strong>What is a training cycle?</strong></p>
          <ul className="info-message-list">
            <li>A 4-week program following Jim Wendler's 5/3/1 methodology</li>
            <li>Automatically calculates all your working weights</li>
            <li>Includes progressive overload across weeks</li>
            <li>Features a deload week for recovery</li>
          </ul>
          <p className="help-text">
            💡 <strong>Getting Started:</strong> Switch to the "Create Cycle" tab to set up your first 
            training cycle with your current one-rep maxes.
          </p>
        </div>
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