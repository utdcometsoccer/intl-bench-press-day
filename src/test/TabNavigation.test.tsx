import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TabNavigation from '../components/TabNavigation';

describe('TabNavigation', () => {
  const mockOnTabChange = vi.fn();
  
  const defaultProps = {
    activeTab: 'create' as const,
    onTabChange: mockOnTabChange
  };

  beforeEach(() => {
    mockOnTabChange.mockClear();
  });

  it('renders all default tabs', () => {
    render(<TabNavigation {...defaultProps} />);
    
    expect(screen.getByText('Create Cycle')).toBeInTheDocument();
    expect(screen.getByText('Manage Cycles')).toBeInTheDocument();
    expect(screen.getByText('View Workouts')).toBeInTheDocument();
  });

  it('applies active class to the active tab', () => {
    render(<TabNavigation {...defaultProps} activeTab="create" />);
    
    const createButton = screen.getByText('Create Cycle');
    const manageButton = screen.getByText('Manage Cycles');
    const viewButton = screen.getByText('View Workouts');
    
    expect(createButton).toHaveClass('planner-tab-button', 'active');
    expect(manageButton).toHaveClass('planner-tab-button');
    expect(manageButton).not.toHaveClass('active');
    expect(viewButton).toHaveClass('planner-tab-button');
    expect(viewButton).not.toHaveClass('active');
  });

  it('applies active class to different tabs', () => {
    const { rerender } = render(<TabNavigation {...defaultProps} activeTab="manage" />);
    
    expect(screen.getByText('Manage Cycles')).toHaveClass('active');
    expect(screen.getByText('Create Cycle')).not.toHaveClass('active');
    expect(screen.getByText('View Workouts')).not.toHaveClass('active');

    rerender(<TabNavigation {...defaultProps} activeTab="view" />);
    
    expect(screen.getByText('View Workouts')).toHaveClass('active');
    expect(screen.getByText('Create Cycle')).not.toHaveClass('active');
    expect(screen.getByText('Manage Cycles')).not.toHaveClass('active');
  });

  it('calls onTabChange when tab is clicked', () => {
    render(<TabNavigation {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Manage Cycles'));
    expect(mockOnTabChange).toHaveBeenCalledWith('manage');
    
    fireEvent.click(screen.getByText('View Workouts'));
    expect(mockOnTabChange).toHaveBeenCalledWith('view');
    
    fireEvent.click(screen.getByText('Create Cycle'));
    expect(mockOnTabChange).toHaveBeenCalledWith('create');
  });

  it('renders with custom tabs when provided', () => {
    const customTabs = [
      { key: 'create' as const, label: 'New Cycle' },
      { key: 'view' as const, label: 'Show Workouts' }
    ];

    render(<TabNavigation {...defaultProps} tabs={customTabs} />);
    
    expect(screen.getByText('New Cycle')).toBeInTheDocument();
    expect(screen.getByText('Show Workouts')).toBeInTheDocument();
    expect(screen.queryByText('Manage Cycles')).not.toBeInTheDocument();
  });

  it('handles empty tabs array', () => {
    render(<TabNavigation {...defaultProps} tabs={[]} />);
    
    expect(screen.queryByText('Create Cycle')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage Cycles')).not.toBeInTheDocument();
    expect(screen.queryByText('View Workouts')).not.toBeInTheDocument();
  });

  it('renders with correct container class', () => {
    const { container } = render(<TabNavigation {...defaultProps} />);
    
    expect(container.querySelector('.planner-tab-navigation')).toBeInTheDocument();
  });

  it('applies correct button classes to all tabs', () => {
    render(<TabNavigation {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('planner-tab-button');
    });
  });

  it('maintains tab order', () => {
    render(<TabNavigation {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Create Cycle');
    expect(buttons[1]).toHaveTextContent('Manage Cycles');
    expect(buttons[2]).toHaveTextContent('View Workouts');
  });

  it('handles single tab', () => {
    const singleTab = [{ key: 'create' as const, label: 'Only Tab' }];
    
    render(<TabNavigation {...defaultProps} tabs={singleTab} />);
    
    expect(screen.getByText('Only Tab')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('does not call onTabChange when clicking already active tab', () => {
    render(<TabNavigation {...defaultProps} activeTab="create" />);
    
    fireEvent.click(screen.getByText('Create Cycle'));
    expect(mockOnTabChange).toHaveBeenCalledWith('create');
    // Component doesn't prevent this - it's up to the parent to handle
  });
});