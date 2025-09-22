import { type FC, useCallback, useEffect, useState } from 'react';
import type { ExerciseRecord } from '../services/exerciseRecordsStorage';
import { exerciseRecordsStorage } from '../services/exerciseRecordsStorage';
import type { FiveThreeOneCycle, FiveThreeOneMax } from '../services/fiveThreeOneStorage';
import {
  FIVE_THREE_ONE_MAIN_EXERCISES,
  calculateTrainingMax,
  fiveThreeOneStorage,
  generateWorkouts
} from '../services/fiveThreeOneStorage';

const FiveThreeOnePlanner: FC = () => {
  // State for creating new cycles
  const [cycleName, setCycleName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [customMaxes, setCustomMaxes] = useState<Record<string, number>>({});
  const [usePersonalRecords, setUsePersonalRecords] = useState<boolean>(true);

  // State for managing cycles
  const [cycles, setCycles] = useState<FiveThreeOneCycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<FiveThreeOneCycle | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<FiveThreeOneCycle | null>(null);
  const [personalRecords, setPersonalRecords] = useState<Map<string, ExerciseRecord>>(new Map());

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'view'>('create');

  const loadCycles = useCallback(async () => {
    try {
      const allCycles = await fiveThreeOneStorage.getAllCycles();
      setCycles(allCycles);

      const active = await fiveThreeOneStorage.getActiveCycle();
      setActiveCycle(active);
    } catch (err) {
      setError(`Failed to load cycles: ${err}`);
    }
  }, []);

  const loadPersonalRecords = useCallback(async () => {
    try {
      const records = await exerciseRecordsStorage.getPersonalRecords();
      setPersonalRecords(records);

      // Initialize custom maxes with personal records if available
      const initialMaxes: Record<string, number> = {};
      FIVE_THREE_ONE_MAIN_EXERCISES.forEach(exercise => {
        const record = records.get(exercise.id);
        if (record) {
          initialMaxes[exercise.id] = record.oneRepMax;
        }
      });
      setCustomMaxes(initialMaxes);
    } catch (err) {
      setError(`Failed to load personal records: ${err}`);
    }
  }, []);

  const initializeData = useCallback(async () => {
    try {
      setIsLoading(true);
      await fiveThreeOneStorage.initialize();
      await exerciseRecordsStorage.initialize();

      await Promise.all([
        loadCycles(),
        loadPersonalRecords()
      ]);

      // Set default cycle name
      setCycleName(`Cycle ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    } catch (err) {
      setError(`Failed to initialize: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [loadCycles, loadPersonalRecords]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const handleCustomMaxChange = (exerciseId: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setCustomMaxes(prev => ({
      ...prev,
      [exerciseId]: numericValue
    }));
  };

  const createCycle = async () => {
    if (!cycleName.trim()) {
      setError('Please enter a cycle name');
      return;
    }

    // Validate that we have maxes for all main exercises
    const maxes: FiveThreeOneMax[] = [];
    for (const exercise of FIVE_THREE_ONE_MAIN_EXERCISES) {
      let oneRepMax = 0;

      if (usePersonalRecords) {
        const record = personalRecords.get(exercise.id);
        if (record) {
          oneRepMax = record.oneRepMax;
        }
      } else {
        oneRepMax = customMaxes[exercise.id] || 0;
      }

      if (oneRepMax <= 0) {
        setError(`Please provide a valid one-rep max for ${exercise.name}`);
        return;
      }

      maxes.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        oneRepMax,
        trainingMax: calculateTrainingMax(oneRepMax)
      });
    }

    try {
      setIsCreating(true);
      setError('');

      // Generate workouts for the cycle
      const workouts = generateWorkouts(maxes);

      // Create the cycle
      const cycle: FiveThreeOneCycle = {
        id: `cycle_${Date.now()}`,
        name: cycleName.trim(),
        startDate: new Date(startDate),
        createdDate: new Date(),
        maxes,
        workouts,
        notes: notes.trim() || undefined,
        isActive: true // Make this the active cycle
      };

      // Save the cycle
      await fiveThreeOneStorage.saveCycle(cycle);

      // Set as active cycle (deactivates others)
      await fiveThreeOneStorage.setActiveCycle(cycle.id);

      // Refresh the cycles list
      await loadCycles();

      // Reset form
      setCycleName(`Cycle ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
      setNotes('');
      setSuccess('5-3-1 cycle created successfully!');
      setTimeout(() => setSuccess(''), 3000);

      // Switch to manage tab
      setActiveTab('manage');
    } catch (err) {
      setError(`Failed to create cycle: ${err}`);
    } finally {
      setIsCreating(false);
    }
  };

  const setActiveCycleHandler = async (cycleId: string) => {
    try {
      await fiveThreeOneStorage.setActiveCycle(cycleId);
      await loadCycles();
      setSuccess('Active cycle updated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(`Failed to set active cycle: ${err}`);
    }
  };

  const deleteCycle = async (cycleId: string) => {
    if (!confirm('Are you sure you want to delete this cycle?')) return;

    try {
      await fiveThreeOneStorage.deleteCycle(cycleId);
      await loadCycles();
      if (selectedCycle?.id === cycleId) {
        setSelectedCycle(null);
      }
      setSuccess('Cycle deleted successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(`Failed to delete cycle: ${err}`);
    }
  };

  const renderWorkoutWeek = (cycle: FiveThreeOneCycle, week: number) => {
    const weekWorkouts = cycle.workouts.filter(w => w.week === week);
    const weekName = week === 4 ? `Week ${week} (Deload)` : `Week ${week}`;

    return (
      <div key={week} className="workout-week">
        <h4 className="week-title">
          {weekName}
        </h4>

        <div className="workouts-grid">
          {weekWorkouts.sort((a, b) => a.day - b.day).map(workout => (
            <div key={workout.id} className="workout-card">
              <h5 className="workout-title">
                Day {workout.day}: {workout.exerciseName}
              </h5>

              {/* Warmup Sets */}
              <div className="workout-section">
                <strong className="workout-section-title">Warmup:</strong>
                {workout.warmupSets.map((set, index) => (
                  <div key={index} className="workout-set-detail">
                    {set.reps} × {set.weight} lbs ({set.percentage}%)
                  </div>
                ))}
              </div>

              {/* Main Sets */}
              <div className="workout-section">
                <strong className="workout-section-title main-sets">Main Sets:</strong>
                {workout.mainSets.map((set, index) => (
                  <div key={index} className={`workout-set-detail ${set.isAmrap ? 'amrap' : ''}`}>
                    {set.reps}{set.isAmrap ? '+' : ''} × {set.weight} lbs ({set.percentage}%)
                    {set.isAmrap && <span className="amrap-indicator"> (AMRAP)</span>}
                  </div>
                ))}
              </div>

              {/* Assistance Exercises */}
              {workout.assistanceExercises && workout.assistanceExercises.length > 0 && (
                <div>
                  <strong className="workout-section-title">Suggested Assistance:</strong>
                  <div className="assistance-exercises">
                    {workout.assistanceExercises.slice(0, 3).join(', ')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="five-three-one-planner">
        <h2>5-3-1 Workout Planner</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="five-three-one-planner">
      <h2>5-3-1 Workout Planner</h2>

      {/* Tab Navigation */}
      <div className="planner-tab-navigation">
        {[
          { key: 'create' as const, label: 'Create Cycle' },
          { key: 'manage' as const, label: 'Manage Cycles' },
          { key: 'view' as const, label: 'View Workouts' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`planner-tab-button ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create Cycle Tab */}
      {activeTab === 'create' && (
        <div>
          <h3>Create New 5-3-1 Cycle</h3>

          <div className="form-grid two-column">
            <div>
              <label htmlFor="cycle-name" className="form-label">
                Cycle Name:
              </label>
              <input
                id="cycle-name"
                type="text"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="e.g., Cycle 2025-01"
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="start-date" className="form-label">
                Start Date:
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="notes" className="form-label">
              Notes (optional):
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this cycle..."
              rows={3}
              className="form-textarea"
            />
          </div>

          {/* One Rep Max Configuration */}
          <div className="one-rep-max-config">
            <h4 className="config-title">One Rep Max Configuration</h4>

            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={usePersonalRecords}
                  onChange={() => setUsePersonalRecords(true)}
                  className="radio-input"
                />
                Use Personal Records (from Exercise Tracker)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={!usePersonalRecords}
                  onChange={() => setUsePersonalRecords(false)}
                  className="radio-input"
                />
                Enter Custom Maxes
              </label>
            </div>

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
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={customMaxes[exercise.id] || ''}
                          onChange={(e) => handleCustomMaxChange(exercise.id, e.target.value)}
                          placeholder="Enter 1RM"
                          className="custom-max-input"
                        />
                        {currentValue > 0 && (
                          <p className="training-max-info">
                            Training Max: {trainingMax} lbs (90%)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={createCycle}
            disabled={isCreating || !cycleName.trim()}
            className="create-cycle-button"
          >
            {isCreating ? 'Creating Cycle...' : 'Create 5-3-1 Cycle'}
          </button>
        </div>
      )}

      {/* Manage Cycles Tab */}
      {activeTab === 'manage' && (
        <div>
          <h3>Manage Cycles</h3>

          {cycles.length === 0 ? (
            <p>No cycles created yet. Create your first cycle in the "Create Cycle" tab.</p>
          ) : (
            <div className="cycles-grid">
              {cycles.map(cycle => (
                <div key={cycle.id} className={`cycle-card ${cycle.isActive ? 'active' : ''}`}>
                  <div className="cycle-header">
                    <div>
                      <h4 className="cycle-title">
                        {cycle.name}
                        {cycle.isActive && <span className="active-indicator"> (Active)</span>}
                      </h4>
                      <p className="cycle-date">
                        Start Date: {new Date(cycle.startDate).toLocaleDateString()}
                      </p>
                      <p className="cycle-created-date">
                        Created: {new Date(cycle.createdDate).toLocaleDateString()}
                      </p>
                      {cycle.notes && (
                        <p className="cycle-notes">
                          "{cycle.notes}"
                        </p>
                      )}
                    </div>

                    <div className="cycle-actions">
                      <button
                        onClick={() => setSelectedCycle(cycle)}
                        className="cycle-action-button view"
                      >
                        View
                      </button>

                      {!cycle.isActive && (
                        <button
                          onClick={() => setActiveCycleHandler(cycle.id)}
                          className="cycle-action-button activate"
                        >
                          Set Active
                        </button>
                      )}

                      <button
                        onClick={() => deleteCycle(cycle.id)}
                        className="cycle-action-button delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Workouts Tab */}
      {activeTab === 'view' && (
        <div>
          <h3>View Workouts</h3>

          {!selectedCycle && activeCycle && (
            <>
              <p>Showing workouts for active cycle: <strong>{activeCycle.name}</strong></p>
              <div className="view-workouts-section">
                {[1, 2, 3, 4].map(week => renderWorkoutWeek(activeCycle, week))}
              </div>
            </>
          )}

          {selectedCycle && (
            <>
              <div className="view-cycle-selector">
                <p>Showing workouts for: <strong>{selectedCycle.name}</strong></p>
                <button
                  onClick={() => setSelectedCycle(null)}
                  className="cycle-action-button view"
                >
                  Back to Active Cycle
                </button>
              </div>

              <div className="view-workouts-section">
                {[1, 2, 3, 4].map(week => renderWorkoutWeek(selectedCycle, week))}
              </div>
            </>
          )}

          {!activeCycle && !selectedCycle && (
            <p>No active cycle found. Create a cycle first to view workouts.</p>
          )}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="success-message">
          ✅ {success}
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

export default FiveThreeOnePlanner;
