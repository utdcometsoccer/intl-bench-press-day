import React, { useState, useEffect } from 'react';
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
  }, []);

  // Load all available functions from storage
  const loadAvailableFunctions = async () => {
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
  };

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
    <div className="one-rep-max-calculator" style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      maxWidth: '500px',
      margin: '20px auto'
    }}>
      <h2>One Rep Max Calculator</h2>
      
      {/* Function Selection */}
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="function-select" style={{ display: 'block', marginBottom: '5px' }}>
          Select Formula:
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

      {/* Calculate Button */}
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

      {/* Results Display */}
      {result !== null && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>Result:</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#155724' }}>
            Estimated 1RM: {result} lbs
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#155724' }}>
            Based on {workoutSet.Repetions} reps at {workoutSet.Weight} lbs
          </p>
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

      {/* Function Info */}
      {selectedFunctionId && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Selected Formula:</h4>
          {availableFunctions.find(f => f.id === selectedFunctionId)?.description && (
            <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>
              {availableFunctions.find(f => f.id === selectedFunctionId)?.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default OneRepMaxCalculator;
