import { describe, it, expect } from 'vitest';
import type { FiveThreeOneCycle } from '../types';
import type { WorkoutResult } from '../types';
import {
  getNextWorkout,
  getAllWorkoutSuggestions,
  getCycleProgress,
  getTodaysWorkouts,
} from '../services/workoutSuggestionService';
import { convertCycleToPlan } from '../services/workoutPlanStorage';

// Helper to create a mock cycle
const createMockCycle = (): FiveThreeOneCycle => ({
  id: 'cycle-1',
  name: 'Test Cycle',
  startDate: new Date(),
  createdDate: new Date(),
  isActive: true,
  maxes: [
    { exerciseId: 'back-squat', exerciseName: 'Back Squat', oneRepMax: 300, trainingMax: 270 },
    { exerciseId: 'bench-press', exerciseName: 'Bench Press', oneRepMax: 200, trainingMax: 180 },
    { exerciseId: 'deadlift', exerciseName: 'Deadlift', oneRepMax: 350, trainingMax: 315 },
    { exerciseId: 'overhead-press', exerciseName: 'Overhead Press', oneRepMax: 135, trainingMax: 121.5 },
  ],
  workouts: [
    {
      id: 'squat_week1',
      week: 1,
      day: 1,
      exerciseId: 'back-squat',
      exerciseName: 'Back Squat',
      mainSets: [
        { reps: 5, percentage: 65, weight: 175.5 },
        { reps: 5, percentage: 75, weight: 202.5 },
        { reps: 5, percentage: 85, weight: 229.5, isAmrap: true },
      ],
      warmupSets: [
        { reps: 5, percentage: 40, weight: 108 },
        { reps: 5, percentage: 50, weight: 135 },
        { reps: 3, percentage: 60, weight: 162 },
      ],
    },
    {
      id: 'bench_week1',
      week: 1,
      day: 2,
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      mainSets: [
        { reps: 5, percentage: 65, weight: 117 },
        { reps: 5, percentage: 75, weight: 135 },
        { reps: 5, percentage: 85, weight: 153, isAmrap: true },
      ],
      warmupSets: [],
    },
    {
      id: 'deadlift_week1',
      week: 1,
      day: 3,
      exerciseId: 'deadlift',
      exerciseName: 'Deadlift',
      mainSets: [
        { reps: 5, percentage: 65, weight: 204.75 },
        { reps: 5, percentage: 75, weight: 236.25 },
        { reps: 5, percentage: 85, weight: 267.75, isAmrap: true },
      ],
      warmupSets: [],
    },
    {
      id: 'ohp_week1',
      week: 1,
      day: 4,
      exerciseId: 'overhead-press',
      exerciseName: 'Overhead Press',
      mainSets: [
        { reps: 5, percentage: 65, weight: 79 },
        { reps: 5, percentage: 75, weight: 91 },
        { reps: 5, percentage: 85, weight: 103, isAmrap: true },
      ],
      warmupSets: [],
    },
  ],
});

// Helper to create mock workout results
const createMockResults = (completedWorkouts: Array<{ week: number; day: number }>): WorkoutResult[] => {
  return completedWorkouts.map((w, index) => ({
    id: `result-${index}`,
    cycleId: 'cycle-1',
    cycleName: 'Test Cycle',
    workoutId: `workout-${w.week}-${w.day}`,
    exerciseId: `exercise-${w.day}`,
    exerciseName: `Exercise ${w.day}`,
    week: w.week,
    day: w.day,
    datePerformed: new Date(),
    warmupResults: [],
    mainSetResults: [
      {
        plannedReps: 5,
        plannedWeight: 200,
        actualReps: 5,
        actualWeight: 200,
        percentage: 85,
        isAmrap: false,
      },
    ],
  }));
};

describe('WorkoutSuggestionService', () => {
  describe('getNextWorkout', () => {
    it('should return the first workout when no workouts are completed', () => {
      const cycle = createMockCycle();
      const results: WorkoutResult[] = [];

      const suggestion = getNextWorkout(convertCycleToPlan(cycle), results);

      expect(suggestion).not.toBeNull();
      expect(suggestion?.week).toBe(1);
      expect(suggestion?.day).toBe(1);
      expect(suggestion?.isNextWorkout).toBe(true);
    });

    it('should return the next incomplete workout', () => {
      const cycle = createMockCycle();
      const results = createMockResults([{ week: 1, day: 1 }]);

      const suggestion = getNextWorkout(convertCycleToPlan(cycle), results);

      expect(suggestion).not.toBeNull();
      expect(suggestion?.week).toBe(1);
      expect(suggestion?.day).toBe(2);
    });

    it('should return null when all workouts are completed', () => {
      const cycle = createMockCycle();
      const results = createMockResults([
        { week: 1, day: 1 },
        { week: 1, day: 2 },
        { week: 1, day: 3 },
        { week: 1, day: 4 },
      ]);

      const suggestion = getNextWorkout(convertCycleToPlan(cycle), results);

      expect(suggestion).toBeNull();
    });
  });

  describe('getAllWorkoutSuggestions', () => {
    it('should return all workout suggestions with completion status', () => {
      const cycle = createMockCycle();
      const results = createMockResults([{ week: 1, day: 1 }]);

      const suggestions = getAllWorkoutSuggestions(convertCycleToPlan(cycle), results);

      expect(suggestions).toHaveLength(4);
      expect(suggestions[0].recommendation).toBe('completed');
      expect(suggestions[1].isNextWorkout).toBe(true);
    });

    it('should return empty array for cycle with empty workouts array', () => {
      const cycleWithNoWorkouts: FiveThreeOneCycle = {
        ...createMockCycle(),
        workouts: [],
      };
      const suggestions = getAllWorkoutSuggestions(convertCycleToPlan(cycleWithNoWorkouts), []);
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('getCycleProgress', () => {
    it('should calculate progress correctly with no completed workouts', () => {
      const cycle = createMockCycle();
      const results: WorkoutResult[] = [];

      const progress = getCycleProgress(convertCycleToPlan(cycle), results);

      expect(progress.completedWorkouts).toBe(0);
      expect(progress.totalWorkouts).toBe(4);
      expect(progress.percentComplete).toBe(0);
      expect(progress.currentWeek).toBe(1);
    });

    it('should calculate progress correctly with some completed workouts', () => {
      const cycle = createMockCycle();
      const results = createMockResults([
        { week: 1, day: 1 },
        { week: 1, day: 2 },
      ]);

      const progress = getCycleProgress(convertCycleToPlan(cycle), results);

      expect(progress.completedWorkouts).toBe(2);
      expect(progress.percentComplete).toBe(50);
    });

    it('should return week progress for all weeks', () => {
      const cycle = createMockCycle();
      const results: WorkoutResult[] = [];

      const progress = getCycleProgress(convertCycleToPlan(cycle), results);

      expect(progress.weeksProgress).toBeDefined();
      if (progress.weeksProgress) {
        expect(progress.weeksProgress).toHaveLength(4);
        expect(progress.weeksProgress[0].week).toBe(1);
        expect(progress.weeksProgress[3].week).toBe(4);
      }
    });
  });

  describe('getTodaysWorkouts', () => {
    it('should return workouts that are due today or next', () => {
      const cycle = createMockCycle();
      const results: WorkoutResult[] = [];

      const todaysWorkouts = getTodaysWorkouts(convertCycleToPlan(cycle), results);

      expect(todaysWorkouts.length).toBeGreaterThan(0);
      expect(todaysWorkouts[0].isNextWorkout).toBe(true);
    });
  });
});
