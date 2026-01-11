import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TodaysWorkout from '../components/TodaysWorkout';
import type { WorkoutSuggestion } from '../services/workoutSuggestionService';

describe('TodaysWorkout Component', () => {
  const mockWorkout = {
    id: 'workout-1',
    exerciseId: 'bench-press',
    exerciseName: 'Bench Press',
    mainSets: [
      { reps: 5, percentage: 65, weight: 117, isAmrap: false },
      { reps: 5, percentage: 75, weight: 135, isAmrap: false },
      { reps: 5, percentage: 85, weight: 153, isAmrap: true },
    ],
    warmupSets: [
      { reps: 5, percentage: 40, weight: 72 },
      { reps: 5, percentage: 50, weight: 90 },
    ],
    week: 1,
    day: 2,
  };

  const createSuggestion = (
    recommendation: 'today' | 'overdue' | 'upcoming',
    daysUntilDue: number
  ): WorkoutSuggestion => ({
    week: 1,
    day: 2,
    exerciseName: 'Bench Press',
    exerciseId: 'bench-press',
    workout: mockWorkout,
    lastCompleted: null,
    recommendation,
    daysUntilDue,
    isNextWorkout: true,
  });

  it('should render the workout suggestion', () => {
    const suggestion = createSuggestion('today', 0);
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={vi.fn()}
      />
    );

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Your Next Workout')).toBeInTheDocument();
  });

  it('should display "Today" badge for today workouts', () => {
    const suggestion = createSuggestion('today', 0);
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={vi.fn()}
      />
    );

    expect(screen.getByText('🎯 Today')).toBeInTheDocument();
  });

  it('should display "Overdue" badge for overdue workouts', () => {
    const suggestion = createSuggestion('overdue', -5);
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={vi.fn()}
      />
    );

    expect(screen.getByText('⚠️ Overdue')).toBeInTheDocument();
  });

  it('should display "Next Up" badge for upcoming workouts', () => {
    const suggestion = createSuggestion('upcoming', 2);
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={vi.fn()}
      />
    );

    expect(screen.getByText('📅 Next Up')).toBeInTheDocument();
  });

  it('should show week and day information', () => {
    const suggestion = createSuggestion('today', 0);
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={vi.fn()}
      />
    );

    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should show week description for 5/3/1 weeks', () => {
    const suggestion = createSuggestion('today', 0);
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={vi.fn()}
      />
    );

    expect(screen.getByText('5/5/5+ Week')).toBeInTheDocument();
  });

  it('should display main sets preview', () => {
    const suggestion = createSuggestion('today', 0);
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={vi.fn()}
      />
    );

    expect(screen.getByText('Main Sets Preview')).toBeInTheDocument();
    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText(/5 × 117 lbs/)).toBeInTheDocument();
  });

  it('should mark AMRAP sets correctly', () => {
    const suggestion = createSuggestion('today', 0);
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={vi.fn()}
      />
    );

    expect(screen.getByText('5+ × 153 lbs')).toBeInTheDocument();
    expect(screen.getByText('(AMRAP)')).toBeInTheDocument();
  });

  it('should call onStartWorkout when Quick Log button is clicked', () => {
    const onStartWorkout = vi.fn();
    const suggestion = createSuggestion('today', 0);
    
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={onStartWorkout}
        onViewFullLogger={vi.fn()}
      />
    );

    const quickLogButton = screen.getByText('Quick Log');
    fireEvent.click(quickLogButton);

    expect(onStartWorkout).toHaveBeenCalledTimes(1);
  });

  it('should call onViewFullLogger when Full Logger button is clicked', () => {
    const onViewFullLogger = vi.fn();
    const suggestion = createSuggestion('today', 0);
    
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={onViewFullLogger}
      />
    );

    const fullLoggerButton = screen.getByText('Full Logger');
    fireEvent.click(fullLoggerButton);

    expect(onViewFullLogger).toHaveBeenCalledTimes(1);
    expect(onViewFullLogger).toHaveBeenCalledWith(1, 2); // week 1, day 2 from the mock workout
  });

  it('should have accessible button labels', () => {
    const suggestion = createSuggestion('today', 0);
    render(
      <TodaysWorkout
        suggestion={suggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Start Bench Press workout')).toBeInTheDocument();
    expect(screen.getByLabelText('Open full workout logger')).toBeInTheDocument();
  });

  it('should handle workout without week/day info (custom workout)', () => {
    const customSuggestion: WorkoutSuggestion = {
      exerciseName: 'Custom Exercise',
      exerciseId: 'custom-1',
      workout: {
        ...mockWorkout,
        week: undefined,
        day: undefined,
      },
      lastCompleted: null,
      recommendation: 'today',
      daysUntilDue: 0,
      isNextWorkout: true,
    };

    render(
      <TodaysWorkout
        suggestion={customSuggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={vi.fn()}
      />
    );

    expect(screen.getByText('Custom Exercise')).toBeInTheDocument();
    // Week and day labels should not be present
    expect(screen.queryByText('Week')).not.toBeInTheDocument();
  });

  it('should call onViewFullLogger with undefined week/day for custom workouts', () => {
    const onViewFullLogger = vi.fn();
    const customSuggestion: WorkoutSuggestion = {
      exerciseName: 'Custom Exercise',
      exerciseId: 'custom-1',
      workout: {
        ...mockWorkout,
        week: undefined,
        day: undefined,
      },
      lastCompleted: null,
      recommendation: 'today',
      daysUntilDue: 0,
      isNextWorkout: true,
    };

    render(
      <TodaysWorkout
        suggestion={customSuggestion}
        onStartWorkout={vi.fn()}
        onViewFullLogger={onViewFullLogger}
      />
    );

    const fullLoggerButton = screen.getByText('Full Logger');
    fireEvent.click(fullLoggerButton);

    expect(onViewFullLogger).toHaveBeenCalledTimes(1);
    expect(onViewFullLogger).toHaveBeenCalledWith(undefined, undefined);
  });
});
