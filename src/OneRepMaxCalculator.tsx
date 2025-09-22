import React, { useState, useEffect, useCallback } from 'react';
import type { WorkoutSet } from './types';
import { oneRepMaxStorage, initializeWithPredefinedFormulas } from './oneRepMaxStorage';

interface StoredFunctionInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OneRepMaxCalculator: React.FC = () => {
  const [availableFunctions, setAvailableFunctions] = useState<StoredFunctionInfo[]>([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>('');
  const [workoutSet, setWorkoutSet] = useState<WorkoutSet>({ Repetions: 5, Weight: 135 });
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all available functions from storage
  const loadAvailableFunctions = useCallback(async () => {
    try {
      const functions = await oneRepMaxStorage.listFunctions();
      setAvailableFunctions(functions);
      
      // Auto-select the first function if available
      if (functions.length > 0 && !selectedFunctionId) {
        setSelectedFunctionId(functions[0].id);
      }
    } catch (err) {
      setError(`Failed to load functions: ${err}`);
    }
  }, [selectedFunctionId]);

  // Initialize the storage system and load available functions
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        setIsLoading(true);
        await initializeWithPredefinedFormulas();
        await loadAvailableFunctions();
      } catch (err) {
        setError(`Failed to initialize system: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSystem();
  }, [loadAvailableFunctions]);

  // Execute the selected function with the current workout set
  const calculateOneRepMax = async () => {
    if (!selectedFunctionId) {
      setError('Please select a function');
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
      setResult(Math.round(calculatedResult * 100) / 100); // Round to 2 decimal places
    } catch (err) {
      setError(`Calculation failed: ${err}`);
      setResult(null);
    }
  };

  // Handle workout set input changes
  const handleWorkoutSetChange = (field: keyof WorkoutSet, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setWorkoutSet(prev => ({
      ...prev,
      [field]: numericValue
    }));
    
    // Clear previous result when inputs change
    setResult(null);
  };

  if (isLoading) {
    return (
      <div className="one-rep-max-calculator">
        <h2>One Rep Max Calculator</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="one-rep-max-calculator">
      <h2>One Rep Max Calculator</h2>
      
      {/* Function Selection */}
      <div className="mb-20">
        <label htmlFor="function-select" className="form-label">
          Select Formula:
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

      {/* Calculate Button */}
      <button
        onClick={calculateOneRepMax}
        disabled={!selectedFunctionId}
        className="primary-button"
      >
        Calculate One Rep Max
      </button>

      {/* Results Display */}
      {result !== null && (
        <div className="info-message">
          <h3>Result:</h3>
          <p>
            Estimated 1RM: {result} lbs
          </p>
          <p className="record-details">
            Based on {workoutSet.Repetions} reps at {workoutSet.Weight} lbs
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Function Info */}
      {selectedFunctionId && (
        <div className="function-info">
          <h4>Selected Formula:</h4>
          {availableFunctions.find(f => f.id === selectedFunctionId)?.description && (
            <p>
              {availableFunctions.find(f => f.id === selectedFunctionId)?.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default OneRepMaxCalculator;
