import { describe, it, expect } from 'vitest';
import { exportToHealthKitFormat, exportWorkoutsToHealthKitFormat } from '../services/appleHealthExport';
import type { WorkoutResult } from '../types';

// Helper function to create a mock WorkoutResult
const createMockWorkoutResult = (overrides: Partial<WorkoutResult> = {}): WorkoutResult => ({
  id: 'workout1',
  cycleId: 'cycle1',
  cycleName: 'Test Cycle',
  workoutId: 'planned-workout1',
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  week: 1,
  day: 1,
  datePerformed: new Date('2024-01-15T10:00:00.000Z'),
  warmupResults: [],
  mainSetResults: [
    {
      plannedReps: 5,
      plannedWeight: 200,
      actualReps: 5,
      actualWeight: 200,
      percentage: 75,
      isAmrap: false
    },
    {
      plannedReps: 5,
      plannedWeight: 225,
      actualReps: 5,
      actualWeight: 225,
      percentage: 85,
      isAmrap: false
    },
    {
      plannedReps: 5,
      plannedWeight: 250,
      actualReps: 8,
      actualWeight: 250,
      percentage: 95,
      isAmrap: true
    }
  ],
  duration: 45, // 45 minutes
  ...overrides
});

describe('appleHealthExport', () => {
  describe('exportToHealthKitFormat', () => {
    it('converts a workout result to HealthKit format', () => {
      const workout = createMockWorkoutResult();
      const result = exportToHealthKitFormat(workout);

      expect(result.workoutActivityType).toBe('HKWorkoutActivityTypeTraditionalStrengthTraining');
      expect(result.startDate).toBe('2024-01-15T10:00:00.000Z');
      expect(result.endDate).toBe('2024-01-15T10:45:00.000Z');
      expect(result.duration).toBe(2700); // 45 minutes in seconds
      expect(result.metadata.exercise).toBe('Bench Press');
      expect(result.metadata.sets).toBe(3);
      expect(result.metadata.reps).toBe(18); // 5 + 5 + 8
      expect(result.metadata.weight).toBe(250); // Max weight from sets
    });

    it('handles workout with no duration', () => {
      const workout = createMockWorkoutResult({ duration: undefined });
      const result = exportToHealthKitFormat(workout);

      expect(result.duration).toBe(0);
      expect(result.startDate).toBe(result.endDate); // No duration means same start/end
    });

    it('handles workout with zero duration', () => {
      const workout = createMockWorkoutResult({ duration: 0 });
      const result = exportToHealthKitFormat(workout);

      expect(result.duration).toBe(0);
      expect(result.startDate).toBe(result.endDate);
    });

    it('handles workout with no main sets', () => {
      const workout = createMockWorkoutResult({ mainSetResults: [] });
      const result = exportToHealthKitFormat(workout);

      expect(result.metadata.sets).toBe(0);
      expect(result.metadata.reps).toBe(0);
      expect(result.metadata.weight).toBe(0);
    });

    it('handles workout with date as string', () => {
      const workout = createMockWorkoutResult({
        datePerformed: '2024-02-20T14:30:00.000Z' as unknown as Date
      });
      const result = exportToHealthKitFormat(workout);

      expect(result.startDate).toBe('2024-02-20T14:30:00.000Z');
    });

    it('calculates total reps across all sets correctly', () => {
      const workout = createMockWorkoutResult({
        mainSetResults: [
          { plannedReps: 3, plannedWeight: 100, actualReps: 3, actualWeight: 100, percentage: 70, isAmrap: false },
          { plannedReps: 3, plannedWeight: 110, actualReps: 3, actualWeight: 110, percentage: 75, isAmrap: false },
          { plannedReps: 3, plannedWeight: 120, actualReps: 10, actualWeight: 120, percentage: 80, isAmrap: true }
        ]
      });
      const result = exportToHealthKitFormat(workout);

      expect(result.metadata.reps).toBe(16); // 3 + 3 + 10
    });

    it('finds the maximum weight from all sets', () => {
      const workout = createMockWorkoutResult({
        mainSetResults: [
          { plannedReps: 5, plannedWeight: 150, actualReps: 5, actualWeight: 150, percentage: 65, isAmrap: false },
          { plannedReps: 5, plannedWeight: 175, actualReps: 5, actualWeight: 175, percentage: 75, isAmrap: false },
          { plannedReps: 3, plannedWeight: 200, actualReps: 3, actualWeight: 200, percentage: 85, isAmrap: false },
          { plannedReps: 1, plannedWeight: 220, actualReps: 1, actualWeight: 220, percentage: 95, isAmrap: false }
        ]
      });
      const result = exportToHealthKitFormat(workout);

      expect(result.metadata.weight).toBe(220);
    });
  });

  describe('exportWorkoutsToHealthKitFormat', () => {
    it('converts multiple workout results to HealthKit format', () => {
      const workouts = [
        createMockWorkoutResult({ id: 'workout1', exerciseName: 'Bench Press' }),
        createMockWorkoutResult({ id: 'workout2', exerciseName: 'Squat', duration: 60 }),
        createMockWorkoutResult({ id: 'workout3', exerciseName: 'Deadlift', duration: 30 })
      ];
      
      const results = exportWorkoutsToHealthKitFormat(workouts);

      expect(results).toHaveLength(3);
      expect(results[0].metadata.exercise).toBe('Bench Press');
      expect(results[1].metadata.exercise).toBe('Squat');
      expect(results[1].duration).toBe(3600); // 60 minutes in seconds
      expect(results[2].metadata.exercise).toBe('Deadlift');
      expect(results[2].duration).toBe(1800); // 30 minutes in seconds
    });

    it('handles empty array', () => {
      const results = exportWorkoutsToHealthKitFormat([]);
      expect(results).toHaveLength(0);
    });

    it('handles single workout', () => {
      const workouts = [createMockWorkoutResult()];
      const results = exportWorkoutsToHealthKitFormat(workouts);

      expect(results).toHaveLength(1);
      expect(results[0].workoutActivityType).toBe('HKWorkoutActivityTypeTraditionalStrengthTraining');
    });
  });
});
