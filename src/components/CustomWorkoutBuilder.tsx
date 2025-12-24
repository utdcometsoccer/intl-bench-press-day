import { type FC, useState, useEffect } from 'react';
import type { CustomWorkout, Exercise } from '../types';
import { workoutScheduleStorage } from '../services/workoutScheduleStorage';
import { getAllExercises } from '../exercises';
import './CustomWorkoutBuilder.css';

interface CustomWorkoutBuilderProps {
  onWorkoutCreated?: (workout: CustomWorkout) => void;
  onCancel?: () => void;
}

interface WorkoutSet {
  reps: number;
  weight: number;
  isAmrap: boolean;
}

const CustomWorkoutBuilder: FC<CustomWorkoutBuilderProps> = ({
  onWorkoutCreated,
  onCancel,
}) => {
  const [workoutName, setWorkoutName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [createdBy, setCreatedBy] = useState<'user' | 'coach' | 'auto'>('user');
  const [mainSets, setMainSets] = useState<WorkoutSet[]>([
    { reps: 5, weight: 135, isAmrap: false },
  ]);
  const [warmupSets, setWarmupSets] = useState<WorkoutSet[]>([]);
  const [notes, setNotes] = useState('');
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    // Load exercises
    const loadExercises = async () => {
      const allExercises = await getAllExercises();
      setAvailableExercises(allExercises);
    };
    loadExercises();
  }, []);

  const handleAddMainSet = () => {
    const lastSet = mainSets[mainSets.length - 1];
    setMainSets([
      ...mainSets,
      {
        reps: lastSet?.reps || 5,
        weight: lastSet?.weight || 135,
        isAmrap: false,
      },
    ]);
  };

  const handleRemoveMainSet = (index: number) => {
    if (mainSets.length > 1) {
      setMainSets(mainSets.filter((_, i) => i !== index));
    }
  };

  const handleUpdateMainSet = (index: number, field: keyof WorkoutSet, value: number | boolean) => {
    const updated = [...mainSets];
    updated[index] = { ...updated[index], [field]: value };
    setMainSets(updated);
  };

  const handleAddWarmupSet = () => {
    const lastSet = warmupSets[warmupSets.length - 1];
    setWarmupSets([
      ...warmupSets,
      {
        reps: lastSet?.reps || 5,
        weight: lastSet?.weight || 45,
        isAmrap: false,
      },
    ]);
  };

  const handleRemoveWarmupSet = (index: number) => {
    setWarmupSets(warmupSets.filter((_, i) => i !== index));
  };

  const handleUpdateWarmupSet = (index: number, field: keyof WorkoutSet, value: number | boolean) => {
    const updated = [...warmupSets];
    updated[index] = { ...updated[index], [field]: value };
    setWarmupSets(updated);
  };

  const handleCreateWorkout = async () => {
    if (!workoutName || !selectedExercise || mainSets.length === 0) {
      return;
    }

    const exercise = availableExercises.find(e => e.id === selectedExercise);
    if (!exercise) return;

    const newWorkout: CustomWorkout = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name: workoutName,
      description: description || undefined,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: mainSets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        isAmrap: set.isAmrap,
      })),
      warmupSets: warmupSets.length > 0 ? warmupSets.map(set => ({
        reps: set.reps,
        weight: set.weight,
      })) : undefined,
      createdDate: new Date(),
      createdBy,
      notes: notes || undefined,
    };

    try {
      await workoutScheduleStorage.initialize();
      await workoutScheduleStorage.addCustomWorkout(newWorkout);
      
      if (onWorkoutCreated) {
        onWorkoutCreated(newWorkout);
      }

      // Reset form
      setWorkoutName('');
      setDescription('');
      setSelectedExercise('');
      setCreatedBy('user');
      setMainSets([{ reps: 5, weight: 135, isAmrap: false }]);
      setWarmupSets([]);
      setNotes('');
    } catch (error) {
      console.error('Failed to create custom workout:', error);
    }
  };

  const isFormValid = workoutName.trim() !== '' && selectedExercise !== '' && mainSets.length > 0;

  return (
    <div className="custom-workout-builder">
      <div className="builder-header">
        <h3>Create Custom Workout</h3>
        <p>Design your own workout plan with personalized exercises and sets</p>
      </div>

      <div className="workout-form">
        {/* Basic Information */}
        <div className="form-section">
          <h4>📋 Basic Information</h4>
          
          <div className="form-group">
            <label htmlFor="workout-name">Workout Name *</label>
            <input
              type="text"
              id="workout-name"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Heavy Squat Day, Bench Press Focus"
              aria-required="true"
            />
            <span className="help-text">Give your workout a descriptive name</span>
          </div>

          <div className="form-group">
            <label htmlFor="workout-description">Description</label>
            <textarea
              id="workout-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of your workout goals and approach"
            />
          </div>

          <div className="form-group">
            <label htmlFor="exercise-select">Main Exercise *</label>
            <select
              id="exercise-select"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              aria-required="true"
            >
              <option value="">-- Select an exercise --</option>
              {availableExercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.category})
                </option>
              ))}
            </select>
            <span className="help-text">Choose the primary exercise for this workout</span>
          </div>

          <div className="form-group">
            <label>Workout Source</label>
            <div className="created-by-badges" role="radiogroup" aria-label="Workout source">
              <button
                type="button"
                className={`badge user ${createdBy === 'user' ? 'selected' : ''}`}
                onClick={() => setCreatedBy('user')}
                role="radio"
                aria-checked={createdBy === 'user'}
                aria-label="User created workout"
              >
                👤 User Created
              </button>
              <button
                type="button"
                className={`badge coach ${createdBy === 'coach' ? 'selected' : ''}`}
                onClick={() => setCreatedBy('coach')}
                role="radio"
                aria-checked={createdBy === 'coach'}
                aria-label="Coach assigned workout"
              >
                🏋️ Coach Assigned
              </button>
              <button
                type="button"
                className={`badge auto ${createdBy === 'auto' ? 'selected' : ''}`}
                onClick={() => setCreatedBy('auto')}
                role="radio"
                aria-checked={createdBy === 'auto'}
                aria-label="Auto generated workout"
              >
                🤖 Auto Generated
              </button>
            </div>
            <span className="help-text">Identify the source of this workout plan</span>
          </div>
        </div>

        {/* Main Sets */}
        <div className="form-section">
          <h4>💪 Main Sets</h4>
          <div className="sets-list" role="list" aria-label="Main workout sets">
            {mainSets.map((set, index) => (
              <div key={index} className="set-item" role="listitem">
                <span className="set-number">Set {index + 1}</span>
                
                <div className="set-input-group">
                  <label htmlFor={`main-reps-${index}`}>Reps</label>
                  <input
                    type="number"
                    id={`main-reps-${index}`}
                    value={set.reps}
                    onChange={(e) => handleUpdateMainSet(index, 'reps', Number(e.target.value))}
                    min="1"
                    max="50"
                  />
                </div>

                <div className="set-input-group">
                  <label htmlFor={`main-weight-${index}`}>Weight (lbs)</label>
                  <input
                    type="number"
                    id={`main-weight-${index}`}
                    value={set.weight}
                    onChange={(e) => handleUpdateMainSet(index, 'weight', Number(e.target.value))}
                    min="0"
                    step="5"
                  />
                </div>

                <div className="set-checkbox">
                  <input
                    type="checkbox"
                    id={`main-amrap-${index}`}
                    checked={set.isAmrap}
                    onChange={(e) => handleUpdateMainSet(index, 'isAmrap', e.target.checked)}
                  />
                  <label htmlFor={`main-amrap-${index}`}>AMRAP</label>
                </div>

                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => handleRemoveMainSet(index)}
                  disabled={mainSets.length === 1}
                  aria-label={`Remove set ${index + 1}`}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="add-set-btn"
            onClick={handleAddMainSet}
            aria-label="Add another main set"
          >
            + Add Set
          </button>
        </div>

        {/* Warmup Sets */}
        <div className="form-section">
          <h4>🔥 Warmup Sets (Optional)</h4>
          {warmupSets.length > 0 && (
            <div className="sets-list" role="list" aria-label="Warmup sets">
              {warmupSets.map((set, index) => (
                <div key={index} className="set-item" role="listitem">
                  <span className="set-number">Warmup {index + 1}</span>
                  
                  <div className="set-input-group">
                    <label htmlFor={`warmup-reps-${index}`}>Reps</label>
                    <input
                      type="number"
                      id={`warmup-reps-${index}`}
                      value={set.reps}
                      onChange={(e) => handleUpdateWarmupSet(index, 'reps', Number(e.target.value))}
                      min="1"
                      max="50"
                    />
                  </div>

                  <div className="set-input-group">
                    <label htmlFor={`warmup-weight-${index}`}>Weight (lbs)</label>
                    <input
                      type="number"
                      id={`warmup-weight-${index}`}
                      value={set.weight}
                      onChange={(e) => handleUpdateWarmupSet(index, 'weight', Number(e.target.value))}
                      min="0"
                      step="5"
                    />
                  </div>

                  <div></div>

                  <button
                    type="button"
                    className="btn-icon danger"
                    onClick={() => handleRemoveWarmupSet(index)}
                    aria-label={`Remove warmup set ${index + 1}`}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="add-set-btn"
            onClick={handleAddWarmupSet}
            aria-label="Add warmup set"
          >
            + Add Warmup Set
          </button>
        </div>

        {/* Notes */}
        <div className="form-section">
          <h4>📝 Notes (Optional)</h4>
          <div className="form-group">
            <label htmlFor="workout-notes">Workout Notes</label>
            <textarea
              id="workout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes, coaching cues, or reminders"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateWorkout}
            disabled={!isFormValid}
            aria-label="Create custom workout"
          >
            Create Workout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomWorkoutBuilder;
