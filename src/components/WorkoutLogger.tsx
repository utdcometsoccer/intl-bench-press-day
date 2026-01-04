import { type FC, useState, useEffect, useCallback } from 'react';
import type { WorkoutPlan, UnifiedWorkout, WorkoutSet } from '../types';
import type { WorkoutResult, WorkoutSetResult, AssistanceExerciseResult } from '../services/workoutResultsStorage';
import type { PlateCalculation } from '../types/plateCalculator';
import { fiveThreeOneStorage } from '../services/fiveThreeOneStorage';
import { workoutResultsStorage, calculateEstimated1RM, calculateRPEDescription } from '../services/workoutResultsStorage';
import { exerciseRecordsStorage } from '../services/exerciseRecordsStorage';
import { oneRepMaxStorage } from '../services/oneRepMaxStorage';
import { findExerciseById } from '../exercises';
import { 
  convertCycleToPlan, 
  getWorkoutByWeekAndDay,
  isFiveThreeOnePlan,
  getWorkoutDisplayName 
} from '../services/workoutPlanStorage';
import PlateCalculator from './PlateCalculator';

const WorkoutLogger: FC = () => {
  // State for current workout plan
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [currentWorkout, setCurrentWorkout] = useState<UnifiedWorkout | null>(null);
  const [workoutDate, setWorkoutDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // State for recording results
  const [warmupResults, setWarmupResults] = useState<WorkoutSetResult[]>([]);
  const [mainSetResults, setMainSetResults] = useState<WorkoutSetResult[]>([]);
  const [assistanceWork, setAssistanceWork] = useState<AssistanceExerciseResult[]>([]);
  const [overallRpe, setOverallRpe] = useState<number | undefined>();
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [bodyWeight, setBodyWeight] = useState<number | undefined>();
  const [startTime, setStartTime] = useState<Date>(new Date());

  // State for past results
  const [pastResults, setPastResults] = useState<WorkoutResult[]>([]);
  const [showPastResults, setShowPastResults] = useState<boolean>(false);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Plate calculator state
  const [showPlateCalculator, setShowPlateCalculator] = useState<boolean>(false);
  const [plateCalculatorWeight, setPlateCalculatorWeight] = useState<number>(135);
  const [currentCalculation, setCurrentCalculation] = useState<PlateCalculation | null>(null);

  // 1RM save dialog state
  const [show1RMDialog, setShow1RMDialog] = useState<boolean>(false);
  const [pendingAmrapSet, setPendingAmrapSet] = useState<{ weight: number; reps: number; estimated1RM: number } | null>(null);
  const [isSaving1RM, setIsSaving1RM] = useState<boolean>(false);

  // Helper function to initialize workout state with planned values
  const initializeWorkoutState = useCallback((workout: UnifiedWorkout) => {
    // Initialize results arrays with planned values
    const initialWarmupResults: WorkoutSetResult[] = (workout.warmupSets || []).map(set => ({
      plannedReps: set.reps,
      plannedWeight: set.weight,
      actualReps: set.reps,
      actualWeight: set.weight,
      percentage: set.percentage || 0,
      isAmrap: false
    }));

    const initialMainSetResults: WorkoutSetResult[] = workout.mainSets.map(set => ({
      plannedReps: set.reps,
      plannedWeight: set.weight,
      actualReps: set.reps,
      actualWeight: set.weight,
      percentage: set.percentage || 0,
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
  }, []);

  const loadCurrentWorkout = useCallback(() => {
    if (!activePlan) return;

    // Only auto-load for 5-3-1 plans
    // Custom plans use manual selection via dropdown
    if (isFiveThreeOnePlan(activePlan)) {
      const workout = getWorkoutByWeekAndDay(activePlan, selectedWeek, selectedDay);
      setCurrentWorkout(workout);

      if (workout) {
        initializeWorkoutState(workout);
      }
    }
  }, [activePlan, selectedWeek, selectedDay, initializeWorkoutState]);

  // Handler for custom workout selection
  const handleCustomWorkoutChange = useCallback((workout: UnifiedWorkout | null) => {
    setCurrentWorkout(workout);
    
    if (workout) {
      initializeWorkoutState(workout);
    }
  }, [initializeWorkoutState]);

  const loadPastResults = useCallback(async () => {
    if (!currentWorkout) return;

    try {
      const results = await workoutResultsStorage.getWorkoutResultsByExercise(currentWorkout.exerciseId);
      setPastResults(results.slice(0, 5)); // Show last 5 results
    } catch (err) {
      console.error('Failed to load past results:', err);
    }
  }, [currentWorkout]);

  useEffect(() => {
    initializeWorkoutLogger();
  }, []);

  useEffect(() => {
    // Only auto-load workouts for 5-3-1 plans
    if (activePlan && isFiveThreeOnePlan(activePlan) && selectedWeek && selectedDay) {
      loadCurrentWorkout();
    }
  }, [activePlan, selectedWeek, selectedDay, loadCurrentWorkout]);

  useEffect(() => {
    if (currentWorkout) {
      loadPastResults();
    }
  }, [currentWorkout, loadPastResults]);

  const initializeWorkoutLogger = async () => {
    try {
      setIsLoading(true);
      await fiveThreeOneStorage.initialize();
      await workoutResultsStorage.initialize();
      
      const activeCycle = await fiveThreeOneStorage.getActiveCycle();
      
      if (activeCycle) {
        // Convert 5-3-1 cycle to unified plan
        const plan = convertCycleToPlan(activeCycle);
        setActivePlan(plan);
      } else {
        setError('No active workout plan found. Please create a cycle first in the 5-3-1 Planner.');
      }
    } catch (err) {
      setError(`Failed to initialize: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Plate calculator helpers
  const openPlateCalculator = (weight: number) => {
    setPlateCalculatorWeight(weight || 135);
    setShowPlateCalculator(true);
  };

  const handlePlateCalculatorChange = (calculation: PlateCalculation | null) => {
    setCurrentCalculation(calculation);
  };

  const updateWarmupResult = (index: number, field: keyof WorkoutSetResult, value: string | number | boolean | undefined) => {
    setWarmupResults(prev => prev.map((result, i) => 
      i === index ? { ...result, [field]: value } : result
    ));
  };

  const updateMainSetResult = (index: number, field: keyof WorkoutSetResult, value: string | number | boolean | undefined) => {
    setMainSetResults(prev => prev.map((result, i) => 
      i === index ? { ...result, [field]: value } : result
    ));
  };

  const updateAssistanceWork = (exerciseIndex: number, setIndex: number, field: string, value: string | number | undefined) => {
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
    if (!activePlan || !currentWorkout) {
      setError('No workout selected');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const duration = Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60)); // Duration in minutes

      const workoutResult: WorkoutResult = {
        id: `result_${currentWorkout.id}_${Date.now()}`,
        cycleId: activePlan.id,
        cycleName: activePlan.name,
        workoutId: currentWorkout.id,
        exerciseId: currentWorkout.exerciseId,
        exerciseName: currentWorkout.exerciseName,
        week: currentWorkout.week || 0,
        day: currentWorkout.day || 0,
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
      
      // Check if there's an AMRAP set to offer 1RM recording
      const amrapSet = mainSetResults.find(set => set.isAmrap && set.actualReps > 0 && set.actualWeight > 0);
      if (amrapSet) {
        const estimated1RM = calculateEstimated1RM(amrapSet.actualWeight, amrapSet.actualReps);
        setPendingAmrapSet({
          weight: amrapSet.actualWeight,
          reps: amrapSet.actualReps,
          estimated1RM
        });
        setShow1RMDialog(true);
      }
      
    } catch (err) {
      setError(`Failed to save workout: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const save1RMRecord = async () => {
    if (!currentWorkout || !pendingAmrapSet) {
      return;
    }

    try {
      setIsSaving1RM(true);
      setError('');

      // Initialize storage if needed
      await exerciseRecordsStorage.initialize();
      await oneRepMaxStorage.initialize();

      // Find the exercise
      const exercise = await findExerciseById(currentWorkout.exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      // Create workout set
      const workoutSet: WorkoutSet = {
        Repetions: pendingAmrapSet.reps,
        Weight: pendingAmrapSet.weight
      };

      // Save the record using Epley formula (default)
      await exerciseRecordsStorage.saveRecord(
        exercise,
        workoutSet,
        pendingAmrapSet.estimated1RM,
        'Epley',
        'epley',
        `AMRAP set from ${currentWorkout.exerciseName} workout`
      );

      setSuccess('1RM record saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShow1RMDialog(false);
      setPendingAmrapSet(null);
      
    } catch (err) {
      setError(`Failed to save 1RM record: ${err}`);
    } finally {
      setIsSaving1RM(false);
    }
  };

  const decline1RMSave = () => {
    setShow1RMDialog(false);
    setPendingAmrapSet(null);
  };

  const getEstimated1RM = (weight: number, reps: number): number => {
    return calculateEstimated1RM(weight, reps);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <h2>Workout Logger</h2>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="no-cycle-message">
        <h2>Workout Logger</h2>
        <p>No active workout plan found. Please create and activate a cycle first in the 5-3-1 Planner.</p>
      </div>
    );
  }

  const is531Plan = isFiveThreeOnePlan(activePlan);

  return (
    <div className="workout-logger extra-large-component-container">
      <h2>Workout Logger</h2>
      <p className="active-cycle-info">
        Active Plan: <strong>{activePlan.name}</strong> ({is531Plan ? '5-3-1 Cycle' : 'Custom Plan'})
      </p>

      {/* Workout Selection */}
      <div className="workout-selection">
        <h3>Select Workout</h3>
        
        <div className="filter-grid">
          {is531Plan && (
            <>
              <div>
                <label htmlFor="week-select" className="workout-selection-label">
                  Week:
                </label>
                <select
                  id="week-select"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="week-select"
                >
                  <option value={1}>Week 1 (5/5/5+)</option>
                  <option value={2}>Week 2 (3/3/3+)</option>
                  <option value={3}>Week 3 (5/3/1+)</option>
                  <option value={4}>Week 4 (Deload)</option>
                </select>
              </div>

              <div>
                <label htmlFor="day-select" className="form-label">
                  Day:
                </label>
                <select
                  id="day-select"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={1}>Day 1 - Squat</option>
                  <option value={2}>Day 2 - Bench Press</option>
                  <option value={3}>Day 3 - Deadlift</option>
                  <option value={4}>Day 4 - Overhead Press</option>
                </select>
              </div>
            </>
          )}

          {!is531Plan && (
            <div>
              <label htmlFor="workout-select" className="form-label">
                Workout:
              </label>
              <select
                id="workout-select"
                value={currentWorkout?.id || ''}
                onChange={(e) => {
                  if (!activePlan) return;
                  const workout = activePlan.workouts.find(w => w.id === e.target.value);
                  handleCustomWorkoutChange(workout || null);
                }}
                className="form-select"
                aria-label="Select workout from custom plan"
              >
                <option value="">Select a workout...</option>
                {activePlan.workouts.map(workout => (
                  <option key={workout.id} value={workout.id}>
                    {getWorkoutDisplayName(workout)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="workout-date" className="form-label">
              Date:
            </label>
            <input
              id="workout-date"
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {currentWorkout && (
          <div className="current-workout-info">
            <strong>{getWorkoutDisplayName(currentWorkout)}</strong>
          </div>
        )}
      </div>

      {currentWorkout && (
        <>
          {/* Warmup Sets */}
          <div className="form-section">
            <h3>Warmup Sets</h3>
            <div className="sets-grid">
              {warmupResults.map((result, index) => (
                <div key={index} className="set-row">
                  <div className="set-title">
                    Set {index + 1}
                  </div>
                  <div>
                    <label className="set-label">Planned: {result.plannedReps} × {result.plannedWeight}</label>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={result.actualReps}
                      onChange={(e) => updateWarmupResult(index, 'actualReps', Number(e.target.value))}
                      placeholder="Reps"
                      className="set-input"
                      aria-label={`Warmup set ${index + 1} actual reps`}
                    />
                  </div>
                  <div className="weight-input-container">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={result.actualWeight}
                      onChange={(e) => updateWarmupResult(index, 'actualWeight', Number(e.target.value))}
                      placeholder="Weight"
                      className="set-input"
                      aria-label={`Warmup set ${index + 1} actual weight`}
                    />
                    <button
                      type="button"
                      onClick={() => openPlateCalculator(result.actualWeight)}
                      className="plate-calculator-button"
                      title="Open plate calculator"
                      aria-label="Open plate calculator"
                    >
                      🏋️
                    </button>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={result.rpe || ''}
                      onChange={(e) => updateWarmupResult(index, 'rpe', Number(e.target.value) || undefined)}
                      placeholder="RPE"
                      className="set-input"
                      aria-label={`Warmup set ${index + 1} RPE`}
                    />
                  </div>
                  <div>
                    <textarea
                      value={result.notes || ''}
                      onChange={(e) => updateWarmupResult(index, 'notes', e.target.value)}
                      placeholder="Notes"
                      className="set-input set-notes-textarea"
                      rows={1}                      
                      aria-label={`Warmup set ${index + 1} notes`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Sets */}
          <div className="form-section">
            <h3>Main Sets</h3>
            <div className="sets-grid">
              {mainSetResults.map((result, index) => (
                <div key={index} className={`set-row ${result.isAmrap ? 'amrap-set' : ''}`}>
                  <div className="set-title">
                    Set {index + 1}
                    {result.isAmrap && <div className="amrap-warning">AMRAP</div>}
                  </div>
                  <div>
                    <label className="set-label">
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
                      className={`reps-input ${result.isAmrap ? 'amrap-input' : ''}`}
                      aria-label={`Main set ${index + 1} actual reps${result.isAmrap ? ' (AMRAP)' : ''}`}
                    />
                  </div>
                  <div className="weight-input-container">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={result.actualWeight}
                      onChange={(e) => updateMainSetResult(index, 'actualWeight', Number(e.target.value))}
                      placeholder="Weight"
                      className="weight-input"
                      aria-label={`Main set ${index + 1} actual weight`}
                    />
                    <button
                      type="button"
                      onClick={() => openPlateCalculator(result.actualWeight)}
                      className="plate-calculator-button"
                      title="Open plate calculator"
                      aria-label="Open plate calculator"
                    >
                      🏋️
                    </button>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={result.rpe || ''}
                      onChange={(e) => updateMainSetResult(index, 'rpe', Number(e.target.value) || undefined)}
                      placeholder="RPE"
                      className="weight-input"
                      aria-label={`Main set ${index + 1} RPE`}
                    />
                  </div>
                  <div className="estimated-1rm-display">
                    {result.actualReps > 0 && result.actualWeight > 0 && (
                      <>Est. 1RM: {getEstimated1RM(result.actualWeight, result.actualReps)}</>
                    )}
                  </div>
                  <div>
                    <textarea
                      value={result.notes || ''}
                      onChange={(e) => updateMainSetResult(index, 'notes', e.target.value)}
                      placeholder="Notes"
                      className="weight-input set-notes-textarea"
                      rows={1}
                      aria-label={`Main set ${index + 1} notes`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assistance Work */}
          <div className="assistance-section">
            <h3>Assistance Work</h3>
            {assistanceWork.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="assistance-exercise-card">
                <h4 className="assistance-exercise-title">{exercise.exerciseName}</h4>
                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="assistance-set-row">
                    <div className="assistance-set-label">Set {setIndex + 1}</div>
                    <input
                      type="number"
                      min="0"
                      value={set.reps}
                      onChange={(e) => updateAssistanceWork(exerciseIndex, setIndex, 'reps', Number(e.target.value))}
                      placeholder="Reps"
                      className="assistance-input assistance-reps-input"
                      aria-label={`${exercise.exerciseName} set ${setIndex + 1} reps`}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={set.weight || ''}
                      onChange={(e) => updateAssistanceWork(exerciseIndex, setIndex, 'weight', Number(e.target.value) || undefined)}
                      placeholder="Weight"
                      className="assistance-input assistance-weight-input"
                      aria-label={`${exercise.exerciseName} set ${setIndex + 1} weight`}
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={set.rpe || ''}
                      onChange={(e) => updateAssistanceWork(exerciseIndex, setIndex, 'rpe', Number(e.target.value) || undefined)}
                      placeholder="RPE"
                      className="assistance-input assistance-reps-input"
                      aria-label={`${exercise.exerciseName} set ${setIndex + 1} RPE`}
                    />
                    <textarea
                      value={set.notes || ''}
                      onChange={(e) => updateAssistanceWork(exerciseIndex, setIndex, 'notes', e.target.value)}
                      placeholder="Notes"
                      className="assistance-input assistance-notes-textarea"
                      rows={1}
                      aria-label={`${exercise.exerciseName} set ${setIndex + 1} notes`}
                    />
                    <button
                      onClick={() => removeAssistanceSet(exerciseIndex, setIndex)}
                      className="assistance-action-button assistance-remove-button"
                      aria-label={`Remove set ${setIndex + 1} from ${exercise.exerciseName}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addAssistanceSet(exerciseIndex)}
                  className="assistance-add-set-button"
                  aria-label={`Add set to ${exercise.exerciseName}`}
                >
                  Add Set
                </button>
              </div>
            ))}
          </div>

          {/* Workout Summary */}
          <div className="workout-summary-container">
            <h3 className="workout-summary-title">Workout Summary</h3>
            
            <div className="summary-grid">
              <div>
                <label htmlFor="overall-rpe" className="summary-field-label">
                  Overall RPE (1-10):
                </label>
                <input
                  id="overall-rpe"
                  type="number"
                  min="1"
                  max="10"
                  value={overallRpe || ''}
                  onChange={(e) => setOverallRpe(Number(e.target.value) || undefined)}
                  className="rpe-input"
                />
                {overallRpe && (
                  <div className="rpe-description">
                    {calculateRPEDescription(overallRpe)}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="body-weight" className="summary-field-label">
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
                  className="body-weight-input"
                />
              </div>

              <div>
                <div className="duration-label">Workout Duration:</div>
                <div className="duration-display">
                  {Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60))} minutes
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="workout-notes" className="summary-field-label">
                Workout Notes:
              </label>
              <textarea
                id="workout-notes"
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="How did the workout feel? Any observations?"
                rows={3}
                className="notes-textarea"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveWorkoutResult}
            disabled={isSaving}
            className="save-workout-button"
          >
            {isSaving ? 'Saving Workout...' : 'Save Workout Results'}
          </button>

          {/* Past Results Toggle */}
          <div className="past-results-section">
            <button
              onClick={() => setShowPastResults(!showPastResults)}
              className="toggle-past-results-button"
            >
              {showPastResults ? 'Hide' : 'Show'} Past Results for {currentWorkout.exerciseName}
            </button>
          </div>

          {/* Past Results */}
          {showPastResults && pastResults.length > 0 && (
            <div className="past-results-container">
              <h3>Past Results - {currentWorkout.exerciseName}</h3>
              <div className="past-results-grid">
                {pastResults.map((result) => (
                  <div key={result.id} className="past-result-card">
                    <div className="past-result-header">
                      <strong>{result.cycleName} - Week {result.week}</strong>
                      <span className="past-result-date">
                        {new Date(result.datePerformed).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="past-result-sets">
                      <strong>Main Sets:</strong>
                      {result.mainSetResults.map((set, index) => (
                        <span key={index} className="past-result-set">
                          {set.actualReps}×{set.actualWeight}{set.isAmrap ? '+' : ''}
                          {index < result.mainSetResults.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                    
                    {result.workoutNotes && (
                      <div className="past-result-notes">
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
        <div className="success-alert">
          ✅ {success}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Plate Calculator Modal */}
      {showPlateCalculator && (
        <div className="plate-calculator-modal" onClick={() => setShowPlateCalculator(false)}>
          <div className="plate-calculator-content" onClick={e => e.stopPropagation()}>
            <div className="plate-calculator-header">
              <h3>Plate Calculator</h3>
              <button
                onClick={() => setShowPlateCalculator(false)}
                className="close-button"
                aria-label="Close plate calculator"
              >
                ✕
              </button>
            </div>
            <div className="plate-calculator-body">
              <PlateCalculator
                targetWeight={plateCalculatorWeight}
                onCalculationChange={handlePlateCalculatorChange}
                showInline={true}
              />
              {currentCalculation && (
                <div className="calculation-summary">
                  <p><strong>Load this weight:</strong> {currentCalculation.totalWeight} lbs</p>
                  <p><strong>Difference from target:</strong> {(currentCalculation.totalWeight - plateCalculatorWeight).toFixed(1)} lbs</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1RM Save Dialog */}
      {show1RMDialog && pendingAmrapSet && (
        <div className="plate-calculator-modal" onClick={decline1RMSave} role="dialog" aria-labelledby="save-1rm-title" aria-modal="true">
          <div className="plate-calculator-content" onClick={e => e.stopPropagation()}>
            <div className="plate-calculator-header">
              <h3 id="save-1rm-title">Save 1RM Record?</h3>
              <button
                onClick={decline1RMSave}
                className="close-button"
                aria-label="Close 1RM save dialog"
                disabled={isSaving1RM}
              >
                ✕
              </button>
            </div>
            <div className="plate-calculator-body">
              <p>You completed an AMRAP set! Would you like to save this as a 1RM record?</p>
              <div className="amrap-1rm-details">
                <p><strong>Weight:</strong> {pendingAmrapSet.weight} lbs</p>
                <p><strong>Reps:</strong> {pendingAmrapSet.reps}</p>
                <p><strong>Estimated 1RM:</strong> {pendingAmrapSet.estimated1RM.toFixed(1)} lbs</p>
                <p className="formula-note">(Calculated using Epley formula)</p>
              </div>
              <div className="dialog-actions">
                <button
                  onClick={save1RMRecord}
                  className="save-button"
                  disabled={isSaving1RM}
                  aria-label="Save 1RM record"
                >
                  {isSaving1RM ? 'Saving...' : 'Save 1RM Record'}
                </button>
                <button
                  onClick={decline1RMSave}
                  className="cancel-button"
                  disabled={isSaving1RM}
                  aria-label="Skip saving 1RM record"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLogger;
