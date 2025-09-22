import { type FC } from 'react';
import { calculateTrainingMax } from '../services/fiveThreeOneStorage';

interface CustomMaxInputProps {
  exerciseId: string;
  value: number;
  onChange: (exerciseId: string, value: string) => void;
  className?: string;
  exerciseName?: string;
}

const CustomMaxInput: FC<CustomMaxInputProps> = ({ 
  exerciseId, 
  value, 
  onChange, 
  className = '',
  exerciseName = 'exercise'
}) => {
  const trainingMax = value ? calculateTrainingMax(value) : 0;
  const inputId = `custom-max-${exerciseId}`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  
  const isInvalid = value < 0;
  const isRequired = true; // Custom maxes are required when this mode is selected

  return (
    <div className={className}>
      <label htmlFor={inputId} className="sr-only">
        One rep max for {exerciseName} (required)
      </label>
      <input
        id={inputId}
        type="number"
        min="0"
        step="0.5"
        value={value || ''}
        onChange={(e) => onChange(exerciseId, e.target.value)}
        placeholder="Enter 1RM"
        className="custom-max-input"
        required={isRequired}
        aria-invalid={isInvalid || (isRequired && !value) ? 'true' : 'false'}
        aria-describedby={`${helpId} ${isInvalid ? errorId : ''}`.trim()}
      />
      
      <div id={helpId} className="sr-only">
        Enter your one rep max in pounds for {exerciseName}
      </div>
      
      {isInvalid && (
        <div id={errorId} className="sr-only" role="alert">
          One rep max must be a positive number
        </div>
      )}
      
      {value > 0 && (
        <p className="training-max-info" aria-live="polite">
          Training Max: {trainingMax} lbs (90%)
        </p>
      )}
    </div>
  );
};

export default CustomMaxInput;