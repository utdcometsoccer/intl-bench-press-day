import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateCycleForm from '../components/CreateCycleForm';
import { type ExerciseRecord } from '../types';

describe('CreateCycleForm', () => {
  const mockOnCycleNameChange = vi.fn();
  const mockOnStartDateChange = vi.fn();
  const mockOnNotesChange = vi.fn();
  const mockOnUsePersonalRecordsChange = vi.fn();
  const mockOnCustomMaxChange = vi.fn();
  const mockOnCreateCycle = vi.fn();

  const mockPersonalRecords = new Map<string, ExerciseRecord>([
    ['back-squat', { 
      id: '1',
      exerciseId: 'back-squat',
      exerciseName: 'Back Squat',
      workoutSet: { Repetions: 1, Weight: 300 },
      oneRepMax: 300,
      formulaUsed: 'Epley',
      formulaId: 'epley',
      dateRecorded: new Date('2025-01-01'),
      notes: 'Good form'
    }],
    ['bench-press', { 
      id: '2',
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      workoutSet: { Repetions: 1, Weight: 200 },
      oneRepMax: 200,
      formulaUsed: 'Epley',
      formulaId: 'epley',
      dateRecorded: new Date('2025-01-01'),
      notes: 'Solid lift'
    }]
  ]);

  const defaultProps = {
    cycleName: '',
    startDate: '',
    notes: '',
    usePersonalRecords: true,
    customMaxes: {},
    personalRecords: mockPersonalRecords,
    isCreating: false,
    onCycleNameChange: mockOnCycleNameChange,
    onStartDateChange: mockOnStartDateChange,
    onNotesChange: mockOnNotesChange,
    onUsePersonalRecordsChange: mockOnUsePersonalRecordsChange,
    onCustomMaxChange: mockOnCustomMaxChange,
    onCreateCycle: mockOnCreateCycle
  };

  beforeEach(() => {
    mockOnCycleNameChange.mockClear();
    mockOnStartDateChange.mockClear();
    mockOnNotesChange.mockClear();
    mockOnUsePersonalRecordsChange.mockClear();
    mockOnCustomMaxChange.mockClear();
    mockOnCreateCycle.mockClear();
  });

  it('renders form title', () => {
    render(<CreateCycleForm {...defaultProps} />);
    
    expect(screen.getByText('Create New 5-3-1 Cycle')).toBeInTheDocument();
  });

  it('renders cycle name input with correct value', () => {
    render(<CreateCycleForm {...defaultProps} cycleName="Test Cycle" />);
    
    const input = screen.getByLabelText('Cycle Name:');
    expect(input).toHaveValue('Test Cycle');
    expect(input).toHaveAttribute('placeholder', 'e.g., Cycle 2025-01');
  });

  it('renders start date input with correct value', () => {
    render(<CreateCycleForm {...defaultProps} startDate="2025-01-15" />);
    
    const input = screen.getByLabelText('Start Date:');
    expect(input).toHaveValue('2025-01-15');
    expect(input).toHaveAttribute('type', 'date');
  });

  it('renders notes textarea with correct value', () => {
    render(<CreateCycleForm {...defaultProps} notes="Test notes" />);
    
    const textarea = screen.getByLabelText('Notes (optional):');
    expect(textarea).toHaveValue('Test notes');
    expect(textarea).toHaveAttribute('placeholder', 'Any notes about this cycle...');
    expect(textarea).toHaveAttribute('rows', '3');
  });

  it('calls onCycleNameChange when cycle name changes', () => {
    render(<CreateCycleForm {...defaultProps} />);
    
    const input = screen.getByLabelText('Cycle Name:');
    fireEvent.change(input, { target: { value: 'New Cycle' } });
    
    expect(mockOnCycleNameChange).toHaveBeenCalledWith('New Cycle');
  });

  it('calls onStartDateChange when start date changes', () => {
    render(<CreateCycleForm {...defaultProps} />);
    
    const input = screen.getByLabelText('Start Date:');
    fireEvent.change(input, { target: { value: '2025-02-01' } });
    
    expect(mockOnStartDateChange).toHaveBeenCalledWith('2025-02-01');
  });

  it('calls onNotesChange when notes change', () => {
    render(<CreateCycleForm {...defaultProps} />);
    
    const textarea = screen.getByLabelText('Notes (optional):');
    fireEvent.change(textarea, { target: { value: 'Updated notes' } });
    
    expect(mockOnNotesChange).toHaveBeenCalledWith('Updated notes');
  });

  it('renders radio buttons for personal records option', () => {
    render(<CreateCycleForm {...defaultProps} />);
    
    expect(screen.getByText('Use Personal Records (from Exercise Tracker)')).toBeInTheDocument();
    expect(screen.getByText('Enter Custom Maxes')).toBeInTheDocument();
  });

  it('shows correct radio button selection', () => {
    render(<CreateCycleForm {...defaultProps} usePersonalRecords={true} />);
    
    const personalRecordsRadio = screen.getByLabelText('Use Personal Records (from Exercise Tracker)');
    const customMaxesRadio = screen.getByLabelText('Enter Custom Maxes');
    
    expect(personalRecordsRadio).toBeChecked();
    expect(customMaxesRadio).not.toBeChecked();
  });

  it('calls onUsePersonalRecordsChange when radio buttons are clicked', () => {
    render(<CreateCycleForm {...defaultProps} />);
    
    const customMaxesRadio = screen.getByLabelText('Enter Custom Maxes');
    fireEvent.click(customMaxesRadio);
    
    expect(mockOnUsePersonalRecordsChange).toHaveBeenCalledWith(false);
  });

  it('renders exercise cards for all main exercises', () => {
    render(<CreateCycleForm {...defaultProps} />);
    
    expect(screen.getByText('Back Squat')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Deadlift')).toBeInTheDocument();
    expect(screen.getByText('Overhead Press')).toBeInTheDocument();
  });

  it('displays personal records when using personal records', () => {
    render(<CreateCycleForm {...defaultProps} usePersonalRecords={true} />);
    
    // Looking for text split across elements
    expect(screen.getByText(/300 lbs/)).toBeInTheDocument();
    expect(screen.getByText(/200 lbs/)).toBeInTheDocument();
    expect(screen.getByText(/Training Max: 270/)).toBeInTheDocument();
    expect(screen.getByText(/Training Max: 180/)).toBeInTheDocument();
  });

  it('displays custom max inputs when not using personal records', () => {
    render(<CreateCycleForm {...defaultProps} usePersonalRecords={false} />);
    
    const inputs = screen.getAllByPlaceholderText('Enter 1RM');
    expect(inputs).toHaveLength(4); // One for each main exercise
  });

  it('displays "No record found" for exercises without personal records', () => {
    const limitedPersonalRecords = new Map<string, ExerciseRecord>([
      ['back-squat', { 
        id: '1',
        exerciseId: 'back-squat',
        exerciseName: 'Back Squat',
        workoutSet: { Repetions: 1, Weight: 300 },
        oneRepMax: 300,
        formulaUsed: 'Epley',
        formulaId: 'epley',
        dateRecorded: new Date('2025-01-01'),
        notes: 'Good form'
      }]
    ]);

    render(<CreateCycleForm {...defaultProps} personalRecords={limitedPersonalRecords} usePersonalRecords={true} />);
    
    expect(screen.getByText(/300 lbs/)).toBeInTheDocument();
    expect(screen.getAllByText('No record found')).toHaveLength(3);
  });

  it('renders create cycle button with correct text and state', () => {
    render(<CreateCycleForm {...defaultProps} cycleName="Valid Cycle Name" />);
    
    const button = screen.getByText('Create 5-3-1 Cycle');
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('shows creating state on button when isCreating is true', () => {
    render(<CreateCycleForm {...defaultProps} isCreating={true} />);
    
    expect(screen.getByText('Creating Cycle...')).toBeInTheDocument();
  });

  it('disables button when isCreating is true', () => {
    render(<CreateCycleForm {...defaultProps} isCreating={true} />);
    
    const button = screen.getByText('Creating Cycle...');
    expect(button).toBeDisabled();
  });

  it('disables button when cycle name is empty', () => {
    render(<CreateCycleForm {...defaultProps} cycleName="" />);
    
    const button = screen.getByText('Create 5-3-1 Cycle');
    expect(button).toBeDisabled();
  });

  it('disables button when cycle name is only whitespace', () => {
    render(<CreateCycleForm {...defaultProps} cycleName="   " />);
    
    const button = screen.getByText('Create 5-3-1 Cycle');
    expect(button).toBeDisabled();
  });

  it('enables button when cycle name is provided', () => {
    render(<CreateCycleForm {...defaultProps} cycleName="Valid Cycle Name" />);
    
    const button = screen.getByText('Create 5-3-1 Cycle');
    expect(button).toBeEnabled();
  });

  it('calls onCreateCycle when create button is clicked', () => {
    render(<CreateCycleForm {...defaultProps} cycleName="Test Cycle" />);
    
    const button = screen.getByText('Create 5-3-1 Cycle');
    fireEvent.click(button);
    
    expect(mockOnCreateCycle).toHaveBeenCalledTimes(1);
  });

  it('renders one rep max configuration section', () => {
    render(<CreateCycleForm {...defaultProps} />);
    
    expect(screen.getByText('One Rep Max Configuration')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<CreateCycleForm {...defaultProps} />);
    
    expect(container.querySelector('.form-grid.two-column')).toBeInTheDocument();
    expect(container.querySelector('.form-section')).toBeInTheDocument();
    expect(container.querySelector('.one-rep-max-config')).toBeInTheDocument();
    expect(container.querySelector('.radio-group')).toBeInTheDocument();
    expect(container.querySelector('.max-config-grid')).toBeInTheDocument();
  });
});