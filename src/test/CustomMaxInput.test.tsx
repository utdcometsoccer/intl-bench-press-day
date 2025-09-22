import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomMaxInput from '../components/CustomMaxInput';

describe('CustomMaxInput', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    exerciseId: 'bench-press',
    value: 0,
    onChange: mockOnChange
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders input with correct attributes', () => {
    render(<CustomMaxInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter 1RM');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('step', '0.5');
    expect(input).toHaveClass('custom-max-input');
  });

  it('displays empty value when value is 0', () => {
    render(<CustomMaxInput {...defaultProps} value={0} />);
    
    const input = screen.getByPlaceholderText('Enter 1RM');
    expect(input).toHaveValue(null);
  });

  it('displays the correct value when provided', () => {
    render(<CustomMaxInput {...defaultProps} value={200} />);
    
    const input = screen.getByPlaceholderText('Enter 1RM');
    expect(input).toHaveValue(200);
  });

  it('calls onChange when input value changes', () => {
    render(<CustomMaxInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter 1RM');
    fireEvent.change(input, { target: { value: '250' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('bench-press', '250');
  });

  it('does not display training max when value is 0', () => {
    render(<CustomMaxInput {...defaultProps} value={0} />);
    
    expect(screen.queryByText(/Training Max:/)).not.toBeInTheDocument();
  });

  it('displays training max when value is greater than 0', () => {
    render(<CustomMaxInput {...defaultProps} value={200} />);
    
    expect(screen.getByText('Training Max: 180 lbs (90%)')).toBeInTheDocument();
  });

  it('calculates training max correctly for different values', () => {
    const { rerender } = render(<CustomMaxInput {...defaultProps} value={300} />);
    expect(screen.getByText('Training Max: 270 lbs (90%)')).toBeInTheDocument();

    rerender(<CustomMaxInput {...defaultProps} value={150} />);
    expect(screen.getByText('Training Max: 135 lbs (90%)')).toBeInTheDocument();

    rerender(<CustomMaxInput {...defaultProps} value={100} />);
    expect(screen.getByText('Training Max: 90 lbs (90%)')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <CustomMaxInput {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles decimal values correctly', () => {
    render(<CustomMaxInput {...defaultProps} value={225.5} />);
    
    const input = screen.getByPlaceholderText('Enter 1RM');
    expect(input).toHaveValue(225.5);
    expect(screen.getByText('Training Max: 203 lbs (90%)')).toBeInTheDocument();
  });

  it('updates training max when value changes', () => {
    const { rerender } = render(<CustomMaxInput {...defaultProps} value={200} />);
    expect(screen.getByText('Training Max: 180 lbs (90%)')).toBeInTheDocument();

    rerender(<CustomMaxInput {...defaultProps} value={250} />);
    expect(screen.getByText('Training Max: 225 lbs (90%)')).toBeInTheDocument();
  });

  it('handles onChange with different exercise IDs', () => {
    const { rerender } = render(<CustomMaxInput {...defaultProps} exerciseId="squat" />);
    
    const input = screen.getByPlaceholderText('Enter 1RM');
    fireEvent.change(input, { target: { value: '300' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('squat', '300');

    mockOnChange.mockClear();
    
    rerender(<CustomMaxInput {...defaultProps} exerciseId="deadlift" />);
    fireEvent.change(input, { target: { value: '400' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('deadlift', '400');
  });
});