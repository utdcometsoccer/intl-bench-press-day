import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import { fiveThreeOneStorage } from '../services/fiveThreeOneStorage';
import { workoutResultsStorage } from '../services/workoutResultsStorage';
import type { FiveThreeOneCycle, WorkoutResult } from '../types';

// Mock the storage services
vi.mock('../services/fiveThreeOneStorage');
vi.mock('../services/workoutResultsStorage');

describe('Dashboard Component', () => {
  const mockCycle: FiveThreeOneCycle = {
    id: 'cycle-1',
    name: 'Test Training Cycle',
    startDate: new Date(),
    createdDate: new Date(),
    isActive: true,
    maxes: [
      { exerciseId: 'bench-press', exerciseName: 'Bench Press', oneRepMax: 200, trainingMax: 180 },
    ],
    workouts: [
      {
        id: 'workout-1',
        week: 1,
        day: 1,
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        mainSets: [
          { reps: 5, percentage: 65, weight: 117 },
          { reps: 5, percentage: 75, weight: 135 },
          { reps: 5, percentage: 85, weight: 153, isAmrap: true },
        ],
        warmupSets: [],
      },
    ],
  };

  const mockOnNavigateToPlanner = vi.fn();
  const mockOnNavigateToLogger = vi.fn();
  const mockOnNavigateToProgress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(fiveThreeOneStorage.initialize).mockResolvedValue();
    vi.mocked(fiveThreeOneStorage.getActiveCycle).mockResolvedValue(null);
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();
    vi.mocked(workoutResultsStorage.getWorkoutResultsByCycle).mockResolvedValue([]);

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    expect(screen.getByText('Loading your workout data...')).toBeInTheDocument();
  });

  it('should display no cycle message when no active cycle exists', async () => {
    vi.mocked(fiveThreeOneStorage.initialize).mockResolvedValue();
    vi.mocked(fiveThreeOneStorage.getActiveCycle).mockResolvedValue(null);
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
      expect(screen.getByText('No Active Training Cycle')).toBeInTheDocument();
    });
  });

  it('should display create cycle button when no active cycle', async () => {
    vi.mocked(fiveThreeOneStorage.initialize).mockResolvedValue();
    vi.mocked(fiveThreeOneStorage.getActiveCycle).mockResolvedValue(null);
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create Your First Training Cycle')).toBeInTheDocument();
    });
  });

  it('should display dashboard with active cycle', async () => {
    vi.mocked(fiveThreeOneStorage.initialize).mockResolvedValue();
    vi.mocked(fiveThreeOneStorage.getActiveCycle).mockResolvedValue(mockCycle);
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();
    vi.mocked(workoutResultsStorage.getWorkoutResultsByCycle).mockResolvedValue([]);

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Test Training Cycle')).toBeInTheDocument();
    });
  });

  it('should display TodaysWorkout component when cycle has workouts', async () => {
    vi.mocked(fiveThreeOneStorage.initialize).mockResolvedValue();
    vi.mocked(fiveThreeOneStorage.getActiveCycle).mockResolvedValue(mockCycle);
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();
    vi.mocked(workoutResultsStorage.getWorkoutResultsByCycle).mockResolvedValue([]);

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Your Next Workout')).toBeInTheDocument();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });
  });

  it('should display ProgressSummary when cycle has workouts', async () => {
    vi.mocked(fiveThreeOneStorage.initialize).mockResolvedValue();
    vi.mocked(fiveThreeOneStorage.getActiveCycle).mockResolvedValue(mockCycle);
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();
    vi.mocked(workoutResultsStorage.getWorkoutResultsByCycle).mockResolvedValue([]);

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    await waitFor(() => {
      // Progress summary should be visible
      expect(screen.getByText(/Test Training Cycle/)).toBeInTheDocument();
    });
  });

  it('should show Quick Actions buttons', async () => {
    vi.mocked(fiveThreeOneStorage.initialize).mockResolvedValue();
    vi.mocked(fiveThreeOneStorage.getActiveCycle).mockResolvedValue(mockCycle);
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();
    vi.mocked(workoutResultsStorage.getWorkoutResultsByCycle).mockResolvedValue([]);

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Log Workout')).toBeInTheDocument();
      expect(screen.getByText('View Progress')).toBeInTheDocument();
      expect(screen.getByText('Manage Cycles')).toBeInTheDocument();
    });
  });

  it('should calculate next workout correctly with partial completion', async () => {
    const completedResults: WorkoutResult[] = [
      {
        id: 'result-1',
        cycleId: 'cycle-1',
        cycleName: 'Test Training Cycle',
        workoutId: 'workout-1',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        week: 1,
        day: 1,
        datePerformed: new Date(),
        warmupResults: [],
        mainSetResults: [],
      },
    ];

    // Add second workout to the cycle
    const cycleWithTwoWorkouts = {
      ...mockCycle,
      workouts: [
        ...mockCycle.workouts,
        {
          id: 'workout-2',
          week: 1,
          day: 2,
          exerciseId: 'squat',
          exerciseName: 'Squat',
          mainSets: [
            { reps: 5, percentage: 65, weight: 150 },
            { reps: 5, percentage: 75, weight: 175 },
            { reps: 5, percentage: 85, weight: 200, isAmrap: true },
          ],
          warmupSets: [],
        },
      ],
    };

    vi.mocked(fiveThreeOneStorage.initialize).mockResolvedValue();
    vi.mocked(fiveThreeOneStorage.getActiveCycle).mockResolvedValue(cycleWithTwoWorkouts);
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();
    vi.mocked(workoutResultsStorage.getWorkoutResultsByCycle).mockResolvedValue(completedResults);

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    await waitFor(() => {
      // Next workout should be Squat (day 2) since Bench Press (day 1) is completed
      expect(screen.getByText('Squat')).toBeInTheDocument();
    });
  });

  it('should handle calendar toggle', async () => {
    vi.mocked(fiveThreeOneStorage.initialize).mockResolvedValue();
    vi.mocked(fiveThreeOneStorage.getActiveCycle).mockResolvedValue(mockCycle);
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();
    vi.mocked(workoutResultsStorage.getWorkoutResultsByCycle).mockResolvedValue([]);

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('📅 View Calendar')).toBeInTheDocument();
    });
  });

  it('should display NotificationSettings component', async () => {
    vi.mocked(fiveThreeOneStorage.initialize).mockResolvedValue();
    vi.mocked(fiveThreeOneStorage.getActiveCycle).mockResolvedValue(mockCycle);
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();
    vi.mocked(workoutResultsStorage.getWorkoutResultsByCycle).mockResolvedValue([]);

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    await waitFor(() => {
      // NotificationSettings should render
      expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
    });
  });

  it('should handle storage initialization errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(fiveThreeOneStorage.initialize).mockRejectedValue(new Error('Storage error'));
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue();

    render(
      <Dashboard
        onNavigateToPlanner={mockOnNavigateToPlanner}
        onNavigateToLogger={mockOnNavigateToLogger}
        onNavigateToProgress={mockOnNavigateToProgress}
      />
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
