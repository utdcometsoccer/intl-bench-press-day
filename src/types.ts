// ============================================================================
// CORE WORKOUT TYPES
// ============================================================================

export interface WorkoutSet {
  Repetions: number;
  Weight: number;
}

export interface OneRepetitionMaximum {
  (workoutSet: WorkoutSet): number;
}

// ============================================================================
// EXERCISE TYPES
// ============================================================================

export interface Exercise {
  id: string;
  name: string;
  category: string;
  description?: string;
  muscleGroups: string[];
}

export interface ExerciseRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  workoutSet: WorkoutSet; // The actual set performed
  oneRepMax: number; // Calculated 1RM
  formulaUsed: string; // Name of the formula used
  formulaId: string; // ID of the formula used
  dateRecorded: Date;
  notes?: string;
}

// ============================================================================
// 5-3-1 PROGRAM TYPES
// ============================================================================

export interface FiveThreeOneMax {
  exerciseId: string;
  exerciseName: string;
  oneRepMax: number;
  trainingMax: number; // 90% of 1RM
}

export interface FiveThreeOneSet {
  reps: number;
  percentage: number;
  weight: number;
  isAmrap?: boolean; // As Many Reps As Possible
}

export interface FiveThreeOneWorkout {
  id: string;
  week: number; // 1, 2, 3, or 4 (deload)
  day: number; // 1, 2, 3, or 4
  exerciseId: string;
  exerciseName: string;
  mainSets: FiveThreeOneSet[];
  warmupSets: FiveThreeOneSet[];
  assistanceExercises?: string[];
  scheduledTime?: string; // Time in HH:mm format (24-hour) for scheduled workouts
}

export interface FiveThreeOneCycle {
  id: string;
  name: string;
  startDate: Date;
  createdDate: Date;
  maxes: FiveThreeOneMax[];
  workouts: FiveThreeOneWorkout[];
  notes?: string;
  isActive: boolean;
}

// ============================================================================
// WORKOUT RESULTS TYPES
// ============================================================================

export interface WorkoutSetResult {
  plannedReps: number;
  plannedWeight: number;
  actualReps: number;
  actualWeight: number;
  percentage: number;
  isAmrap: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
}

export interface AssistanceExerciseResult {
  exerciseName: string;
  sets: {
    reps: number;
    weight?: number;
    rpe?: number;
    notes?: string;
  }[];
}

export interface WorkoutResult {
  id: string;
  cycleId: string;
  cycleName: string;
  workoutId: string; // Reference to the planned workout
  exerciseId: string;
  exerciseName: string;
  week: number;
  day: number;
  datePerformed: Date;
  warmupResults: WorkoutSetResult[];
  mainSetResults: WorkoutSetResult[];
  assistanceWork?: AssistanceExerciseResult[];
  overallRpe?: number; // Overall workout RPE
  workoutNotes?: string;
  duration?: number; // Workout duration in minutes
  bodyWeight?: number; // Optional body weight tracking
}

export interface WorkoutSession {
  id: string;
  cycleId: string;
  week: number;
  day: number;
  dateStarted: Date;
  dateCompleted?: Date;
  isCompleted: boolean;
  workoutResults: WorkoutResult[];
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface DatabaseConfig {
  dbName: string;
  dbVersion: number;
  storeName: string;
  sessionsStoreName: string;
}

export interface DatabaseConnection {
  getDatabase(): IDBDatabase | null;
  initialize(config: DatabaseConfig): Promise<void>;
  close(): void;
}

export interface StoredOneRepMaxFunction {
  id: string;
  name: string;
  description?: string;
  functionBody: string; // Serialized function body
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// COMPONENT INTERFACE TYPES
// ============================================================================

export interface StoredFunctionInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OneRepMaxFunctionMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportData {
  oneRepMaxFormulas: OneRepMaxFunctionMetadata[];
  exerciseRecords: ExerciseRecord[];
  fiveThreeOnePrograms: FiveThreeOneCycle[];
  workoutResults: WorkoutResult[];
  exportDate: string;
  appVersion: string;
}

export interface ChartDataPoint {
  date: string;
  dateValue: Date;
  oneRepMax: number;
  exercise: string;
  exerciseId: string;
  weight: number;
  reps: number;
  notes?: string;
  formulaUsed: string;
}

export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  recordCount: number;
  bestOneRepMax: number;
  latestOneRepMax: number;
  improvement: number;
  color: string;
}

// ============================================================================
// WORKOUT SCHEDULING TYPES
// ============================================================================

export interface WorkoutSchedule {
  id: string;
  cycleId?: string; // Optional - null for standalone workouts
  workoutId: string; // Reference to FiveThreeOneWorkout or CustomWorkout
  scheduledDate: Date;
  scheduledTime: string; // Time in HH:mm format (24-hour)
  isCompleted: boolean;
  completedDate?: Date;
  notificationEnabled: boolean;
  notificationTime?: string; // Time before workout to send notification (e.g., "30min", "1hour")
}

export interface CustomWorkout {
  id: string;
  name: string;
  description?: string;
  exerciseId: string;
  exerciseName: string;
  sets: {
    reps: number;
    weight: number;
    isAmrap?: boolean;
  }[];
  warmupSets?: {
    reps: number;
    weight: number;
  }[];
  assistanceExercises?: string[];
  createdDate: Date;
  createdBy: 'user' | 'coach' | 'auto'; // Track source of workout
  notes?: string;
}

export interface DefaultWorkoutTimes {
  day1?: string; // Monday - format "HH:mm"
  day2?: string; // Tuesday
  day3?: string; // Wednesday
  day4?: string; // Thursday
  day5?: string; // Friday
  day6?: string; // Saturday
  day7?: string; // Sunday
}
