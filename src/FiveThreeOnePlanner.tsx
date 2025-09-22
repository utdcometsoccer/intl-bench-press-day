import React, { useState, useEffect } from 'react';
import type { FiveThreeOneCycle, FiveThreeOneMax } from './fiveThreeOneStorage';
import type { ExerciseRecord } from './exerciseRecordsStorage';
import {
  fiveThreeOneStorage,
  FIVE_THREE_ONE_MAIN_EXERCISES,
  calculateTrainingMax,
  generateWorkouts
} from './fiveThreeOneStorage';
import { exerciseRecordsStorage } from './exerciseRecordsStorage';

const FiveThreeOnePlanner: React.FC = () => {
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

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
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
  };

  const loadCycles = async () => {
    try {
      const allCycles = await fiveThreeOneStorage.getAllCycles();
      setCycles(allCycles);
      
      const active = await fiveThreeOneStorage.getActiveCycle();
      setActiveCycle(active);
    } catch (err) {
      setError(`Failed to load cycles: ${err}`);
    }
  };

  const loadPersonalRecords = async () => {
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
  };

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
      <div key={week} style={{ marginBottom: '20px' }}>
        <h4 style={{ 
          color: '#007bff', 
          borderBottom: '2px solid #007bff', 
          paddingBottom: '5px',
          marginBottom: '15px'
        }}>
          {weekName}
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          {weekWorkouts.sort((a, b) => a.day - b.day).map(workout => (
            <div key={workout.id} style={{
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              padding: '15px',
              backgroundColor: 'white'
            }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                Day {workout.day}: {workout.exerciseName}
              </h5>
              
              {/* Warmup Sets */}
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ fontSize: '14px', color: '#6c757d' }}>Warmup:</strong>
                {workout.warmupSets.map((set, index) => (
                  <div key={index} style={{ fontSize: '14px', marginLeft: '10px' }}>
                    {set.reps} × {set.weight} lbs ({set.percentage}%)
                  </div>
                ))}
              </div>

              {/* Main Sets */}
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ fontSize: '14px', color: '#28a745' }}>Main Sets:</strong>
                {workout.mainSets.map((set, index) => (
                  <div key={index} style={{ 
                    fontSize: '14px', 
                    marginLeft: '10px',
                    fontWeight: set.isAmrap ? 'bold' : 'normal',
                    color: set.isAmrap ? '#dc3545' : 'inherit'
                  }}>
                    {set.reps}{set.isAmrap ? '+' : ''} × {set.weight} lbs ({set.percentage}%)
                    {set.isAmrap && <span style={{ fontSize: '12px' }}> (AMRAP)</span>}
                  </div>
                ))}
              </div>

              {/* Assistance Exercises */}
              {workout.assistanceExercises && workout.assistanceExercises.length > 0 && (
                <div>
                  <strong style={{ fontSize: '14px', color: '#6c757d' }}>Suggested Assistance:</strong>
                  <div style={{ fontSize: '12px', marginLeft: '10px', color: '#6c757d' }}>
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
    <div className="five-three-one-planner" style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      maxWidth: '1200px',
      margin: '20px auto'
    }}>
      <h2>5-3-1 Workout Planner</h2>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '20px',
        borderBottom: '1px solid #dee2e6'
      }}>
        {[
          { key: 'create', label: 'Create Cycle' },
          { key: 'manage', label: 'Manage Cycles' },
          { key: 'view', label: 'View Workouts' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #007bff' : '3px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              color: activeTab === tab.key ? '#007bff' : '#6c757d'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create Cycle Tab */}
      {activeTab === 'create' && (
        <div>
          <h3>Create New 5-3-1 Cycle</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label htmlFor="cycle-name" style={{ display: 'block', marginBottom: '5px' }}>
                Cycle Name:
              </label>
              <input
                id="cycle-name"
                type="text"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="e.g., Cycle 2025-01"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div>
              <label htmlFor="start-date" style={{ display: 'block', marginBottom: '5px' }}>
                Start Date:
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="notes" style={{ display: 'block', marginBottom: '5px' }}>
              Notes (optional):
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this cycle..."
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

          {/* One Rep Max Configuration */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <h4 style={{ marginTop: 0 }}>One Rep Max Configuration</h4>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={usePersonalRecords}
                  onChange={() => setUsePersonalRecords(true)}
                  style={{ marginRight: '8px' }}
                />
                Use Personal Records (from Exercise Tracker)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '5px' }}>
                <input
                  type="radio"
                  checked={!usePersonalRecords}
                  onChange={() => setUsePersonalRecords(false)}
                  style={{ marginRight: '8px' }}
                />
                Enter Custom Maxes
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {FIVE_THREE_ONE_MAIN_EXERCISES.map(exercise => {
                const personalRecord = personalRecords.get(exercise.id);
                const currentValue = usePersonalRecords 
                  ? (personalRecord?.oneRepMax || 0)
                  : (customMaxes[exercise.id] || 0);
                const trainingMax = currentValue ? calculateTrainingMax(currentValue) : 0;

                return (
                  <div key={exercise.id} style={{
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}>
                    <h5 style={{ margin: '0 0 10px 0' }}>{exercise.name}</h5>
                    
                    {usePersonalRecords ? (
                      <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                          <strong>PR:</strong> {personalRecord ? `${personalRecord.oneRepMax} lbs` : 'No record found'}
                        </p>
                        {personalRecord && (
                          <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>
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
                          style={{
                            width: '100%',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            marginBottom: '5px'
                          }}
                        />
                        {currentValue > 0 && (
                          <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>
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
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isCreating || !cycleName.trim() ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isCreating || !cycleName.trim() ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
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
            <div style={{ display: 'grid', gap: '15px' }}>
              {cycles.map(cycle => (
                <div key={cycle.id} style={{
                  padding: '15px',
                  border: cycle.isActive ? '2px solid #28a745' : '1px solid #dee2e6',
                  borderRadius: '6px',
                  backgroundColor: cycle.isActive ? '#f8fff9' : 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>
                        {cycle.name}
                        {cycle.isActive && <span style={{ color: '#28a745', fontSize: '14px' }}> (Active)</span>}
                      </h4>
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6c757d' }}>
                        Start Date: {new Date(cycle.startDate).toLocaleDateString()}
                      </p>
                      <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                        Created: {new Date(cycle.createdDate).toLocaleDateString()}
                      </p>
                      {cycle.notes && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontStyle: 'italic' }}>
                          "{cycle.notes}"
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setSelectedCycle(cycle)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        View
                      </button>
                      
                      {!cycle.isActive && (
                        <button
                          onClick={() => setActiveCycleHandler(cycle.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Set Active
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteCycle(cycle.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
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
              <div style={{ marginBottom: '20px' }}>
                {[1, 2, 3, 4].map(week => renderWorkoutWeek(activeCycle, week))}
              </div>
            </>
          )}

          {selectedCycle && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p>Showing workouts for: <strong>{selectedCycle.name}</strong></p>
                <button
                  onClick={() => setSelectedCycle(null)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Back to Active Cycle
                </button>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
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
        <div style={{
          padding: '15px',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          marginTop: '20px',
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
          marginTop: '20px',
          color: '#721c24'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default FiveThreeOnePlanner;
