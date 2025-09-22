import React, { useState, useEffect } from 'react';
import type { FiveThreeOneCycle, FiveThreeOneWorkout } from './fiveThreeOneStorage';
import type { WorkoutResult, WorkoutSetResult, AssistanceExerciseResult } from './workoutResultsStorage';
import { fiveThreeOneStorage } from './fiveThreeOneStorage';
import { workoutResultsStorage, calculateEstimated1RM, calculateRPEDescription } from './workoutResultsStorage';

const WorkoutLogger: React.FC = () => {
  // State for current workout
  const [activeCycle, setActiveCycle] = useState<FiveThreeOneCycle | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [currentWorkout, setCurrentWorkout] = useState<FiveThreeOneWorkout | null>(null);
  const [workoutDate, setWorkoutDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // State for recording results
  const [warmupResults, setWarmupResults] = useState<WorkoutSetResult[]>([]);
  const [mainSetResults, setMainSetResults] = useState<WorkoutSetResult[]>([]);
  const [assistanceWork, setAssistanceWork] = useState<AssistanceExerciseResult[]>([]);
  const [overallRpe, setOverallRpe] = useState<number | undefined>();
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [bodyWeight, setBodyWeight] = useState<number | undefined>();
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);

  // State for past results
  const [pastResults, setPastResults] = useState<WorkoutResult[]>([]);
  const [showPastResults, setShowPastResults] = useState<boolean>(false);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    initializeWorkoutLogger();
  }, []);

  useEffect(() => {
    if (activeCycle && selectedWeek && selectedDay) {
      loadCurrentWorkout();
    }
  }, [activeCycle, selectedWeek, selectedDay]);

  useEffect(() => {
    if (currentWorkout) {
      loadPastResults();
    }
  }, [currentWorkout]);

  const initializeWorkoutLogger = async () => {
    try {
      setIsLoading(true);
      await fiveThreeOneStorage.initialize();
      await workoutResultsStorage.initialize();
      
      const active = await fiveThreeOneStorage.getActiveCycle();
      setActiveCycle(active);
      
      if (!active) {
        setError('No active 5-3-1 cycle found. Please create a cycle first in the 5-3-1 Planner.');
      }
    } catch (err) {
      setError(`Failed to initialize: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentWorkout = () => {
    if (!activeCycle) return;

    const workout = activeCycle.workouts.find(w => w.week === selectedWeek && w.day === selectedDay);
    setCurrentWorkout(workout || null);

    if (workout) {
      // Initialize results arrays with planned values
      const initialWarmupResults: WorkoutSetResult[] = workout.warmupSets.map(set => ({
        plannedReps: set.reps,
        plannedWeight: set.weight,
        actualReps: set.reps,
        actualWeight: set.weight,
        percentage: set.percentage,
        isAmrap: false
      }));

      const initialMainSetResults: WorkoutSetResult[] = workout.mainSets.map(set => ({
        plannedReps: set.reps,
        plannedWeight: set.weight,
        actualReps: set.reps,
        actualWeight: set.weight,
        percentage: set.percentage,
        isAmrap: set.isAmrap || false
      }));

      setWarmupResults(initialWarmupResults);
      setMainSetResults(initialMainSetResults);
      
      // Initialize assistance work
      const initialAssistance: AssistanceExerciseResult[] = (workout.assistanceExercises || []).slice(0, 3).map(name => ({
        exerciseName: name,
        sets: [{ reps: 0, weight: 0 }]
      }));
      setAssistanceWork(initialAssistance);
      
      // Reset other fields
      setWorkoutNotes('');
      setOverallRpe(undefined);
      setBodyWeight(undefined);
      setStartTime(new Date());
      setEndTime(null);
    }
  };

  const loadPastResults = async () => {
    if (!currentWorkout) return;

    try {
      const results = await workoutResultsStorage.getWorkoutResultsByExercise(currentWorkout.exerciseId);
      setPastResults(results.slice(0, 5)); // Show last 5 results
    } catch (err) {
      console.error('Failed to load past results:', err);
    }
  };

  const updateWarmupResult = (index: number, field: keyof WorkoutSetResult, value: any) => {
    setWarmupResults(prev => prev.map((result, i) => 
      i === index ? { ...result, [field]: value } : result
    ));
  };

  const updateMainSetResult = (index: number, field: keyof WorkoutSetResult, value: any) => {
    setMainSetResults(prev => prev.map((result, i) => 
      i === index ? { ...result, [field]: value } : result
    ));
  };

  const updateAssistanceWork = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
    setAssistanceWork(prev => prev.map((exercise, ei) => 
      ei === exerciseIndex 
        ? {
            ...exercise,
            sets: exercise.sets.map((set, si) => 
              si === setIndex ? { ...set, [field]: value } : set
            )
          }
        : exercise
    ));
  };

  const addAssistanceSet = (exerciseIndex: number) => {
    setAssistanceWork(prev => prev.map((exercise, ei) => 
      ei === exerciseIndex 
        ? { ...exercise, sets: [...exercise.sets, { reps: 0, weight: 0 }] }
        : exercise
    ));
  };

  const removeAssistanceSet = (exerciseIndex: number, setIndex: number) => {
    setAssistanceWork(prev => prev.map((exercise, ei) => 
      ei === exerciseIndex 
        ? { ...exercise, sets: exercise.sets.filter((_, si) => si !== setIndex) }
        : exercise
    ));
  };

  const saveWorkoutResult = async () => {
    if (!activeCycle || !currentWorkout) {
      setError('No workout selected');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      setEndTime(new Date());
      const duration = Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60)); // Duration in minutes

      const workoutResult: WorkoutResult = {
        id: `result_${currentWorkout.id}_${Date.now()}`,
        cycleId: activeCycle.id,
        cycleName: activeCycle.name,
        workoutId: currentWorkout.id,
        exerciseId: currentWorkout.exerciseId,
        exerciseName: currentWorkout.exerciseName,
        week: selectedWeek,
        day: selectedDay,
        datePerformed: new Date(workoutDate),
        warmupResults: warmupResults.filter(r => r.actualReps > 0),
        mainSetResults: mainSetResults.filter(r => r.actualReps > 0),
        assistanceWork: assistanceWork.filter(ex => ex.sets.some(s => s.reps > 0)),
        overallRpe,
        workoutNotes: workoutNotes.trim() || undefined,
        duration,
        bodyWeight
      };

      await workoutResultsStorage.saveWorkoutResult(workoutResult);
      
      setSuccess('Workout saved successfully!');
      setTimeout(() => setSuccess(''), 3000);

      // Reload past results
      await loadPastResults();
      
    } catch (err) {
      setError(`Failed to save workout: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getEstimated1RM = (weight: number, reps: number): number => {
    return calculateEstimated1RM(weight, reps);
  };

  if (isLoading) {
    return (
      <div className="workout-logger">
        <h2>Workout Logger</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (!activeCycle) {
    return (
      <div className="workout-logger" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Workout Logger</h2>
        <p>No active 5-3-1 cycle found. Please create and activate a cycle first in the 5-3-1 Planner.</p>
      </div>
    );
  }

  return (
    <div className="workout-logger" style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      maxWidth: '1000px',
      margin: '20px auto'
    }}>
      <h2>Workout Logger</h2>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>
        Active Cycle: <strong>{activeCycle.name}</strong>
      </p>

      {/* Workout Selection */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '6px' 
      }}>
        <h3 style={{ marginTop: 0 }}>Select Workout</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label htmlFor="week-select" style={{ display: 'block', marginBottom: '5px' }}>
              Week:
            </label>
            <select
              id="week-select"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              <option value={1}>Week 1 (5/5/5+)</option>
              <option value={2}>Week 2 (3/3/3+)</option>
              <option value={3}>Week 3 (5/3/1+)</option>
              <option value={4}>Week 4 (Deload)</option>
            </select>
          </div>

          <div>
            <label htmlFor="day-select" style={{ display: 'block', marginBottom: '5px' }}>
              Day:
            </label>
            <select
              id="day-select"
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              <option value={1}>Day 1 - Squat</option>
              <option value={2}>Day 2 - Bench Press</option>
              <option value={3}>Day 3 - Deadlift</option>
              <option value={4}>Day 4 - Overhead Press</option>
            </select>
          </div>

          <div>
            <label htmlFor="workout-date" style={{ display: 'block', marginBottom: '5px' }}>
              Date:
            </label>
            <input
              id="workout-date"
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
        </div>

        {currentWorkout && (
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #dee2e6' }}>
            <strong>{currentWorkout.exerciseName}</strong> - Week {selectedWeek}, Day {selectedDay}
          </div>
        )}
      </div>

      {currentWorkout && (
        <>
          {/* Warmup Sets */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Warmup Sets</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {warmupResults.map((result, index) => (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '100px 100px 100px 100px 80px 1fr', 
                  gap: '10px', 
                  alignItems: 'center',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    Set {index + 1}
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', display: 'block' }}>Planned: {result.plannedReps} × {result.plannedWeight}</label>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={result.actualReps}
                      onChange={(e) => updateWarmupResult(index, 'actualReps', Number(e.target.value))}
                      placeholder="Reps"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={result.actualWeight}
                      onChange={(e) => updateWarmupResult(index, 'actualWeight', Number(e.target.value))}
                      placeholder="Weight"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={result.rpe || ''}
                      onChange={(e) => updateWarmupResult(index, 'rpe', Number(e.target.value) || undefined)}
                      placeholder="RPE"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={result.notes || ''}
                      onChange={(e) => updateWarmupResult(index, 'notes', e.target.value)}
                      placeholder="Notes"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Sets */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Main Sets</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {mainSetResults.map((result, index) => (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '100px 120px 100px 100px 80px 100px 1fr', 
                  gap: '10px', 
                  alignItems: 'center',
                  padding: '10px',
                  border: result.isAmrap ? '2px solid #dc3545' : '1px solid #dee2e6',
                  borderRadius: '4px',
                  backgroundColor: result.isAmrap ? '#fff5f5' : 'white'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    Set {index + 1}
                    {result.isAmrap && <div style={{ fontSize: '10px', color: '#dc3545' }}>AMRAP</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', display: 'block' }}>
                      Planned: {result.plannedReps}{result.isAmrap ? '+' : ''} × {result.plannedWeight}
                    </label>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={result.actualReps}
                      onChange={(e) => updateMainSetResult(index, 'actualReps', Number(e.target.value))}
                      placeholder="Reps"
                      style={{ 
                        width: '100%', 
                        padding: '4px', 
                        fontSize: '12px',
                        fontWeight: result.isAmrap ? 'bold' : 'normal'
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={result.actualWeight}
                      onChange={(e) => updateMainSetResult(index, 'actualWeight', Number(e.target.value))}
                      placeholder="Weight"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={result.rpe || ''}
                      onChange={(e) => updateMainSetResult(index, 'rpe', Number(e.target.value) || undefined)}
                      placeholder="RPE"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#6c757d' }}>
                    {result.actualReps > 0 && result.actualWeight > 0 && (
                      <>Est. 1RM: {getEstimated1RM(result.actualWeight, result.actualReps)}</>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={result.notes || ''}
                      onChange={(e) => updateMainSetResult(index, 'notes', e.target.value)}
                      placeholder="Notes"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assistance Work */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Assistance Work</h3>
            {assistanceWork.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>{exercise.exerciseName}</h4>
                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '80px 100px 100px 80px 1fr 80px', 
                    gap: '10px', 
                    alignItems: 'center',
                    marginBottom: '5px'
                  }}>
                    <div style={{ fontSize: '12px' }}>Set {setIndex + 1}</div>
                    <input
                      type="number"
                      min="0"
                      value={set.reps}
                      onChange={(e) => updateAssistanceWork(exerciseIndex, setIndex, 'reps', Number(e.target.value))}
                      placeholder="Reps"
                      style={{ padding: '4px', fontSize: '12px' }}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={set.weight || ''}
                      onChange={(e) => updateAssistanceWork(exerciseIndex, setIndex, 'weight', Number(e.target.value) || undefined)}
                      placeholder="Weight"
                      style={{ padding: '4px', fontSize: '12px' }}
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={set.rpe || ''}
                      onChange={(e) => updateAssistanceWork(exerciseIndex, setIndex, 'rpe', Number(e.target.value) || undefined)}
                      placeholder="RPE"
                      style={{ padding: '4px', fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      value={set.notes || ''}
                      onChange={(e) => updateAssistanceWork(exerciseIndex, setIndex, 'notes', e.target.value)}
                      placeholder="Notes"
                      style={{ padding: '4px', fontSize: '12px' }}
                    />
                    <button
                      onClick={() => removeAssistanceSet(exerciseIndex, setIndex)}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addAssistanceSet(exerciseIndex)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}
                >
                  Add Set
                </button>
              </div>
            ))}
          </div>

          {/* Workout Summary */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <h3 style={{ marginTop: 0 }}>Workout Summary</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label htmlFor="overall-rpe" style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Overall RPE (1-10):
                </label>
                <input
                  id="overall-rpe"
                  type="number"
                  min="1"
                  max="10"
                  value={overallRpe || ''}
                  onChange={(e) => setOverallRpe(Number(e.target.value) || undefined)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
                {overallRpe && (
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                    {calculateRPEDescription(overallRpe)}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="body-weight" style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Body Weight (lbs):
                </label>
                <input
                  id="body-weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={bodyWeight || ''}
                  onChange={(e) => setBodyWeight(Number(e.target.value) || undefined)}
                  placeholder="Optional"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: '14px', marginBottom: '5px' }}>Workout Duration:</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#007bff' }}>
                  {Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60))} minutes
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="workout-notes" style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Workout Notes:
              </label>
              <textarea
                id="workout-notes"
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="How did the workout feel? Any observations?"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveWorkoutResult}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isSaving ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginBottom: '20px'
            }}
          >
            {isSaving ? 'Saving Workout...' : 'Save Workout Results'}
          </button>

          {/* Past Results Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowPastResults(!showPastResults)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showPastResults ? 'Hide' : 'Show'} Past Results for {currentWorkout.exerciseName}
            </button>
          </div>

          {/* Past Results */}
          {showPastResults && pastResults.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Past Results - {currentWorkout.exerciseName}</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {pastResults.map((result) => (
                  <div key={result.id} style={{
                    padding: '15px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong>{result.cycleName} - Week {result.week}</strong>
                      <span style={{ fontSize: '14px', color: '#6c757d' }}>
                        {new Date(result.datePerformed).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '14px' }}>
                      <strong>Main Sets:</strong>
                      {result.mainSetResults.map((set, index) => (
                        <span key={index} style={{ marginLeft: '10px' }}>
                          {set.actualReps}×{set.actualWeight}{set.isAmrap ? '+' : ''}
                          {index < result.mainSetResults.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                    
                    {result.workoutNotes && (
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px', fontStyle: 'italic' }}>
                        "{result.workoutNotes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Success Message */}
      {success && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          marginBottom: '15px',
          color: '#0c5460'
        }}>
          ✅ {success}
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

export default WorkoutLogger;
