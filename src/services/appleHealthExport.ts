// Apple HealthKit Export Service
// Converts workout results to HealthKit-compatible format
import type { WorkoutResult } from '../types';

export interface HealthKitWorkout {
  workoutActivityType: string;  // HKWorkoutActivityTypeTraditionalStrengthTraining
  startDate: string;
  endDate: string;
  duration: number;
  totalEnergyBurned?: number;
  metadata: {
    exercise: string;
    sets: number;
    reps: number;
    weight: number;
  };
}

/**
 * Converts a WorkoutResult to HealthKit-compatible format
 * @param workout - The workout result to convert
 * @returns A HealthKitWorkout object ready for export
 */
export const exportToHealthKitFormat = (workout: WorkoutResult): HealthKitWorkout => {
  const datePerformed = workout.datePerformed instanceof Date 
    ? workout.datePerformed 
    : new Date(workout.datePerformed);
  
  const durationMs = (workout.duration || 0) * 60000; // Convert minutes to milliseconds
  
  return {
    workoutActivityType: 'HKWorkoutActivityTypeTraditionalStrengthTraining',
    startDate: datePerformed.toISOString(),
    endDate: new Date(datePerformed.getTime() + durationMs).toISOString(),
    duration: (workout.duration || 0) * 60, // Convert minutes to seconds
    metadata: {
      exercise: workout.exerciseName,
      sets: workout.mainSetResults.length,
      reps: workout.mainSetResults.reduce((sum, s) => sum + s.actualReps, 0),
      weight: workout.mainSetResults.length > 0 
        ? Math.max(...workout.mainSetResults.map(s => s.actualWeight))
        : 0
    }
  };
};

/**
 * Converts an array of WorkoutResults to HealthKit-compatible format
 * @param workouts - Array of workout results to convert
 * @returns Array of HealthKitWorkout objects
 */
export const exportWorkoutsToHealthKitFormat = (workouts: WorkoutResult[]): HealthKitWorkout[] => {
  return workouts.map(exportToHealthKitFormat);
};
