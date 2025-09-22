import { type FC } from 'react';
import { calculateTrainingMax } from '../services/fiveThreeOneStorage';

interface CustomMaxInputProps {
  exerciseId: string;
  value: number;
  onChange: (exerciseId: string, value: string) => void;
  className?: string;
}

const CustomMaxInput: FC<CustomMaxInputProps> = ({ 
  exerciseId, 
  value, 
  onChange, 
  className = '' 
}) => {
  const trainingMax = value ? calculateTrainingMax(value) : 0;

  return (
    <div className={className}>
      <input
        type="number"
        min="0"
        step="0.5"
        value={value || ''}
        onChange={(e) => onChange(exerciseId, e.target.value)}
        placeholder="Enter 1RM"
        className="custom-max-input"
      />
      {value > 0 && (
        <p className="training-max-info">
          Training Max: {trainingMax} lbs (90%)
        </p>
      )}
    </div>
  );
};

export default CustomMaxInput;