import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CycleCard from '../components/CycleCard';
import { type FiveThreeOneCycle } from '../services/fiveThreeOneStorage';

describe('CycleCard', () => {
  const mockOnView = vi.fn();
  const mockOnSetActive = vi.fn();
  const mockOnDelete = vi.fn();
  
  const mockActiveCycle: FiveThreeOneCycle = {
    id: 'active-cycle',
    name: 'Active Cycle',
    startDate: new Date('2025-01-01'),
    createdDate: new Date('2024-12-15'),
    isActive: true,
    notes: 'This is an active cycle',
    maxes: [],
    workouts: []
  };

  const mockInactiveCycle: FiveThreeOneCycle = {
    id: 'inactive-cycle',
    name: 'Inactive Cycle',
    startDate: new Date('2024-12-01'),
    createdDate: new Date('2024-11-20'),
    isActive: false,
    notes: '',
    maxes: [],
    workouts: []
  };

  const defaultProps = {
    cycle: mockInactiveCycle,
    onView: mockOnView,
    onSetActive: mockOnSetActive,
    onDelete: mockOnDelete
  };

  beforeEach(() => {
    mockOnView.mockClear();
    mockOnSetActive.mockClear();
    mockOnDelete.mockClear();
  });

  it('renders cycle name', () => {
    render(<CycleCard {...defaultProps} />);
    
    expect(screen.getByText('Inactive Cycle')).toBeInTheDocument();
  });

  it('renders start date and created date', () => {
    render(<CycleCard {...defaultProps} />);
    
    expect(screen.getByText(/Start Date:/)).toBeInTheDocument();
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });

  it('renders notes when present', () => {
    render(<CycleCard {...defaultProps} cycle={mockActiveCycle} />);
    
    expect(screen.getByText('"This is an active cycle"')).toBeInTheDocument();
  });

  it('does not render notes when empty', () => {
    render(<CycleCard {...defaultProps} />);
    
    expect(screen.queryByText(/"/)).not.toBeInTheDocument();
  });

  it('applies active class and shows active indicator for active cycle', () => {
    const { container } = render(<CycleCard {...defaultProps} cycle={mockActiveCycle} />);
    
    expect(container.querySelector('.cycle-card')).toHaveClass('active');
    expect(screen.getByText('(Active)')).toBeInTheDocument();
  });

  it('does not apply active class or show indicator for inactive cycle', () => {
    const { container } = render(<CycleCard {...defaultProps} />);
    
    expect(container.querySelector('.cycle-card')).not.toHaveClass('active');
    expect(screen.queryByText('(Active)')).not.toBeInTheDocument();
  });

  it('always renders View and Delete buttons', () => {
    render(<CycleCard {...defaultProps} />);
    
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders Set Active button only for inactive cycles', () => {
    const { rerender } = render(<CycleCard {...defaultProps} />);
    expect(screen.getByText('Set Active')).toBeInTheDocument();
    
    rerender(<CycleCard {...defaultProps} cycle={mockActiveCycle} />);
    expect(screen.queryByText('Set Active')).not.toBeInTheDocument();
  });

  it('calls onView when View button is clicked', () => {
    render(<CycleCard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('View'));
    expect(mockOnView).toHaveBeenCalledWith(mockInactiveCycle);
  });

  it('calls onSetActive when Set Active button is clicked', () => {
    render(<CycleCard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Set Active'));
    expect(mockOnSetActive).toHaveBeenCalledWith('inactive-cycle');
  });

  it('calls onDelete when Delete button is clicked', () => {
    render(<CycleCard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledWith('inactive-cycle');
  });

  it('applies correct CSS classes to buttons', () => {
    render(<CycleCard {...defaultProps} />);
    
    expect(screen.getByText('View')).toHaveClass('cycle-action-button', 'view');
    expect(screen.getByText('Set Active')).toHaveClass('cycle-action-button', 'activate');
    expect(screen.getByText('Delete')).toHaveClass('cycle-action-button', 'delete');
  });

  it('renders correct container structure with CSS classes', () => {
    const { container } = render(<CycleCard {...defaultProps} />);
    
    expect(container.querySelector('.cycle-card')).toBeInTheDocument();
    expect(container.querySelector('.cycle-header')).toBeInTheDocument();
    expect(container.querySelector('.cycle-title')).toBeInTheDocument();
    expect(container.querySelector('.cycle-date')).toBeInTheDocument();
    expect(container.querySelector('.cycle-created-date')).toBeInTheDocument();
    expect(container.querySelector('.cycle-actions')).toBeInTheDocument();
  });

  it('formats dates correctly for different locales', () => {
    const cycleWithDifferentDate: FiveThreeOneCycle = {
      ...mockInactiveCycle,
      startDate: new Date('2025-06-15'),
      createdDate: new Date('2025-05-30')
    };

    render(<CycleCard {...defaultProps} cycle={cycleWithDifferentDate} />);
    
    expect(screen.getByText(/Start Date:/)).toBeInTheDocument();
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });

  it('handles cycle with long name', () => {
    const cycleWithLongName: FiveThreeOneCycle = {
      ...mockInactiveCycle,
      name: 'Very Long Cycle Name That Might Wrap To Multiple Lines'
    };

    render(<CycleCard {...defaultProps} cycle={cycleWithLongName} />);
    
    expect(screen.getByText('Very Long Cycle Name That Might Wrap To Multiple Lines')).toBeInTheDocument();
  });

  it('handles cycle with long notes', () => {
    const cycleWithLongNotes: FiveThreeOneCycle = {
      ...mockInactiveCycle,
      notes: 'This is a very long note that contains a lot of information about the cycle and might wrap to multiple lines in the display'
    };

    render(<CycleCard {...defaultProps} cycle={cycleWithLongNotes} />);
    
    expect(screen.getByText('"This is a very long note that contains a lot of information about the cycle and might wrap to multiple lines in the display"')).toBeInTheDocument();
  });
});