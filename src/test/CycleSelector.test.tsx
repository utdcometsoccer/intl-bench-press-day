import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CycleSelector from '../components/CycleSelector';
import { type FiveThreeOneCycle } from '../services/fiveThreeOneStorage';

describe('CycleSelector', () => {
  const mockOnBackToActiveCycle = vi.fn();
  
  const mockCycle: FiveThreeOneCycle = {
    id: 'test-cycle',
    name: 'Test Cycle',
    startDate: new Date('2025-01-01'),
    createdDate: new Date('2025-01-01'),
    isActive: false,
    notes: 'Test notes',
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
        assistanceExercises: ['Romanian Deadlift', 'Bulgarian Split Squat']
      },
      {
        id: 'workout-2',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        week: 2,
        day: 2,
        warmupSets: [
          { reps: 5, weight: 95, percentage: 40 }
        ],
        mainSets: [
          { reps: 3, weight: 155, percentage: 70, isAmrap: false },
          { reps: 3, weight: 175, percentage: 80, isAmrap: false },
          { reps: 3, weight: 200, percentage: 90, isAmrap: true }
        ],
        assistanceExercises: ['Incline Press', 'Dips']
      }
    ]
  };

  beforeEach(() => {
    mockOnBackToActiveCycle.mockClear();
  });

  it('renders cycle name in the selector', () => {
    render(<CycleSelector selectedCycle={mockCycle} onBackToActiveCycle={mockOnBackToActiveCycle} />);
    
    expect(screen.getByText('Showing workouts for:')).toBeInTheDocument();
    expect(screen.getByText('Test Cycle')).toBeInTheDocument();
  });

  it('renders back to active cycle button', () => {
    render(<CycleSelector selectedCycle={mockCycle} onBackToActiveCycle={mockOnBackToActiveCycle} />);
    
    const backButton = screen.getByText('Back to Active Cycle');
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveClass('cycle-action-button', 'view');
  });

  it('calls onBackToActiveCycle when back button is clicked', () => {
    render(<CycleSelector selectedCycle={mockCycle} onBackToActiveCycle={mockOnBackToActiveCycle} />);
    
    const backButton = screen.getByText('Back to Active Cycle');
    fireEvent.click(backButton);
    
    expect(mockOnBackToActiveCycle).toHaveBeenCalledTimes(1);
  });

  it('renders workout weeks for all 4 weeks', () => {
    render(<CycleSelector selectedCycle={mockCycle} onBackToActiveCycle={mockOnBackToActiveCycle} />);
    
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Week 2')).toBeInTheDocument();
    expect(screen.getByText('Week 3')).toBeInTheDocument();
    expect(screen.getByText('Week 4 (Deload)')).toBeInTheDocument();
  });

  it('renders workouts from the selected cycle', () => {
    render(<CycleSelector selectedCycle={mockCycle} onBackToActiveCycle={mockOnBackToActiveCycle} />);
    
    // Should show workout from week 1
    expect(screen.getByText('Day 1: Squat')).toBeInTheDocument();
    expect(screen.getByText('5 × 45 lbs (40%)')).toBeInTheDocument();
    expect(screen.getByText('5+ × 95 lbs (85%)')).toBeInTheDocument();
    
    // Should show workout from week 2
    expect(screen.getByText('Day 2: Bench Press')).toBeInTheDocument();
    expect(screen.getByText('5 × 95 lbs (40%)')).toBeInTheDocument();
    expect(screen.getByText('3+ × 200 lbs (90%)')).toBeInTheDocument();
  });

  it('renders assistance exercises', () => {
    render(<CycleSelector selectedCycle={mockCycle} onBackToActiveCycle={mockOnBackToActiveCycle} />);
    
    expect(screen.getByText('Romanian Deadlift, Bulgarian Split Squat')).toBeInTheDocument();
    expect(screen.getByText('Incline Press, Dips')).toBeInTheDocument();
  });

  it('renders view-cycle-selector and view-workouts-section containers', () => {
    const { container } = render(<CycleSelector selectedCycle={mockCycle} onBackToActiveCycle={mockOnBackToActiveCycle} />);
    
    expect(container.querySelector('.view-cycle-selector')).toBeInTheDocument();
    expect(container.querySelector('.view-workouts-section')).toBeInTheDocument();
  });

  it('handles cycle with different name', () => {
    const cycleWithDifferentName: FiveThreeOneCycle = {
      ...mockCycle,
      name: 'Advanced Powerlifting Cycle'
    };

    render(<CycleSelector selectedCycle={cycleWithDifferentName} onBackToActiveCycle={mockOnBackToActiveCycle} />);
    
    expect(screen.getByText('Advanced Powerlifting Cycle')).toBeInTheDocument();
  });

  it('handles cycle with no workouts', () => {
    const cycleWithNoWorkouts: FiveThreeOneCycle = {
      ...mockCycle,
      workouts: []
    };

    render(<CycleSelector selectedCycle={cycleWithNoWorkouts} onBackToActiveCycle={mockOnBackToActiveCycle} />);
    
    // Should still render all week headers even if no workouts
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Week 2')).toBeInTheDocument();
    expect(screen.getByText('Week 3')).toBeInTheDocument();
    expect(screen.getByText('Week 4 (Deload)')).toBeInTheDocument();
    
    // But should not show any workout cards
    expect(screen.queryByText(/Day \d:/)).not.toBeInTheDocument();
  });
});