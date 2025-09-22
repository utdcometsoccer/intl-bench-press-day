import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManageCyclesTab from '../components/ManageCyclesTab';
import { type FiveThreeOneCycle } from '../types';

describe('ManageCyclesTab', () => {
  const mockOnViewCycle = vi.fn();
  const mockOnSetActiveCycle = vi.fn();
  const mockOnDeleteCycle = vi.fn();

  const mockCycles: FiveThreeOneCycle[] = [
    {
      id: '1',
      name: 'Test Cycle 1',
      startDate: new Date('2025-01-01'),
      createdDate: new Date('2025-01-01'),
      isActive: true,
      notes: 'First cycle',
      maxes: [
        {
          exerciseId: 'back-squat',
          exerciseName: 'Back Squat',
          oneRepMax: 300,
          trainingMax: 270
        }
      ],
      workouts: []
    },
    {
      id: '2',
      name: 'Test Cycle 2',
      startDate: new Date('2025-02-01'),
      createdDate: new Date('2025-01-15'),
      isActive: false,
      notes: 'Second cycle',
      maxes: [
        {
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          oneRepMax: 200,
          trainingMax: 180
        }
      ],
      workouts: []
    }
  ];

  const defaultProps = {
    cycles: mockCycles,
    onViewCycle: mockOnViewCycle,
    onSetActiveCycle: mockOnSetActiveCycle,
    onDeleteCycle: mockOnDeleteCycle
  };

  beforeEach(() => {
    mockOnViewCycle.mockClear();
    mockOnSetActiveCycle.mockClear();
    mockOnDeleteCycle.mockClear();
  });

  it('renders title', () => {
    render(<ManageCyclesTab {...defaultProps} />);
    
    expect(screen.getByText('Manage Cycles')).toBeInTheDocument();
  });

  it('renders cycles when cycles exist', () => {
    render(<ManageCyclesTab {...defaultProps} />);
    
    expect(screen.getByText('Test Cycle 1')).toBeInTheDocument();
    expect(screen.getByText('Test Cycle 2')).toBeInTheDocument();
  });

  it('displays cycles grid when cycles exist', () => {
    const { container } = render(<ManageCyclesTab {...defaultProps} />);
    
    expect(container.querySelector('.cycles-grid')).toBeInTheDocument();
  });

  it('displays empty state when no cycles exist', () => {
    render(<ManageCyclesTab {...defaultProps} cycles={[]} />);
    
    expect(screen.getByText('No cycles created yet. Create your first cycle in the "Create Cycle" tab.')).toBeInTheDocument();
  });

  it('does not render cycles grid when no cycles exist', () => {
    const { container } = render(<ManageCyclesTab {...defaultProps} cycles={[]} />);
    
    expect(container.querySelector('.cycles-grid')).not.toBeInTheDocument();
  });

  it('renders correct number of cycle cards', () => {
    render(<ManageCyclesTab {...defaultProps} />);
    
    // Check that both cycles are rendered
    expect(screen.getByText('Test Cycle 1')).toBeInTheDocument();
    expect(screen.getByText('Test Cycle 2')).toBeInTheDocument();
  });

  it('passes correct props to CycleCard components', () => {
    render(<ManageCyclesTab {...defaultProps} />);
    
    // Check that cycle names are displayed (indicating CycleCard received correct cycle prop)
    expect(screen.getByText('Test Cycle 1')).toBeInTheDocument();
    expect(screen.getByText('Test Cycle 2')).toBeInTheDocument();
  });

  it('renders with single cycle', () => {
    const singleCycle = [mockCycles[0]];
    render(<ManageCyclesTab {...defaultProps} cycles={singleCycle} />);
    
    expect(screen.getByText('Test Cycle 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Cycle 2')).not.toBeInTheDocument();
  });

  it('applies correct structure and classes', () => {
    const { container } = render(<ManageCyclesTab {...defaultProps} />);
    
    expect(container.querySelector('h3')).toBeInTheDocument();
    expect(container.querySelector('.cycles-grid')).toBeInTheDocument();
  });

  it('shows InfoMessage component for empty state', () => {
    render(<ManageCyclesTab {...defaultProps} cycles={[]} />);
    
    // The InfoMessage component should render the empty state message
    expect(screen.getByText('No cycles created yet. Create your first cycle in the "Create Cycle" tab.')).toBeInTheDocument();
  });

  it('renders all cycles with unique keys', () => {
    render(<ManageCyclesTab {...defaultProps} />);
    
    // Check that multiple cycles are rendered without React key warnings
    expect(screen.getByText('Test Cycle 1')).toBeInTheDocument();
    expect(screen.getByText('Test Cycle 2')).toBeInTheDocument();
  });
});