import React, { useState, useEffect, useCallback } from 'react';
import type { WorkoutSet } from './types';
import type { Exercise } from './exercises';
import type { ExerciseRecord } from './exerciseRecordsStorage';
import { BARBELL_EXERCISES, getExerciseCategories, findExerciseById } from './exercises';
import { oneRepMaxStorage, initializeWithPredefinedFormulas } from './oneRepMaxStorage';
import { exerciseRecordsStorage } from './exerciseRecordsStorage';

interface StoredFunctionInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseOneRepMaxTracker: React.FC = () => {
  // Exercise selection state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Calculator state
  const [availableFunctions, setAvailableFunctions] = useState<StoredFunctionInfo[]>([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>('');
  const [workoutSet, setWorkoutSet] = useState<WorkoutSet>({ Repetions: 5, Weight: 135 });
  const [result, setResult] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');

  // Records state
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [personalRecord, setPersonalRecord] = useState<ExerciseRecord | null>(null);

  // UI state
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Load available one-rep max functions
  const loadAvailableFunctions = useCallback(async () => {
    try {
      const functions = await oneRepMaxStorage.listFunctions();
      setAvailableFunctions(functions);
      
      if (functions.length > 0 && !selectedFunctionId) {
        setSelectedFunctionId(functions[0].id);
      }
    } catch (err) {
      setError(`Failed to load functions: ${err}`);
    }
  }, [selectedFunctionId]);

  // Initialize the systems
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        setIsLoading(true);
        await initializeWithPredefinedFormulas();
        await exerciseRecordsStorage.initialize();
        await loadAvailableFunctions();
      } catch (err) {
        setError(`Failed to initialize systems: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSystems();
  }, [loadAvailableFunctions]);

  // Load records for the selected exercise
  const loadExerciseRecords = useCallback(async () => {
    if (!selectedExerciseId) return;

    try {
      const records = await exerciseRecordsStorage.getRecordsByExercise(selectedExerciseId);
      setExerciseRecords(records);

      const bestRecord = await exerciseRecordsStorage.getBestRecordForExercise(selectedExerciseId);
      setPersonalRecord(bestRecord);
    } catch (err) {
      setError(`Failed to load exercise records: ${err}`);
    }
  }, [selectedExerciseId]);

  // Load exercise records when exercise changes
  useEffect(() => {
    if (selectedExerciseId) {
      loadExerciseRecords();
    } else {
      setExerciseRecords([]);
      setPersonalRecord(null);
    }
  }, [selectedExerciseId, loadExerciseRecords]);

  // Handle exercise selection
  const handleExerciseChange = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    const exercise = findExerciseById(exerciseId);
    setSelectedExercise(exercise || null);
    setResult(null);
    setShowSuccess(false);
  };

  // Handle workout set input changes
  const handleWorkoutSetChange = (field: keyof WorkoutSet, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setWorkoutSet(prev => ({
      ...prev,
      [field]: numericValue
    }));
    setResult(null);
  };

  // Calculate one-rep max
  const calculateOneRepMax = async () => {
    if (!selectedFunctionId || !selectedExercise) {
      setError('Please select both an exercise and a formula');
      return;
    }

    if (workoutSet.Repetions <= 0 || workoutSet.Weight <= 0) {
      setError('Repetitions and weight must be positive numbers');
      return;
    }

    try {
      setError('');
      const oneRepMaxFunction = await oneRepMaxStorage.getFunctionById(selectedFunctionId);
      
      if (!oneRepMaxFunction) {
        setError('Selected function not found');
        return;
      }

      const calculatedResult = oneRepMaxFunction(workoutSet);
      setResult(Math.round(calculatedResult * 100) / 100);
    } catch (err) {
      setError(`Calculation failed: ${err}`);
      setResult(null);
    }
  };

  // Save the record to IndexedDB
  const saveRecord = async () => {
    if (!selectedExercise || !result || !selectedFunctionId) {
      setError('Please calculate a one-rep max first');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const selectedFunction = availableFunctions.find(f => f.id === selectedFunctionId);
      if (!selectedFunction) {
        throw new Error('Selected function not found');
      }

      await exerciseRecordsStorage.saveRecord(
        selectedExercise,
        workoutSet,
        result,
        selectedFunction.name,
        selectedFunctionId,
        notes || undefined
      );

      // Refresh the records
      await loadExerciseRecords();
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Clear the notes
      setNotes('');
    } catch (err) {
      setError(`Failed to save record: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const categories = getExerciseCategories();
  const exercisesInCategory = selectedCategory 
    ? BARBELL_EXERCISES.filter(ex => ex.category === selectedCategory)
    : [];

  if (isLoading) {
    return (
      <div className="exercise-tracker">
        <h2>Exercise One Rep Max Tracker</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="exercise-tracker component-container">
      <h2>Exercise One Rep Max Tracker</h2>

      {/* Exercise Selection */}
      <div className="form-section">
        <h3>Select Exercise</h3>
        
        <div className="two-column-grid">
          <div>
            <label htmlFor="category-select" className="form-label">
              Category:
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedExerciseId('');
                setSelectedExercise(null);
              }}
              className="form-select"
            >
              <option value="">-- Select Category --</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="exercise-select" className="form-label">
              Exercise:
            </label>
            <select
              id="exercise-select"
              value={selectedExerciseId}
              onChange={(e) => handleExerciseChange(e.target.value)}
              disabled={!selectedCategory}
              className={`form-select ${!selectedCategory ? 'disabled-select' : ''}`}
            >
              <option value="">-- Select Exercise --</option>
              {exercisesInCategory.map(exercise => (
                <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedExercise && (
          <div className="exercise-info">
            <h4>{selectedExercise.name}</h4>
            <p className="description">
              {selectedExercise.description}
            </p>
            <p className="muscle-groups">
              <strong>Muscle Groups:</strong> {selectedExercise.muscleGroups.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Personal Record Display */}
      {personalRecord && (
        <div className="personal-record">
          <h3>Personal Record</h3>
          <p className="record-value">
            {personalRecord.oneRepMax} lbs
          </p>
          <p className="record-details">
            Set on {new Date(personalRecord.dateRecorded).toLocaleDateString()} 
            ({personalRecord.workoutSet.Repetions} reps at {personalRecord.workoutSet.Weight} lbs)
          </p>
        </div>
      )}

      {/* Calculator Section */}
      {selectedExercise && (
        <div className="form-section">
          <h3>Calculate One Rep Max</h3>

          {/* Formula Selection */}
          <div className="mb-20">
            <label htmlFor="function-select" className="form-label">
              Formula:
            </label>
            <select
              id="function-select"
              value={selectedFunctionId}
              onChange={(e) => setSelectedFunctionId(e.target.value)}
              className="form-select"
            >
              <option value="">-- Select a formula --</option>
              {availableFunctions.map((func) => (
                <option key={func.id} value={func.id}>
                  {func.name} {func.description && `- ${func.description}`}
                </option>
              ))}
            </select>
          </div>

          {/* Workout Set Inputs */}
          <div className="two-column-grid">
            <div>
              <label htmlFor="repetitions" className="form-label">
                Repetitions:
              </label>
              <input
                id="repetitions"
                type="number"
                min="1"
                value={workoutSet.Repetions}
                onChange={(e) => handleWorkoutSetChange('Repetions', e.target.value)}
                className="form-input"
              />
            </div>
            
            <div>
              <label htmlFor="weight" className="form-label">
                Weight (lbs):
              </label>
              <input
                id="weight"
                type="number"
                min="0"
                step="0.01"
                value={workoutSet.Weight}
                onChange={(e) => handleWorkoutSetChange('Weight', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <button
            onClick={calculateOneRepMax}
            disabled={!selectedFunctionId}
            className="primary-button"
          >
            Calculate One Rep Max
          </button>

          {/* Results and Save Section */}
          {result !== null && (
            <div className="calculation-result">
              <h4>Calculated 1RM: {result} lbs</h4>
              <p className="result-details">
                Based on {workoutSet.Repetions} reps at {workoutSet.Weight} lbs
              </p>

              <div className="mb-20">
                <label htmlFor="notes" className="notes-label">
                  Notes (optional):
                </label>
                <input
                  id="notes"
                  type="text"
                  placeholder="e.g., felt easy, used belt, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="notes-input"
                />
              </div>

              <button
                onClick={saveRecord}
                disabled={isSaving}
                className="save-button"
              >
                {isSaving ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Records */}
      {exerciseRecords.length > 0 && (
        <div className="mb-20">
          <h3>Recent Records for {selectedExercise?.name}</h3>
          <div className="records-container">
            {exerciseRecords.slice(0, 5).map((record) => (
              <div key={record.id} className="record-item">
                <div className="record-header">
                  <div>
                    <strong>{record.oneRepMax} lbs</strong> - {record.workoutSet.Repetions} reps at {record.workoutSet.Weight} lbs
                  </div>
                  <div className="record-date">
                    {new Date(record.dateRecorded).toLocaleDateString()}
                  </div>
                </div>
                {record.notes && (
                  <div className="record-notes">
                    {record.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="success-message">
          ✅ Record saved successfully!
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default ExerciseOneRepMaxTracker;
