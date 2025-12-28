// Workout Suggestion Service
// Auto-detects next workout based on previous sessions

import type { WorkoutPlan, UnifiedWorkout } from '../types';
import type { WorkoutResult } from '../types';
import { isFiveThreeOnePlan } from './workoutPlanStorage';

// Constants
const WEEKS_PER_CYCLE = 4;
const WORKOUTS_PER_WEEK = 4;
const DEFAULT_TOTAL_WORKOUTS = WEEKS_PER_CYCLE * WORKOUTS_PER_WEEK; // 16 workouts per cycle
const DAYS_PER_WEEK = 7;

export interface WorkoutSuggestion {
  week?: number; // Optional for custom plans
  day?: number; // Optional for custom plans
  exerciseName: string;
  exerciseId: string;
  workout: UnifiedWorkout | null;
  lastCompleted: Date | null;
  recommendation: 'today' | 'overdue' | 'upcoming' | 'completed';
  daysUntilDue: number;
  isNextWorkout: boolean;
}

export interface WeekProgress {
  week: number;
  completedDays: number[];
  totalDays: number;
  isComplete: boolean;
}

export interface CycleProgress {
  cycleId: string;
  cycleName: string;
  totalWorkouts: number;
  completedWorkouts: number;
  percentComplete: number;
  currentWeek?: number; // Optional for custom plans
  weeksProgress?: WeekProgress[]; // Optional for custom plans
}

// Get the next suggested workout based on plan and past results
export const getNextWorkout = (
  plan: WorkoutPlan,
  results: WorkoutResult[]
): WorkoutSuggestion | null => {
  if (!plan || !plan.workouts || plan.workouts.length === 0) {
    return null;
  }

  const is531 = isFiveThreeOnePlan(plan);

  // Get all completed workouts for this plan
  const completedWorkouts = results.filter(r => r.cycleId === plan.id);
  
  if (is531) {
    // For 5-3-1 plans, use week/day logic
    const completedSet = new Set(
      completedWorkouts.map(r => `${r.week}-${r.day}`)
    );

    // Find the first incomplete workout in order (week 1-4, day 1-4)
    for (let week = 1; week <= WEEKS_PER_CYCLE; week++) {
      for (let day = 1; day <= WORKOUTS_PER_WEEK; day++) {
        const key = `${week}-${day}`;
        if (!completedSet.has(key)) {
          const workout = plan.workouts.find(w => w.week === week && w.day === day);
          if (workout) {
            // Check if overdue (if we're past expected schedule)
            const cycleStartDate = plan.startDate ? new Date(plan.startDate) : new Date();
            const expectedDate = new Date(cycleStartDate);
            expectedDate.setDate(expectedDate.getDate() + (week - 1) * DAYS_PER_WEEK + (day - 1) * 2);
            
            const today = new Date();
            const daysUntilDue = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            let recommendation: 'today' | 'overdue' | 'upcoming' = 'upcoming';
            if (daysUntilDue <= 0) {
              recommendation = daysUntilDue < -3 ? 'overdue' : 'today';
            }

            return {
              week,
              day,
              exerciseName: workout.exerciseName,
              exerciseId: workout.exerciseId,
              workout,
              lastCompleted: completedWorkouts.length > 0 
                ? new Date(completedWorkouts[completedWorkouts.length - 1].datePerformed)
                : null,
              recommendation,
              daysUntilDue,
              isNextWorkout: true,
            };
          }
        }
      }
    }
  } else {
    // For custom plans, find the first incomplete workout
    const completedWorkoutIds = new Set(completedWorkouts.map(r => r.workoutId));
    
    for (const workout of plan.workouts) {
      if (!completedWorkoutIds.has(workout.id)) {
        return {
          exerciseName: workout.exerciseName,
          exerciseId: workout.exerciseId,
          workout,
          lastCompleted: completedWorkouts.length > 0 
            ? new Date(completedWorkouts[completedWorkouts.length - 1].datePerformed)
            : null,
          recommendation: 'today',
          daysUntilDue: 0,
          isNextWorkout: true,
        };
      }
    }
  }

  // All workouts completed
  return null;
};

// Get all workout suggestions for the plan
export const getAllWorkoutSuggestions = (
  plan: WorkoutPlan,
  results: WorkoutResult[]
): WorkoutSuggestion[] => {
  if (!plan || !plan.workouts) {
    return [];
  }

  const is531 = isFiveThreeOnePlan(plan);
  const completedWorkouts = results.filter(r => r.cycleId === plan.id);
  const completedMap = new Map<string, WorkoutResult>();
  const completedWorkoutIds = new Set<string>();
  
  completedWorkouts.forEach(r => {
    if (is531) {
      const key = `${r.week}-${r.day}`;
      completedMap.set(key, r);
    } else {
      completedWorkoutIds.add(r.workoutId);
    }
  });

  const today = new Date();
  let foundNextWorkout = false;

  return plan.workouts.map(workout => {
    let completed: WorkoutResult | undefined;
    let daysUntilDue = 0;
    
    if (is531 && workout.week !== undefined && workout.day !== undefined) {
      const key = `${workout.week}-${workout.day}`;
      completed = completedMap.get(key);
      
      const cycleStartDate = plan.startDate ? new Date(plan.startDate) : new Date();
      const expectedDate = new Date(cycleStartDate);
      expectedDate.setDate(expectedDate.getDate() + (workout.week - 1) * DAYS_PER_WEEK + (workout.day - 1) * 2);
      daysUntilDue = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // For custom workouts
      completed = completedWorkouts.find(r => r.workoutId === workout.id);
      daysUntilDue = 0; // Custom workouts don't have a schedule
    }

    if (completed) {
      return {
        week: workout.week,
        day: workout.day,
        exerciseName: workout.exerciseName,
        exerciseId: workout.exerciseId,
        workout,
        lastCompleted: new Date(completed.datePerformed),
        recommendation: 'completed' as const,
        daysUntilDue,
        isNextWorkout: false,
      };
    }

    let recommendation: 'today' | 'overdue' | 'upcoming' = 'upcoming';
    let isNextWorkout = false;

    if (!foundNextWorkout) {
      foundNextWorkout = true;
      isNextWorkout = true;
      if (is531 && daysUntilDue <= 0) {
        recommendation = daysUntilDue < -3 ? 'overdue' : 'today';
      } else if (!is531) {
        recommendation = 'today';
      }
    }

    return {
      week: workout.week,
      day: workout.day,
      exerciseName: workout.exerciseName,
      exerciseId: workout.exerciseId,
      workout,
      lastCompleted: null,
      recommendation,
      daysUntilDue,
      isNextWorkout,
    };
  });
};

// Get plan progress summary
export const getCycleProgress = (
  plan: WorkoutPlan,
  results: WorkoutResult[]
): CycleProgress => {
  const is531 = isFiveThreeOnePlan(plan);
  const planResults = results.filter(r => r.cycleId === plan.id);
  const totalWorkouts = plan.workouts?.length || DEFAULT_TOTAL_WORKOUTS;
  const completedWorkouts = planResults.length;

  if (is531) {
    // Build week progress for 5-3-1 plans
    const weeksProgress: WeekProgress[] = [1, 2, 3, 4].map(week => {
      const weekWorkouts = plan.workouts?.filter(w => w.week === week) || [];
      const completedDays = planResults
        .filter(r => r.week === week)
        .map(r => r.day);
      
      return {
        week,
        completedDays,
        totalDays: weekWorkouts.length,
        isComplete: completedDays.length >= weekWorkouts.length,
      };
    });

    // Determine current week based on completed workouts
    let currentWeek = 1;
    for (let i = 0; i < weeksProgress.length; i++) {
      if (!weeksProgress[i].isComplete) {
        currentWeek = weeksProgress[i].week;
        break;
      }
      if (i === weeksProgress.length - 1) {
        currentWeek = 4; // All complete, show week 4
      }
    }

    return {
      cycleId: plan.id,
      cycleName: plan.name,
      totalWorkouts,
      completedWorkouts,
      percentComplete: Math.round((completedWorkouts / totalWorkouts) * 100),
      currentWeek,
      weeksProgress,
    };
  } else {
    // For custom plans, no week-based progress
    return {
      cycleId: plan.id,
      cycleName: plan.name,
      totalWorkouts,
      completedWorkouts,
      percentComplete: Math.round((completedWorkouts / totalWorkouts) * 100),
    };
  }
};

// Get today's scheduled workouts
export const getTodaysWorkouts = (
  plan: WorkoutPlan,
  results: WorkoutResult[]
): WorkoutSuggestion[] => {
  const suggestions = getAllWorkoutSuggestions(plan, results);
  return suggestions.filter(s => 
    s.recommendation === 'today' || 
    (s.isNextWorkout && s.recommendation !== 'completed')
  );
};

// Check if notification should be sent for a workout
export const shouldNotifyForWorkout = (
  suggestion: WorkoutSuggestion,
  notificationsEnabled: boolean
): boolean => {
  if (!notificationsEnabled) return false;
  if (suggestion.recommendation === 'completed') return false;
  
  // Notify if workout is due today or overdue
  return suggestion.daysUntilDue <= 0;
};
