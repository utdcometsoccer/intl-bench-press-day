import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WorkoutWeek from '../components/WorkoutWeek';
import { type FiveThreeOneCycle } from '../services/fiveThreeOneStorage';

describe('WorkoutWeek', () => {
  const mockCycle: FiveThreeOneCycle = {
    id: 'test-cycle',
    name: 'Test Cycle',
    startDate: new Date('2025-01-01'),
    createdDate: new Date('2025-01-01'),
    isActive: true,
    notes: '',
    maxes: [],
    workouts: [
      {
        id: 'workout-1',
        exerciseId: 'back-squat',
        exerciseName: 'Squat',
        week: 1,
        day: 1,
        warmupSets: [
          { reps: 5, weight: 45, percentage: 40 },
          { reps: 5, weight: 55, percentage: 50 }
        ],
        mainSets: [
          { reps: 5, weight: 75, percentage: 65, isAmrap: false },
          { reps: 5, weight: 85, percentage: 75, isAmrap: false },
          { reps: 5, weight: 95, percentage: 85, isAmrap: true }
        ],
        assistanceExercises: ['Romanian Deadlift', 'Bulgarian Split Squat', 'Leg Curls']
      },
      {
        id: 'workout-2',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        week: 1,
        day: 2,
        warmupSets: [
          { reps: 5, weight: 95, percentage: 40 },
          { reps: 5, weight: 115, percentage: 50 }
        ],
        mainSets: [
          { reps: 5, weight: 155, percentage: 65, isAmrap: false },
          { reps: 5, weight: 175, percentage: 75, isAmrap: false },
          { reps: 5, weight: 200, percentage: 85, isAmrap: true }
        ],
        assistanceExercises: ['Incline Dumbbell Press', 'Dips', 'Tricep Extensions']
      }
    ]
  };

  it('renders workout week with correct title', () => {
    render(<WorkoutWeek cycle={mockCycle} week={1} />);
    
    expect(screen.getByText('Week 1')).toBeInTheDocument();
  });

  it('renders deload week with correct title', () => {
    render(<WorkoutWeek cycle={mockCycle} week={4} />);
    
    expect(screen.getByText('Week 4 (Deload)')).toBeInTheDocument();
  });

  it('renders workout cards for the specified week', () => {
    render(<WorkoutWeek cycle={mockCycle} week={1} />);
    
    expect(screen.getByText('Day 1: Squat')).toBeInTheDocument();
    expect(screen.getByText('Day 2: Bench Press')).toBeInTheDocument();
  });

  it('renders warmup sets', () => {
    render(<WorkoutWeek cycle={mockCycle} week={1} />);
    
    expect(screen.getByText('5 × 45 lbs (40%)')).toBeInTheDocument();
    expect(screen.getByText('5 × 55 lbs (50%)')).toBeInTheDocument();
  });

  it('renders main sets with AMRAP indicator', () => {
    render(<WorkoutWeek cycle={mockCycle} week={1} />);
    
    expect(screen.getByText('5 × 75 lbs (65%)')).toBeInTheDocument();
    expect(screen.getByText('5 × 85 lbs (75%)')).toBeInTheDocument();
    expect(screen.getByText('5+ × 95 lbs (85%)')).toBeInTheDocument();
    expect(screen.getAllByText('(AMRAP)')).toHaveLength(2); // One for each workout
  });

  it('renders assistance exercises', () => {
    render(<WorkoutWeek cycle={mockCycle} week={1} />);
    
    expect(screen.getByText('Romanian Deadlift, Bulgarian Split Squat, Leg Curls')).toBeInTheDocument();
    expect(screen.getByText('Incline Dumbbell Press, Dips, Tricep Extensions')).toBeInTheDocument();
  });

  it('filters workouts correctly by week', () => {
    const multiWeekCycle: FiveThreeOneCycle = {
      ...mockCycle,
      workouts: [
        ...mockCycle.workouts,
        {
          id: 'workout-3',
          exerciseId: 'deadlift',
          exerciseName: 'Deadlift',
          week: 2,
          day: 3,
          warmupSets: [],
          mainSets: [
            { reps: 3, weight: 300, percentage: 70, isAmrap: false }
          ],
          assistanceExercises: []
        }
      ]
    };

    render(<WorkoutWeek cycle={multiWeekCycle} week={1} />);
    
    expect(screen.getByText('Day 1: Squat')).toBeInTheDocument();
    expect(screen.getByText('Day 2: Bench Press')).toBeInTheDocument();
    expect(screen.queryByText('Day 3: Deadlift')).not.toBeInTheDocument();
  });

  it('sorts workouts by day within a week', () => {
    const unsortedCycle: FiveThreeOneCycle = {
      ...mockCycle,
      workouts: [
        mockCycle.workouts[1], // Day 2
        mockCycle.workouts[0]  // Day 1
      ]
    };

    render(<WorkoutWeek cycle={unsortedCycle} week={1} />);
    
    const workoutCards = screen.getAllByText(/Day \d:/);
    expect(workoutCards[0]).toHaveTextContent('Day 1: Squat');
    expect(workoutCards[1]).toHaveTextContent('Day 2: Bench Press');
  });

  it('handles workouts without assistance exercises', () => {
    const cycleWithoutAssistance: FiveThreeOneCycle = {
      ...mockCycle,
      workouts: [
        {
          ...mockCycle.workouts[0],
          assistanceExercises: []
        }
      ]
    };

    render(<WorkoutWeek cycle={cycleWithoutAssistance} week={1} />);
    
    expect(screen.queryByText('Suggested Assistance:')).not.toBeInTheDocument();
  });
});