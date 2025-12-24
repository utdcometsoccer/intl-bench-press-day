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

/**
 * Represents a single scheduled workout instance (either from a 5/3/1 cycle or standalone).
 *
 * The `scheduledDate`/`scheduledTime` fields describe when the workout is planned.
 * Completion state is tracked with `isCompleted` and `completedDate`:
 * - When `isCompleted` is `false`, `completedDate` MUST be `undefined`.
 * - When `isCompleted` is `true`, `completedDate` SHOULD be set to the date/time
 *   the workout was actually completed (which may differ from `scheduledDate`).
 */
export interface WorkoutSchedule {
  id: string;
  cycleId: string | null; // null for standalone workouts (no associated cycle)
  workoutId: string; // Reference to FiveThreeOneWorkout or CustomWorkout
  scheduledDate: Date;
  /** Time in 24-hour "HH:mm" format (e.g., "09:00", "14:30") */
  scheduledTime: string;
  /**
   * Indicates whether the scheduled workout has been completed.
   *
   * - If `false`, the workout is pending or in progress and `completedDate` MUST be `undefined`.
   * - If `true`, the workout is finished and `completedDate` SHOULD be set.
   */
  isCompleted: boolean;
  /**
   * The actual completion date/time for this workout.
   *
   * - MUST only be set when `isCompleted` is `true`.
   * - SHOULD remain `undefined` while the workout is not yet completed.
   */
  completedDate?: Date;
  notificationEnabled: boolean;
  /** Minutes before workout to send notification (e.g., 30, 60, 120) */
  notificationLeadMinutes?: number;
}

/**
 * Represents a custom workout created outside the standard 5/3/1 program.
 *
 * Custom workouts can be created by users, coaches, or auto-generated.
 * They are not tied to a specific 5/3/1 cycle and can be used independently.
 */
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
  /**
   * Identifies the source of this workout:
   * - 'user': Created by the user manually
   * - 'coach': Assigned by a coach or trainer
   * - 'auto': Auto-generated by the system
   */
  createdBy: 'user' | 'coach' | 'auto';
  notes?: string;
}

/**
 * Default workout start times for each day of the week.
 *
 * The keys use a numeric day index where:
 * - `day1` = Monday
 * - `day2` = Tuesday
 * - `day3` = Wednesday
 * - `day4` = Thursday
 * - `day5` = Friday
 * - `day6` = Saturday
 * - `day7` = Sunday
 *
 * All times should be in 24-hour `"HH:mm"` format (e.g., `"06:30"`, `"18:45"`).
 */
export interface DefaultWorkoutTimes {
  /** Default Monday workout time in 24-hour "HH:mm" format */
  day1?: string;
  /** Default Tuesday workout time in 24-hour "HH:mm" format */
  day2?: string;
  /** Default Wednesday workout time in 24-hour "HH:mm" format */
  day3?: string;
  /** Default Thursday workout time in 24-hour "HH:mm" format */
  day4?: string;
  /** Default Friday workout time in 24-hour "HH:mm" format */
  day5?: string;
  /** Default Saturday workout time in 24-hour "HH:mm" format */
  day6?: string;
  /** Default Sunday workout time in 24-hour "HH:mm" format */
  day7?: string;
}
