import { type FC } from 'react';
import { type FiveThreeOneCycle } from '../services/fiveThreeOneStorage';

interface CycleCardProps {
  cycle: FiveThreeOneCycle;
  onView: (cycle: FiveThreeOneCycle) => void;
  onSetActive: (cycleId: string) => void;
  onDelete: (cycleId: string) => void;
}

const CycleCard: FC<CycleCardProps> = ({ 
  cycle, 
  onView, 
  onSetActive, 
  onDelete 
}) => {
  return (
    <div className={`cycle-card ${cycle.isActive ? 'active' : ''}`}>
      <div className="cycle-header">
        <div>
          <h4 className="cycle-title">
            {cycle.name}
            {cycle.isActive && <span className="active-indicator"> (Active)</span>}
          </h4>
          <p className="cycle-date">
            Start Date: {new Date(cycle.startDate).toLocaleDateString()}
          </p>
          <p className="cycle-created-date">
            Created: {new Date(cycle.createdDate).toLocaleDateString()}
          </p>
          {cycle.notes && (
            <p className="cycle-notes">
              "{cycle.notes}"
            </p>
          )}
        </div>

        <div className="cycle-actions">
          <button
            onClick={() => onView(cycle)}
            className="cycle-action-button view"
          >
            View
          </button>

          {!cycle.isActive && (
            <button
              onClick={() => onSetActive(cycle.id)}
              className="cycle-action-button activate"
            >
              Set Active
            </button>
          )}

          <button
            onClick={() => onDelete(cycle.id)}
            className="cycle-action-button delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CycleCard;