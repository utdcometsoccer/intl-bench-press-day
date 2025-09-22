import { type FC } from 'react';
import { calculateTrainingMax, FIVE_THREE_ONE_MAIN_EXERCISES } from '../services/fiveThreeOneStorage';
import CustomMaxInput from './CustomMaxInput';
import { type ExerciseRecord } from '../types';

interface CreateCycleFormProps {
  cycleName: string;
  startDate: string;
  notes: string;
  usePersonalRecords: boolean;
  customMaxes: Record<string, number>;
  personalRecords: Map<string, ExerciseRecord>;
  isCreating: boolean;
  onCycleNameChange: (name: string) => void;
  onStartDateChange: (date: string) => void;
  onNotesChange: (notes: string) => void;
  onUsePersonalRecordsChange: (usePersonalRecords: boolean) => void;
  onCustomMaxChange: (exerciseId: string, value: string) => void;
  onCreateCycle: () => void;
}

const CreateCycleForm: FC<CreateCycleFormProps> = ({
  cycleName,
  startDate,
  notes,
  usePersonalRecords,
  customMaxes,
  personalRecords,
  isCreating,
  onCycleNameChange,
  onStartDateChange,
  onNotesChange,
  onUsePersonalRecordsChange,
  onCustomMaxChange,
  onCreateCycle
}) => {
  return (
    <div>
      <h3>Create New 5-3-1 Cycle</h3>

      <div className="form-grid two-column">
        <div>
          <label htmlFor="cycle-name" className="form-label">
            <span>Cycle Name:</span> <span className="sr-only">(required)</span>
          </label>
          <input
            id="cycle-name"
            type="text"
            value={cycleName}
            onChange={(e) => onCycleNameChange(e.target.value)}
            placeholder="e.g., Cycle 2025-01"
            className="form-input"
            required
            aria-invalid={!cycleName.trim() ? 'true' : 'false'}
            aria-describedby={!cycleName.trim() ? 'cycle-name-error' : undefined}
          />
          {!cycleName.trim() && (
            <div id="cycle-name-error" className="sr-only" role="alert">
              Cycle name is required
            </div>
          )}
        </div>

        <div>
          <label htmlFor="start-date" className="form-label">
            <span>Start Date:</span> <span className="sr-only">(required)</span>
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="form-input"
            required
            aria-invalid={!startDate ? 'true' : 'false'}
            aria-describedby={!startDate ? 'start-date-error' : undefined}
          />
          {!startDate && (
            <div id="start-date-error" className="sr-only" role="alert">
              Start date is required
            </div>
          )}
        </div>
      </div>

      <div className="form-section">
        <label htmlFor="notes" className="form-label">
          Notes (optional):
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any notes about this cycle..."
          rows={3}
          className="form-textarea"
        />
      </div>

      {/* One Rep Max Configuration */}
      <div className="one-rep-max-config">
        <h4 className="config-title">One Rep Max Configuration</h4>

        <fieldset className="radio-fieldset">
          <legend className="radio-legend">Choose your one rep max configuration method</legend>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="maxConfigMethod"
                checked={usePersonalRecords}
                onChange={() => onUsePersonalRecordsChange(true)}
                className="radio-input"
                aria-describedby="personal-records-desc"
              />
              Use Personal Records (from Exercise Tracker)
            </label>
            <div id="personal-records-desc" className="sr-only">
              Uses your saved exercise records from the Exercise Tracker section
            </div>
            
            <label className="radio-label">
              <input
                type="radio"
                name="maxConfigMethod"
                checked={!usePersonalRecords}
                onChange={() => onUsePersonalRecordsChange(false)}
                className="radio-input"
                aria-describedby="custom-maxes-desc"
              />
              Enter Custom Maxes
            </label>
            <div id="custom-maxes-desc" className="sr-only">
              Manually enter your one rep max values for each exercise
            </div>
          </div>
        </fieldset>

        <div className="max-config-grid">
          {FIVE_THREE_ONE_MAIN_EXERCISES.map(exercise => {
            const personalRecord = personalRecords.get(exercise.id);
            const currentValue = usePersonalRecords
              ? (personalRecord?.oneRepMax || 0)
              : (customMaxes[exercise.id] || 0);
            const trainingMax = currentValue ? calculateTrainingMax(currentValue) : 0;

            return (
              <div key={exercise.id} className="max-config-card">
                <h5 className="max-config-title">{exercise.name}</h5>

                {usePersonalRecords ? (
                  <div>
                    <p className="pr-info">
                      <strong>PR:</strong> {personalRecord ? `${personalRecord.oneRepMax} lbs` : 'No record found'}
                    </p>
                    {personalRecord && (
                      <p className="training-max-info">
                        Training Max: {trainingMax} lbs (90%)
                      </p>
                    )}
                  </div>
                ) : (
                  <CustomMaxInput
                    exerciseId={exercise.id}
                    exerciseName={exercise.name}
                    value={customMaxes[exercise.id] || 0}
                    onChange={onCustomMaxChange}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onCreateCycle}
        disabled={isCreating || !cycleName.trim() || !startDate}
        className="create-cycle-button"
        aria-describedby="create-cycle-requirements"
      >
        {isCreating ? 'Creating Cycle...' : 'Create 5-3-1 Cycle'}
      </button>
      
      <div id="create-cycle-requirements" className="sr-only">
        {(!cycleName.trim() || !startDate) ? 
          'Please fill in all required fields: cycle name and start date' : 
          'All required fields are complete'
        }
      </div>
    </div>
  );
};

export default CreateCycleForm;