import { useCallback, useEffect, useReducer } from 'react';
import type { ExerciseRecord } from '../services/exerciseRecordsStorage';
import { exerciseRecordsStorage } from '../services/exerciseRecordsStorage';
import type { FiveThreeOneCycle, FiveThreeOneMax } from '../services/fiveThreeOneStorage';
import {
  FIVE_THREE_ONE_MAIN_EXERCISES,
  calculateTrainingMax,
  fiveThreeOneStorage,
  generateWorkouts
} from '../services/fiveThreeOneStorage';

// State interface
interface FiveThreeOnePlannerState {
  // Form state for creating new cycles
  cycleName: string;
  startDate: string;
  notes: string;
  customMaxes: Record<string, number>;
  usePersonalRecords: boolean;

  // Data state
  cycles: FiveThreeOneCycle[];
  activeCycle: FiveThreeOneCycle | null;
  selectedCycle: FiveThreeOneCycle | null;
  personalRecords: Map<string, ExerciseRecord>;

  // UI state
  isLoading: boolean;
  isCreating: boolean;
  error: string;
  success: string;
  activeTab: 'create' | 'manage' | 'view';
}

// Action types
type FiveThreeOnePlannerAction =
  | { type: 'SET_CYCLE_NAME'; payload: string }
  | { type: 'SET_START_DATE'; payload: string }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'SET_CUSTOM_MAX'; payload: { exerciseId: string; value: number } }
  | { type: 'SET_USE_PERSONAL_RECORDS'; payload: boolean }
  | { type: 'SET_CYCLES'; payload: FiveThreeOneCycle[] }
  | { type: 'SET_ACTIVE_CYCLE'; payload: FiveThreeOneCycle | null }
  | { type: 'SET_SELECTED_CYCLE'; payload: FiveThreeOneCycle | null }
  | { type: 'SET_PERSONAL_RECORDS'; payload: Map<string, ExerciseRecord> }
  | { type: 'SET_IS_LOADING'; payload: boolean }
  | { type: 'SET_IS_CREATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_SUCCESS'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: 'create' | 'manage' | 'view' }
  | { type: 'RESET_FORM' }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'INITIALIZE_CUSTOM_MAXES'; payload: Record<string, number> };

// Initial state
const initialState: FiveThreeOnePlannerState = {
  cycleName: '',
  startDate: new Date().toISOString().split('T')[0],
  notes: '',
  customMaxes: {},
  usePersonalRecords: true,
  cycles: [],
  activeCycle: null,
  selectedCycle: null,
  personalRecords: new Map(),
  isLoading: true,
  isCreating: false,
  error: '',
  success: '',
  activeTab: 'create'
};

// Reducer function
const fiveThreeOnePlannerReducer = (
  state: FiveThreeOnePlannerState,
  action: FiveThreeOnePlannerAction
): FiveThreeOnePlannerState => {
  switch (action.type) {
    case 'SET_CYCLE_NAME':
      return { ...state, cycleName: action.payload };
    
    case 'SET_START_DATE':
      return { ...state, startDate: action.payload };
    
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    
    case 'SET_CUSTOM_MAX':
      return {
        ...state,
        customMaxes: {
          ...state.customMaxes,
          [action.payload.exerciseId]: action.payload.value
        }
      };
    
    case 'SET_USE_PERSONAL_RECORDS':
      return { ...state, usePersonalRecords: action.payload };
    
    case 'SET_CYCLES':
      return { ...state, cycles: action.payload };
    
    case 'SET_ACTIVE_CYCLE':
      return { ...state, activeCycle: action.payload };
    
    case 'SET_SELECTED_CYCLE':
      return { ...state, selectedCycle: action.payload };
    
    case 'SET_PERSONAL_RECORDS':
      return { ...state, personalRecords: action.payload };
    
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_IS_CREATING':
      return { ...state, isCreating: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    
    case 'RESET_FORM':
      return {
        ...state,
        cycleName: `Cycle ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        notes: '',
        error: '',
        success: ''
      };
    
    case 'CLEAR_MESSAGES':
      return { ...state, error: '', success: '' };
    
    case 'INITIALIZE_CUSTOM_MAXES':
      return { ...state, customMaxes: action.payload };
    
    default:
      return state;
  }
};

// Hook interface
export interface UseFiveThreeOnePlannerReturn {
  // State
  state: FiveThreeOnePlannerState;
  
  // Actions
  setCycleName: (name: string) => void;
  setStartDate: (date: string) => void;
  setNotes: (notes: string) => void;
  setUsePersonalRecords: (use: boolean) => void;
  setSelectedCycle: (cycle: FiveThreeOneCycle | null) => void;
  setActiveTab: (tab: 'create' | 'manage' | 'view') => void;
  
  // Event handlers
  handleCustomMaxChange: (exerciseId: string, value: string) => void;
  createCycle: () => Promise<void>;
  setActiveCycleHandler: (cycleId: string) => Promise<void>;
  deleteCycle: (cycleId: string) => Promise<void>;
}

// Main hook
export const useFiveThreeOnePlanner = (): UseFiveThreeOnePlannerReturn => {
  // State managed by reducer
  const [state, dispatch] = useReducer(fiveThreeOnePlannerReducer, {
    ...initialState,
    cycleName: `Cycle ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  });

  const loadCycles = useCallback(async () => {
    try {
      const allCycles = await fiveThreeOneStorage.getAllCycles();
      dispatch({ type: 'SET_CYCLES', payload: allCycles });

      const active = await fiveThreeOneStorage.getActiveCycle();
      dispatch({ type: 'SET_ACTIVE_CYCLE', payload: active });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load cycles: ${err}` });
    }
  }, []);

  const loadPersonalRecords = useCallback(async () => {
    try {
      const records = await exerciseRecordsStorage.getPersonalRecords();
      dispatch({ type: 'SET_PERSONAL_RECORDS', payload: records });

      // Initialize custom maxes with personal records if available
      const initialMaxes: Record<string, number> = {};
      FIVE_THREE_ONE_MAIN_EXERCISES.forEach(exercise => {
        const record = records.get(exercise.id);
        if (record) {
          initialMaxes[exercise.id] = record.oneRepMax;
        }
      });
      dispatch({ type: 'INITIALIZE_CUSTOM_MAXES', payload: initialMaxes });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load personal records: ${err}` });
    }
  }, []);

  const initializeData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_IS_LOADING', payload: true });
      await fiveThreeOneStorage.initialize();
      await exerciseRecordsStorage.initialize();

      await Promise.all([
        loadCycles(),
        loadPersonalRecords()
      ]);

      // Set default cycle name
      dispatch({ 
        type: 'SET_CYCLE_NAME', 
        payload: `Cycle ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` 
      });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to initialize: ${err}` });
    } finally {
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    }
  }, [loadCycles, loadPersonalRecords]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Action creators
  const setCycleName = (name: string) => {
    dispatch({ type: 'SET_CYCLE_NAME', payload: name });
  };

  const setStartDate = (date: string) => {
    dispatch({ type: 'SET_START_DATE', payload: date });
  };

  const setNotes = (notes: string) => {
    dispatch({ type: 'SET_NOTES', payload: notes });
  };

  const setUsePersonalRecords = (use: boolean) => {
    dispatch({ type: 'SET_USE_PERSONAL_RECORDS', payload: use });
  };

  const setSelectedCycle = (cycle: FiveThreeOneCycle | null) => {
    dispatch({ type: 'SET_SELECTED_CYCLE', payload: cycle });
  };

  const setActiveTab = (tab: 'create' | 'manage' | 'view') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  // Event handlers
  const handleCustomMaxChange = (exerciseId: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    dispatch({ 
      type: 'SET_CUSTOM_MAX', 
      payload: { exerciseId, value: numericValue } 
    });
  };

  const createCycle = async () => {
    if (!state.cycleName.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a cycle name' });
      return;
    }

    // Validate that we have maxes for all main exercises
    const maxes: FiveThreeOneMax[] = [];
    for (const exercise of FIVE_THREE_ONE_MAIN_EXERCISES) {
      let oneRepMax = 0;

      if (state.usePersonalRecords) {
        const record = state.personalRecords.get(exercise.id);
        if (record) {
          oneRepMax = record.oneRepMax;
        }
      } else {
        oneRepMax = state.customMaxes[exercise.id] || 0;
      }

      if (oneRepMax <= 0) {
        dispatch({ type: 'SET_ERROR', payload: `Please provide a valid one-rep max for ${exercise.name}` });
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
      dispatch({ type: 'SET_IS_CREATING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: '' });

      // Generate workouts for the cycle
      const workouts = generateWorkouts(maxes);

      // Create the cycle
      const cycle: FiveThreeOneCycle = {
        id: `cycle_${Date.now()}`,
        name: state.cycleName.trim(),
        startDate: new Date(state.startDate),
        createdDate: new Date(),
        maxes,
        workouts,
        notes: state.notes.trim() || undefined,
        isActive: true // Make this the active cycle
      };

      // Save the cycle
      await fiveThreeOneStorage.saveCycle(cycle);

      // Set as active cycle (deactivates others)
      await fiveThreeOneStorage.setActiveCycle(cycle.id);

      // Refresh the cycles list
      await loadCycles();

      // Reset form
      dispatch({ type: 'RESET_FORM' });
      dispatch({ type: 'SET_SUCCESS', payload: '5-3-1 cycle created successfully!' });
      setTimeout(() => dispatch({ type: 'SET_SUCCESS', payload: '' }), 3000);

      // Switch to manage tab
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'manage' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to create cycle: ${err}` });
    } finally {
      dispatch({ type: 'SET_IS_CREATING', payload: false });
    }
  };

  const setActiveCycleHandler = async (cycleId: string) => {
    try {
      await fiveThreeOneStorage.setActiveCycle(cycleId);
      await loadCycles();
      dispatch({ type: 'SET_SUCCESS', payload: 'Active cycle updated!' });
      setTimeout(() => dispatch({ type: 'SET_SUCCESS', payload: '' }), 2000);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to set active cycle: ${err}` });
    }
  };

  const deleteCycle = async (cycleId: string) => {
    if (!confirm('Are you sure you want to delete this cycle?')) return;

    try {
      await fiveThreeOneStorage.deleteCycle(cycleId);
      await loadCycles();
      if (state.selectedCycle?.id === cycleId) {
        dispatch({ type: 'SET_SELECTED_CYCLE', payload: null });
      }
      dispatch({ type: 'SET_SUCCESS', payload: 'Cycle deleted successfully!' });
      setTimeout(() => dispatch({ type: 'SET_SUCCESS', payload: '' }), 2000);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to delete cycle: ${err}` });
    }
  };

  return {
    state,
    setCycleName,
    setStartDate,
    setNotes,
    setUsePersonalRecords,
    setSelectedCycle,
    setActiveTab,
    handleCustomMaxChange,
    createCycle,
    setActiveCycleHandler,
    deleteCycle
  };
};