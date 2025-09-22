// Common barbell exercises with their categories
import type { Exercise } from './types';

export { type Exercise } from './types';

export const BARBELL_EXERCISES: Exercise[] = [
  // Chest
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'Chest',
    description: 'Classic horizontal pressing movement',
    muscleGroups: ['Chest', 'Triceps', 'Front Delts']
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    category: 'Chest',
    description: 'Upper chest focused pressing movement',
    muscleGroups: ['Upper Chest', 'Triceps', 'Front Delts']
  },
  {
    id: 'decline-bench-press',
    name: 'Decline Bench Press',
    category: 'Chest',
    description: 'Lower chest focused pressing movement',
    muscleGroups: ['Lower Chest', 'Triceps', 'Front Delts']
  },

  // Back
  {
    id: 'bent-over-row',
    name: 'Bent Over Row',
    category: 'Back',
    description: 'Horizontal pulling movement for back thickness',
    muscleGroups: ['Lats', 'Rhomboids', 'Rear Delts', 'Biceps']
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'Back',
    description: 'Hip hinge movement, king of all exercises',
    muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back', 'Traps', 'Lats']
  },
  {
    id: 'rack-pull',
    name: 'Rack Pull',
    category: 'Back',
    description: 'Partial deadlift from elevated position',
    muscleGroups: ['Upper Back', 'Traps', 'Lats', 'Rear Delts']
  },

  // Legs
  {
    id: 'back-squat',
    name: 'Back Squat',
    category: 'Legs',
    description: 'The king of leg exercises',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves']
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    category: 'Legs',
    description: 'Quad-dominant squatting movement',
    muscleGroups: ['Quadriceps', 'Glutes', 'Core', 'Upper Back']
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'Legs',
    description: 'Hip hinge movement targeting posterior chain',
    muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back']
  },
  {
    id: 'stiff-leg-deadlift',
    name: 'Stiff Leg Deadlift',
    category: 'Legs',
    description: 'Hamstring-focused deadlift variation',
    muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back']
  },

  // Shoulders
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'Shoulders',
    description: 'Standing vertical pressing movement',
    muscleGroups: ['Shoulders', 'Triceps', 'Core', 'Upper Back']
  },
  {
    id: 'push-press',
    name: 'Push Press',
    category: 'Shoulders',
    description: 'Explosive overhead pressing with leg drive',
    muscleGroups: ['Shoulders', 'Triceps', 'Legs', 'Core']
  },
  {
    id: 'behind-neck-press',
    name: 'Behind the Neck Press',
    category: 'Shoulders',
    description: 'Overhead press variation behind the head',
    muscleGroups: ['Shoulders', 'Triceps', 'Upper Back']
  },
  {
    id: 'upright-row',
    name: 'Upright Row',
    category: 'Shoulders',
    description: 'Vertical pulling movement for shoulders and traps',
    muscleGroups: ['Shoulders', 'Traps', 'Rear Delts', 'Biceps']
  },

  // Arms
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    category: 'Arms',
    description: 'Classic bicep building exercise',
    muscleGroups: ['Biceps', 'Forearms']
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close Grip Bench Press',
    category: 'Arms',
    description: 'Tricep-focused pressing movement',
    muscleGroups: ['Triceps', 'Chest', 'Front Delts']
  },
  {
    id: 'ez-bar-curl',
    name: 'EZ Bar Curl',
    category: 'Arms',
    description: 'Wrist-friendly bicep curl variation',
    muscleGroups: ['Biceps', 'Forearms']
  },
  {
    id: 'reverse-curl',
    name: 'Reverse Curl',
    category: 'Arms',
    description: 'Overhand grip curl for forearms and biceps',
    muscleGroups: ['Forearms', 'Biceps', 'Brachialis']
  }
];

// Get exercises by category
export const getExercisesByCategory = (category: string): Exercise[] => {
  return BARBELL_EXERCISES.filter(exercise => exercise.category === category);
};

// Get all unique categories
export const getExerciseCategories = (): string[] => {
  return [...new Set(BARBELL_EXERCISES.map(exercise => exercise.category))];
};

// Find exercise by ID
export const findExerciseById = (id: string): Exercise | undefined => {
  return BARBELL_EXERCISES.find(exercise => exercise.id === id);
};
