import { describe, it, expect } from 'vitest';
import {
  convertCycleToPlan,
  convertFiveThreeOneWorkoutToUnified,
  convertCustomWorkoutToUnified,
  convertCustomWorkoutsToPlan,
  getWorkoutFromPlan,
  getWorkoutByWeekAndDay,
  isFiveThreeOnePlan,
  isCustomPlan,
  getWorkoutsForWeek,
  getWorkoutDisplayName,
} from '../services/workoutPlanStorage';
import type { 
  FiveThreeOneCycle, 
  FiveThreeOneWorkout,
  CustomWorkout,
  WorkoutPlan,
  UnifiedWorkout
} from '../types';

describe('workoutPlanStorage', () => {
  describe('convertFiveThreeOneWorkoutToUnified', () => {
    it('should convert a 5-3-1 workout to unified format', () => {
      const workout: FiveThreeOneWorkout = {
        id: 'test-workout-1',
        week: 1,
        day: 1,
        exerciseId: 'back-squat',
        exerciseName: 'Back Squat',
        mainSets: [
          { reps: 5, percentage: 65, weight: 200 },
          { reps: 5, percentage: 75, weight: 225, isAmrap: true },
        ],
        warmupSets: [
          { reps: 5, percentage: 40, weight: 120 },
        ],
        assistanceExercises: ['Leg Press', 'Lunges'],
      };

      const unified = convertFiveThreeOneWorkoutToUnified(workout);

      expect(unified.id).toBe('test-workout-1');
      expect(unified.exerciseId).toBe('back-squat');
      expect(unified.exerciseName).toBe('Back Squat');
      expect(unified.week).toBe(1);
      expect(unified.day).toBe(1);
      expect(unified.mainSets).toHaveLength(2);
      expect(unified.mainSets[0].reps).toBe(5);
      expect(unified.mainSets[0].percentage).toBe(65);
      expect(unified.mainSets[1].isAmrap).toBe(true);
      expect(unified.warmupSets).toHaveLength(1);
      expect(unified.assistanceExercises).toEqual(['Leg Press', 'Lunges']);
    });
  });

  describe('convertCustomWorkoutToUnified', () => {
    it('should convert a custom workout to unified format', () => {
      const workout: CustomWorkout = {
        id: 'custom-1',
        name: 'Heavy Bench Press',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        sets: [
          { reps: 5, weight: 185 },
          { reps: 3, weight: 205, isAmrap: true },
        ],
        warmupSets: [
          { reps: 10, weight: 95 },
        ],
        assistanceExercises: ['Dips', 'Tricep Extensions'],
        createdDate: new Date('2025-01-01'),
        createdBy: 'user',
        notes: 'Focus on form',
      };

      const unified = convertCustomWorkoutToUnified(workout);

      expect(unified.id).toBe('custom-1');
      expect(unified.exerciseId).toBe('bench-press');
      expect(unified.exerciseName).toBe('Bench Press');
      expect(unified.week).toBeUndefined();
      expect(unified.day).toBeUndefined();
      expect(unified.mainSets).toHaveLength(2);
      expect(unified.mainSets[1].isAmrap).toBe(true);
      expect(unified.warmupSets).toHaveLength(1);
      expect(unified.notes).toBe('Focus on form');
    });
  });

  describe('convertCycleToPlan', () => {
    it('should convert a 5-3-1 cycle to a workout plan', () => {
      const cycle: FiveThreeOneCycle = {
        id: 'cycle-1',
        name: 'Cycle 1 - January 2025',
        startDate: new Date('2025-01-01'),
        createdDate: new Date('2024-12-28'),
        maxes: [],
        workouts: [
          {
            id: 'workout-1',
            week: 1,
            day: 1,
            exerciseId: 'back-squat',
            exerciseName: 'Back Squat',
            mainSets: [{ reps: 5, percentage: 65, weight: 200 }],
            warmupSets: [{ reps: 5, percentage: 40, weight: 120 }],
          },
        ],
        isActive: true,
      };

      const plan = convertCycleToPlan(cycle);

      expect(plan.id).toBe('cycle-1');
      expect(plan.name).toBe('Cycle 1 - January 2025');
      expect(plan.type).toBe('531');
      expect(plan.isActive).toBe(true);
      expect(plan.workouts).toHaveLength(1);
      expect(plan.startDate).toEqual(cycle.startDate);
    });
  });

  describe('convertCustomWorkoutsToPlan', () => {
    it('should convert an array of custom workouts to a plan', () => {
      const workouts: CustomWorkout[] = [
        {
          id: 'custom-1',
          name: 'Bench Day',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          sets: [{ reps: 5, weight: 185 }],
          createdDate: new Date('2025-01-01'),
          createdBy: 'user',
        },
        {
          id: 'custom-2',
          name: 'Squat Day',
          exerciseId: 'back-squat',
          exerciseName: 'Back Squat',
          sets: [{ reps: 5, weight: 225 }],
          createdDate: new Date('2025-01-02'),
          createdBy: 'user',
        },
      ];

      const plan = convertCustomWorkoutsToPlan(workouts, 'My Custom Plan', 'plan-1');

      expect(plan.id).toBe('plan-1');
      expect(plan.name).toBe('My Custom Plan');
      expect(plan.type).toBe('custom');
      expect(plan.workouts).toHaveLength(2);
      expect(plan.isActive).toBe(false);
    });
  });

  describe('getWorkoutFromPlan', () => {
    it('should retrieve a workout by ID from a plan', () => {
      const plan: WorkoutPlan = {
        id: 'plan-1',
        name: 'Test Plan',
        type: 'custom',
        createdDate: new Date(),
        workouts: [
          {
            id: 'workout-1',
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            mainSets: [{ reps: 5, weight: 185 }],
          },
          {
            id: 'workout-2',
            exerciseId: 'back-squat',
            exerciseName: 'Back Squat',
            mainSets: [{ reps: 5, weight: 225 }],
          },
        ],
        isActive: false,
      };

      const workout = getWorkoutFromPlan(plan, 'workout-2');

      expect(workout).not.toBeNull();
      expect(workout?.exerciseName).toBe('Back Squat');
    });

    it('should return null if workout is not found', () => {
      const plan: WorkoutPlan = {
        id: 'plan-1',
        name: 'Test Plan',
        type: 'custom',
        createdDate: new Date(),
        workouts: [],
        isActive: false,
      };

      const workout = getWorkoutFromPlan(plan, 'non-existent');

      expect(workout).toBeNull();
    });
  });

  describe('getWorkoutByWeekAndDay', () => {
    it('should retrieve a workout by week and day for 5-3-1 plans', () => {
      const plan: WorkoutPlan = {
        id: 'plan-1',
        name: '5-3-1 Plan',
        type: '531',
        createdDate: new Date(),
        workouts: [
          {
            id: 'workout-1',
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            mainSets: [{ reps: 5, weight: 185 }],
            week: 1,
            day: 2,
          },
        ],
        isActive: true,
      };

      const workout = getWorkoutByWeekAndDay(plan, 1, 2);

      expect(workout).not.toBeNull();
      expect(workout?.exerciseName).toBe('Bench Press');
    });

    it('should return null for custom plans', () => {
      const plan: WorkoutPlan = {
        id: 'plan-1',
        name: 'Custom Plan',
        type: 'custom',
        createdDate: new Date(),
        workouts: [],
        isActive: false,
      };

      const workout = getWorkoutByWeekAndDay(plan, 1, 1);

      expect(workout).toBeNull();
    });
  });

  describe('isFiveThreeOnePlan', () => {
    it('should return true for 5-3-1 plans', () => {
      const plan: WorkoutPlan = {
        id: 'plan-1',
        name: '5-3-1',
        type: '531',
        createdDate: new Date(),
        workouts: [],
        isActive: true,
      };

      expect(isFiveThreeOnePlan(plan)).toBe(true);
    });

    it('should return false for custom plans', () => {
      const plan: WorkoutPlan = {
        id: 'plan-1',
        name: 'Custom',
        type: 'custom',
        createdDate: new Date(),
        workouts: [],
        isActive: false,
      };

      expect(isFiveThreeOnePlan(plan)).toBe(false);
    });
  });

  describe('isCustomPlan', () => {
    it('should return true for custom plans', () => {
      const plan: WorkoutPlan = {
        id: 'plan-1',
        name: 'Custom',
        type: 'custom',
        createdDate: new Date(),
        workouts: [],
        isActive: false,
      };

      expect(isCustomPlan(plan)).toBe(true);
    });

    it('should return false for 5-3-1 plans', () => {
      const plan: WorkoutPlan = {
        id: 'plan-1',
        name: '5-3-1',
        type: '531',
        createdDate: new Date(),
        workouts: [],
        isActive: true,
      };

      expect(isCustomPlan(plan)).toBe(false);
    });
  });

  describe('getWorkoutsForWeek', () => {
    it('should return workouts for a specific week in 5-3-1 plans', () => {
      const plan: WorkoutPlan = {
        id: 'plan-1',
        name: '5-3-1',
        type: '531',
        createdDate: new Date(),
        workouts: [
          {
            id: 'w1-1',
            exerciseId: 'squat',
            exerciseName: 'Squat',
            mainSets: [],
            week: 1,
            day: 1,
          },
          {
            id: 'w1-2',
            exerciseId: 'bench',
            exerciseName: 'Bench',
            mainSets: [],
            week: 1,
            day: 2,
          },
          {
            id: 'w2-1',
            exerciseId: 'deadlift',
            exerciseName: 'Deadlift',
            mainSets: [],
            week: 2,
            day: 1,
          },
        ],
        isActive: true,
      };

      const week1Workouts = getWorkoutsForWeek(plan, 1);

      expect(week1Workouts).toHaveLength(2);
      expect(week1Workouts[0].exerciseName).toBe('Squat');
      expect(week1Workouts[1].exerciseName).toBe('Bench');
    });

    it('should return empty array for custom plans', () => {
      const plan: WorkoutPlan = {
        id: 'plan-1',
        name: 'Custom',
        type: 'custom',
        createdDate: new Date(),
        workouts: [],
        isActive: false,
      };

      const workouts = getWorkoutsForWeek(plan, 1);

      expect(workouts).toEqual([]);
    });
  });

  describe('getWorkoutDisplayName', () => {
    it('should include week and day for 5-3-1 workouts', () => {
      const workout: UnifiedWorkout = {
        id: 'w1',
        exerciseId: 'bench',
        exerciseName: 'Bench Press',
        mainSets: [],
        week: 2,
        day: 3,
      };

      const displayName = getWorkoutDisplayName(workout);

      expect(displayName).toBe('Bench Press - Week 2, Day 3');
    });

    it('should only show exercise name for custom workouts', () => {
      const workout: UnifiedWorkout = {
        id: 'custom1',
        exerciseId: 'bench',
        exerciseName: 'Heavy Bench',
        mainSets: [],
      };

      const displayName = getWorkoutDisplayName(workout);

      expect(displayName).toBe('Heavy Bench');
    });
  });
});
