import React, { useState, useEffect } from 'react';
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
  }, []);

  // Load exercise records when exercise changes
  useEffect(() => {
    if (selectedExerciseId) {
      loadExerciseRecords();
    } else {
      setExerciseRecords([]);
      setPersonalRecord(null);
    }
  }, [selectedExerciseId]);

  // Load available one-rep max functions
  const loadAvailableFunctions = async () => {
    try {
      const functions = await oneRepMaxStorage.listFunctions();
      setAvailableFunctions(functions);
      
      if (functions.length > 0 && !selectedFunctionId) {
        setSelectedFunctionId(functions[0].id);
      }
    } catch (err) {
      setError(`Failed to load functions: ${err}`);
    }
  };

  // Load records for the selected exercise
  const loadExerciseRecords = async () => {
    if (!selectedExerciseId) return;

    try {
      const records = await exerciseRecordsStorage.getRecordsByExercise(selectedExerciseId);
      setExerciseRecords(records);

      const bestRecord = await exerciseRecordsStorage.getBestRecordForExercise(selectedExerciseId);
      setPersonalRecord(bestRecord);
    } catch (err) {
      setError(`Failed to load exercise records: ${err}`);
    }
  };

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
    <div className="exercise-tracker" style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      maxWidth: '800px',
      margin: '20px auto'
    }}>
      <h2>Exercise One Rep Max Tracker</h2>

      {/* Exercise Selection */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h3 style={{ marginTop: 0 }}>Select Exercise</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label htmlFor="category-select" style={{ display: 'block', marginBottom: '5px' }}>
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
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              <option value="">-- Select Category --</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="exercise-select" style={{ display: 'block', marginBottom: '5px' }}>
              Exercise:
            </label>
            <select
              id="exercise-select"
              value={selectedExerciseId}
              onChange={(e) => handleExerciseChange(e.target.value)}
              disabled={!selectedCategory}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: selectedCategory ? 'white' : '#f5f5f5'
              }}
            >
              <option value="">-- Select Exercise --</option>
              {exercisesInCategory.map(exercise => (
                <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedExercise && (
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #dee2e6' }}>
            <h4 style={{ margin: '0 0 5px 0' }}>{selectedExercise.name}</h4>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6c757d' }}>
              {selectedExercise.description}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>
              <strong>Muscle Groups:</strong> {selectedExercise.muscleGroups.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Personal Record Display */}
      {personalRecord && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#d1ecf1', 
          border: '1px solid #bee5eb',
          borderRadius: '6px' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>Personal Record</h3>
          <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#0c5460' }}>
            {personalRecord.oneRepMax} lbs
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#0c5460' }}>
            Set on {new Date(personalRecord.dateRecorded).toLocaleDateString()} 
            ({personalRecord.workoutSet.Repetions} reps at {personalRecord.workoutSet.Weight} lbs)
          </p>
        </div>
      )}

      {/* Calculator Section */}
      {selectedExercise && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          <h3 style={{ marginTop: 0 }}>Calculate One Rep Max</h3>

          {/* Formula Selection */}
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="function-select" style={{ display: 'block', marginBottom: '5px' }}>
              Formula:
            </label>
            <select
              id="function-select"
              value={selectedFunctionId}
              onChange={(e) => setSelectedFunctionId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label htmlFor="repetitions" style={{ display: 'block', marginBottom: '5px' }}>
                Repetitions:
              </label>
              <input
                id="repetitions"
                type="number"
                min="1"
                value={workoutSet.Repetions}
                onChange={(e) => handleWorkoutSetChange('Repetions', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
            
            <div>
              <label htmlFor="weight" style={{ display: 'block', marginBottom: '5px' }}>
                Weight (lbs):
              </label>
              <input
                id="weight"
                type="number"
                min="0"
                step="0.01"
                value={workoutSet.Weight}
                onChange={(e) => handleWorkoutSetChange('Weight', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
          </div>

          <button
            onClick={calculateOneRepMax}
            disabled={!selectedFunctionId}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: selectedFunctionId ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedFunctionId ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              marginBottom: '15px'
            }}
          >
            Calculate One Rep Max
          </button>

          {/* Results and Save Section */}
          {result !== null && (
            <div style={{
              padding: '15px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>Calculated 1RM: {result} lbs</h4>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#155724' }}>
                Based on {workoutSet.Repetions} reps at {workoutSet.Weight} lbs
              </p>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="notes" style={{ display: 'block', marginBottom: '5px', color: '#155724' }}>
                  Notes (optional):
                </label>
                <input
                  id="notes"
                  type="text"
                  placeholder="e.g., felt easy, used belt, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #c3e6cb'
                  }}
                />
              </div>

              <button
                onClick={saveRecord}
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: isSaving ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Records */}
      {exerciseRecords.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Recent Records for {selectedExercise?.name}</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
            {exerciseRecords.slice(0, 5).map((record, index) => (
              <div key={record.id} style={{
                padding: '10px',
                borderBottom: index < 4 ? '1px solid #dee2e6' : 'none',
                backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{record.oneRepMax} lbs</strong> - {record.workoutSet.Repetions} reps at {record.workoutSet.Weight} lbs
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {new Date(record.dateRecorded).toLocaleDateString()}
                  </div>
                </div>
                {record.notes && (
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
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
        <div style={{
          padding: '15px',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          marginBottom: '15px',
          color: '#0c5460'
        }}>
          ✅ Record saved successfully!
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default ExerciseOneRepMaxTracker;
