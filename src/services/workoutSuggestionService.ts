// Workout Suggestion Service
// Auto-detects next workout based on previous sessions

import type { FiveThreeOneCycle, FiveThreeOneWorkout } from '../types';
import type { WorkoutResult } from '../types';

export interface WorkoutSuggestion {
  week: number;
  day: number;
  exerciseName: string;
  exerciseId: string;
  workout: FiveThreeOneWorkout | null;
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
  currentWeek: number;
  weeksProgress: WeekProgress[];
}

// Get the next suggested workout based on cycle and past results
export const getNextWorkout = (
  cycle: FiveThreeOneCycle,
  results: WorkoutResult[]
): WorkoutSuggestion | null => {
  if (!cycle || !cycle.workouts || cycle.workouts.length === 0) {
    return null;
  }

  // Get all completed workouts for this cycle
  const completedWorkouts = results.filter(r => r.cycleId === cycle.id);
  const completedSet = new Set(
    completedWorkouts.map(r => `${r.week}-${r.day}`)
  );

  // Find the first incomplete workout in order (week 1-4, day 1-4)
  for (let week = 1; week <= 4; week++) {
    for (let day = 1; day <= 4; day++) {
      const key = `${week}-${day}`;
      if (!completedSet.has(key)) {
        const workout = cycle.workouts.find(w => w.week === week && w.day === day);
        if (workout) {
          // Check if overdue (if we're past expected schedule)
          const cycleStartDate = new Date(cycle.startDate);
          const expectedDate = new Date(cycleStartDate);
          expectedDate.setDate(expectedDate.getDate() + (week - 1) * 7 + (day - 1) * 2);
          
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

  // All workouts completed
  return null;
};

// Get all workout suggestions for the cycle
export const getAllWorkoutSuggestions = (
  cycle: FiveThreeOneCycle,
  results: WorkoutResult[]
): WorkoutSuggestion[] => {
  if (!cycle || !cycle.workouts) {
    return [];
  }

  const completedWorkouts = results.filter(r => r.cycleId === cycle.id);
  const completedMap = new Map<string, WorkoutResult>();
  
  completedWorkouts.forEach(r => {
    const key = `${r.week}-${r.day}`;
    completedMap.set(key, r);
  });

  const cycleStartDate = new Date(cycle.startDate);
  const today = new Date();
  let foundNextWorkout = false;

  return cycle.workouts.map(workout => {
    const key = `${workout.week}-${workout.day}`;
    const completed = completedMap.get(key);
    
    const expectedDate = new Date(cycleStartDate);
    expectedDate.setDate(expectedDate.getDate() + (workout.week - 1) * 7 + (workout.day - 1) * 2);
    const daysUntilDue = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

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
      if (daysUntilDue <= 0) {
        recommendation = daysUntilDue < -3 ? 'overdue' : 'today';
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

// Get cycle progress summary
export const getCycleProgress = (
  cycle: FiveThreeOneCycle,
  results: WorkoutResult[]
): CycleProgress => {
  const cycleResults = results.filter(r => r.cycleId === cycle.id);
  const totalWorkouts = cycle.workouts?.length || 16;
  const completedWorkouts = cycleResults.length;

  // Build week progress
  const weeksProgress: WeekProgress[] = [1, 2, 3, 4].map(week => {
    const weekWorkouts = cycle.workouts?.filter(w => w.week === week) || [];
    const completedDays = cycleResults
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
    cycleId: cycle.id,
    cycleName: cycle.name,
    totalWorkouts,
    completedWorkouts,
    percentComplete: Math.round((completedWorkouts / totalWorkouts) * 100),
    currentWeek,
    weeksProgress,
  };
};

// Get today's scheduled workouts
export const getTodaysWorkouts = (
  cycle: FiveThreeOneCycle,
  results: WorkoutResult[]
): WorkoutSuggestion[] => {
  const suggestions = getAllWorkoutSuggestions(cycle, results);
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
