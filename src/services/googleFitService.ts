// Google Fit Service - High-level service for syncing workouts to Google Fit
import { GoogleFitClient } from './googleFitClient';
import type { WorkoutResult } from '../types';
import type { GoogleFitSyncResult } from '../types/googleFit';
import { GOOGLE_FIT_ACTIVITY_TYPES } from '../types/googleFit';

const DEFAULT_WORKOUT_DURATION_MINUTES = 60;

export class GoogleFitService {
  private client: GoogleFitClient;

  constructor(client?: GoogleFitClient) {
    this.client = client || new GoogleFitClient();
  }

  /**
   * Check if the service is connected to Google Fit
   */
  isConnected(): boolean {
    return this.client.isAuthenticated();
  }

  /**
   * Connect to Google Fit (authenticate)
   */
  async connect(): Promise<void> {
    await this.client.authenticate();
  }

  /**
   * Disconnect from Google Fit
   */
  disconnect(): void {
    this.client.clearAuth();
  }

  /**
   * Sync a single workout to Google Fit
   */
  async syncWorkout(workout: WorkoutResult): Promise<void> {
    const datePerformed = workout.datePerformed instanceof Date 
      ? workout.datePerformed 
      : new Date(workout.datePerformed);
    
    // Validate the date is valid
    if (isNaN(datePerformed.getTime())) {
      throw new Error(`Invalid date for workout ${workout.id}: ${workout.datePerformed}`);
    }
    
    const durationMinutes = workout.duration || DEFAULT_WORKOUT_DURATION_MINUTES;
    
    const session = {
      name: `${workout.exerciseName} - ${workout.cycleName}`,
      description: workout.workoutNotes,
      startTimeMillis: datePerformed.getTime(),
      endTimeMillis: datePerformed.getTime() + durationMinutes * 60000,
      activityType: GOOGLE_FIT_ACTIVITY_TYPES.WEIGHT_TRAINING,
    };

    await this.client.sessions.create(session);
  }

  /**
   * Sync multiple workouts to Google Fit
   */
  async syncWorkouts(workouts: WorkoutResult[]): Promise<GoogleFitSyncResult> {
    const result: GoogleFitSyncResult = {
      success: true,
      syncedWorkouts: 0,
      failedWorkouts: 0,
      errors: [],
    };

    for (const workout of workouts) {
      try {
        await this.syncWorkout(workout);
        result.syncedWorkouts++;
      } catch (error) {
        result.failedWorkouts++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to sync workout ${workout.id}: ${errorMessage}`);
      }
    }

    result.success = result.failedWorkouts === 0;
    return result;
  }
}

// Export factory function for creating service instances
export const createGoogleFitService = (client?: GoogleFitClient): GoogleFitService => {
  return new GoogleFitService(client);
};

// Export singleton instance
export const googleFitService = new GoogleFitService();
