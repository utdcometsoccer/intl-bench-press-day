import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ViewWorkoutsTab from '../components/ViewWorkoutsTab';
import { type FiveThreeOneCycle } from '../types';

describe('ViewWorkoutsTab', () => {
  const mockOnBackToActiveCycle = vi.fn();

  const mockActiveCycle: FiveThreeOneCycle = {
    id: 'active-1',
    name: 'Active Cycle',
    startDate: new Date('2025-01-01'),
    createdDate: new Date('2025-01-01'),
    isActive: true,
    notes: 'Active cycle notes',
    maxes: [
      {
        exerciseId: 'back-squat',
        exerciseName: 'Back Squat',
        oneRepMax: 300,
        trainingMax: 270
      }
    ],
    workouts: []
  };

  const mockSelectedCycle: FiveThreeOneCycle = {
    id: 'selected-1',
    name: 'Selected Cycle',
    startDate: new Date('2025-02-01'),
    createdDate: new Date('2025-01-15'),
    isActive: false,
    notes: 'Selected cycle notes',
    maxes: [
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        oneRepMax: 200,
        trainingMax: 180
      }
    ],
    workouts: []
  };

  const defaultProps = {
    activeCycle: mockActiveCycle,
    selectedCycle: null,
    onBackToActiveCycle: mockOnBackToActiveCycle
  };

  beforeEach(() => {
    mockOnBackToActiveCycle.mockClear();
  });

  it('renders title', () => {
    render(<ViewWorkoutsTab {...defaultProps} />);
    
    expect(screen.getByText('View Workouts')).toBeInTheDocument();
  });

  it('displays active cycle workouts when there is an active cycle and no selected cycle', () => {
    render(<ViewWorkoutsTab {...defaultProps} />);
    
    expect(screen.getByText(/Showing workouts for active cycle:/)).toBeInTheDocument();
    expect(screen.getByText('Active Cycle')).toBeInTheDocument();
  });

  it('renders workout weeks for active cycle', () => {
    render(<ViewWorkoutsTab {...defaultProps} />);
    
    // Check that the view-workouts-section is rendered
    const viewWorkoutsSection = document.querySelector('.view-workouts-section');
    expect(viewWorkoutsSection).toBeInTheDocument();
  });

  it('displays selected cycle selector when there is a selected cycle', () => {
    render(<ViewWorkoutsTab {...defaultProps} activeCycle={mockActiveCycle} selectedCycle={mockSelectedCycle} />);
    
    // Should render CycleSelector component (check for elements that would be in CycleSelector)
    expect(screen.queryByText(/Showing workouts for active cycle:/)).not.toBeInTheDocument();
  });

  it('displays empty state when there is no active cycle and no selected cycle', () => {
    render(<ViewWorkoutsTab {...defaultProps} activeCycle={null} selectedCycle={null} />);
    
    expect(screen.getByText('👀 View Your Training Plan')).toBeInTheDocument();
    expect(screen.getByText(/No active training cycle to display/i)).toBeInTheDocument();
  });

  it('does not display active cycle workouts when there is a selected cycle', () => {
    render(<ViewWorkoutsTab {...defaultProps} selectedCycle={mockSelectedCycle} />);
    
    expect(screen.queryByText(/Showing workouts for active cycle:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Active Cycle')).not.toBeInTheDocument();
  });

  it('does not display empty state when there is an active cycle', () => {
    render(<ViewWorkoutsTab {...defaultProps} />);
    
    expect(screen.queryByText('👀 View Your Training Plan')).not.toBeInTheDocument();
  });

  it('does not display empty state when there is a selected cycle', () => {
    render(<ViewWorkoutsTab {...defaultProps} activeCycle={null} selectedCycle={mockSelectedCycle} />);
    
    expect(screen.queryByText('👀 View Your Training Plan')).not.toBeInTheDocument();
  });

  it('renders with null active cycle', () => {
    render(<ViewWorkoutsTab {...defaultProps} activeCycle={null} />);
    
    expect(screen.getByText('View Workouts')).toBeInTheDocument();
    expect(screen.getByText('👀 View Your Training Plan')).toBeInTheDocument();
  });

  it('applies correct structure and classes', () => {
    const { container } = render(<ViewWorkoutsTab {...defaultProps} />);
    
    expect(container.querySelector('h3')).toBeInTheDocument();
    expect(container.querySelector('.view-workouts-section')).toBeInTheDocument();
  });

  it('shows correct active cycle name in bold', () => {
    render(<ViewWorkoutsTab {...defaultProps} />);
    
    const strongElement = screen.getByText('Active Cycle');
    expect(strongElement.tagName).toBe('STRONG');
  });

  it('handles different active cycle names', () => {
    const customCycle = { ...mockActiveCycle, name: 'Custom Cycle Name' };
    render(<ViewWorkoutsTab {...defaultProps} activeCycle={customCycle} />);
    
    expect(screen.getByText('Custom Cycle Name')).toBeInTheDocument();
  });

  it('renders InfoMessage component for empty state', () => {
    render(<ViewWorkoutsTab {...defaultProps} activeCycle={null} selectedCycle={null} />);
    
    // The enhanced empty state should render with helpful content
    expect(screen.getByText('👀 View Your Training Plan')).toBeInTheDocument();
    expect(screen.getByText(/No active training cycle to display/i)).toBeInTheDocument();
  });
});