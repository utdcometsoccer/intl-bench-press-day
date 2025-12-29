// Unified Workout Plan Storage
// Provides a unified interface for managing both 5-3-1 cycles and custom workout plans

import type { 
  WorkoutPlan, 
  UnifiedWorkout,
  FiveThreeOneCycle,
  FiveThreeOneWorkout,
  CustomWorkout,
  FiveThreeOneSet
} from '../types';

/**
 * Converts a FiveThreeOneCycle to a unified WorkoutPlan
 */
export const convertCycleToPlan = (cycle: FiveThreeOneCycle): WorkoutPlan => {
  const unifiedWorkouts: UnifiedWorkout[] = cycle.workouts.map(workout => 
    convertFiveThreeOneWorkoutToUnified(workout)
  );

  return {
    id: cycle.id,
    name: cycle.name,
    type: '531',
    startDate: cycle.startDate,
    createdDate: cycle.createdDate,
    workouts: unifiedWorkouts,
    notes: cycle.notes,
    isActive: cycle.isActive
  };
};

/**
 * Converts a FiveThreeOneWorkout to a UnifiedWorkout
 */
export const convertFiveThreeOneWorkoutToUnified = (workout: FiveThreeOneWorkout): UnifiedWorkout => {
  return {
    id: workout.id,
    exerciseId: workout.exerciseId,
    exerciseName: workout.exerciseName,
    mainSets: workout.mainSets.map((set: FiveThreeOneSet) => ({
      reps: set.reps,
      weight: set.weight,
      percentage: set.percentage,
      isAmrap: set.isAmrap
    })),
    warmupSets: workout.warmupSets?.map((set: FiveThreeOneSet) => ({
      reps: set.reps,
      weight: set.weight,
      percentage: set.percentage
    })),
    assistanceExercises: workout.assistanceExercises,
    week: workout.week,
    day: workout.day
  };
};

/**
 * Converts a CustomWorkout to a UnifiedWorkout
 */
export const convertCustomWorkoutToUnified = (workout: CustomWorkout): UnifiedWorkout => {
  return {
    id: workout.id,
    exerciseId: workout.exerciseId,
    exerciseName: workout.exerciseName,
    mainSets: workout.sets.map(set => ({
      reps: set.reps,
      weight: set.weight,
      isAmrap: set.isAmrap
    })),
    warmupSets: workout.warmupSets?.map(set => ({
      reps: set.reps,
      weight: set.weight
    })),
    assistanceExercises: workout.assistanceExercises,
    notes: workout.notes
  };
};

/**
 * Converts an array of CustomWorkouts to a WorkoutPlan
 */
export const convertCustomWorkoutsToPlan = (
  workouts: CustomWorkout[],
  planName: string,
  planId?: string
): WorkoutPlan => {
  const unifiedWorkouts = workouts.map(convertCustomWorkoutToUnified);
  
  return {
    id: planId || `custom-plan-${Date.now()}`,
    name: planName,
    type: 'custom',
    createdDate: new Date(),
    workouts: unifiedWorkouts,
    isActive: false
  };
};

/**
 * Gets a specific workout from a plan by ID
 */
export const getWorkoutFromPlan = (
  plan: WorkoutPlan,
  workoutId: string
): UnifiedWorkout | null => {
  return plan.workouts.find(w => w.id === workoutId) || null;
};

/**
 * Gets a workout from a plan by week and day (for 5-3-1 plans)
 */
export const getWorkoutByWeekAndDay = (
  plan: WorkoutPlan,
  week: number,
  day: number
): UnifiedWorkout | null => {
  if (plan.type !== '531') {
    return null;
  }
  return plan.workouts.find(w => w.week === week && w.day === day) || null;
};

/**
 * Checks if a plan is a 5-3-1 cycle
 */
export const isFiveThreeOnePlan = (plan: WorkoutPlan): boolean => {
  return plan.type === '531';
};

/**
 * Checks if a plan is a custom plan
 */
export const isCustomPlan = (plan: WorkoutPlan): boolean => {
  return plan.type === 'custom';
};

/**
 * Gets all workouts for a specific week in a 5-3-1 plan
 */
export const getWorkoutsForWeek = (
  plan: WorkoutPlan,
  week: number
): UnifiedWorkout[] => {
  if (plan.type !== '531') {
    return [];
  }
  return plan.workouts.filter(w => w.week === week);
};

/**
 * Gets the display name for a workout (includes week/day info for 5-3-1)
 */
export const getWorkoutDisplayName = (workout: UnifiedWorkout): string => {
  if (workout.week !== undefined && workout.day !== undefined) {
    return `${workout.exerciseName} - Week ${workout.week}, Day ${workout.day}`;
  }
  return workout.exerciseName;
};
