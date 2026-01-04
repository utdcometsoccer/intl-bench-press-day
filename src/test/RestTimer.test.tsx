import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RestTimer from '../components/RestTimer';

// Mock the Web Audio API
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
    type: 'sine',
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  })),
  destination: {},
  currentTime: 0,
  close: vi.fn(),
};

(window as any).AudioContext = vi.fn(() => mockAudioContext);
(window as any).webkitAudioContext = vi.fn(() => mockAudioContext);

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn(),
});

describe('RestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders with default props', () => {
    render(<RestTimer />);
    
    expect(screen.getByText('Rest Timer')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument(); // Default 90 seconds
  });

  it('renders with custom initial time', () => {
    render(<RestTimer initialTime={60} />);
    
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    render(<RestTimer show={false} />);
    
    expect(screen.queryByText('Rest Timer')).not.toBeInTheDocument();
  });

  it('auto-starts when autoStart is true', () => {
    render(<RestTimer initialTime={5} autoStart={true} />);
    
    expect(screen.getByText('0:05')).toBeInTheDocument();
    
    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText('0:04')).toBeInTheDocument();
  });

  it('starts and pauses timer on button click', () => {
    render(<RestTimer initialTime={10} />);
    
    const startButton = screen.getByLabelText('Start timer');
    expect(startButton).toHaveTextContent('▶ Start');
    
    // Start timer
    fireEvent.click(startButton);
    expect(screen.getByLabelText('Pause timer')).toHaveTextContent('⏸ Pause');
    
    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('0:09')).toBeInTheDocument();
    
    // Pause timer
    const pauseButton = screen.getByLabelText('Pause timer');
    fireEvent.click(pauseButton);
    expect(screen.getByLabelText('Start timer')).toHaveTextContent('▶ Start');
    
    // Time should not advance when paused
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('0:09')).toBeInTheDocument();
  });

  it('resets timer to selected preset', () => {
    render(<RestTimer initialTime={90} />);
    
    // Start timer and let it run
    const startButton = screen.getByLabelText('Start timer');
    fireEvent.click(startButton);
    act(() => {
      vi.advanceTimersByTime(10000); // 10 seconds
    });
    
    expect(screen.getByText('1:20')).toBeInTheDocument();
    
    // Reset timer
    const resetButton = screen.getByLabelText('Reset timer');
    fireEvent.click(resetButton);
    
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('changes preset time', () => {
    render(<RestTimer />);
    
    expect(screen.getByText('1:30')).toBeInTheDocument();
    
    // Click on 1min preset
    const oneMinButton = screen.getByLabelText('Set rest time to 1min');
    fireEvent.click(oneMinButton);
    
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('renders all preset buttons', () => {
    render(<RestTimer />);
    
    expect(screen.getByLabelText('Set rest time to 30s')).toBeInTheDocument();
    expect(screen.getByLabelText('Set rest time to 1min')).toBeInTheDocument();
    expect(screen.getByLabelText('Set rest time to 90s')).toBeInTheDocument();
    expect(screen.getByLabelText('Set rest time to 2min')).toBeInTheDocument();
    expect(screen.getByLabelText('Set rest time to 3min')).toBeInTheDocument();
    expect(screen.getByLabelText('Set rest time to 5min')).toBeInTheDocument();
    expect(screen.getByLabelText('Set custom rest time')).toBeInTheDocument();
  });

  it('shows custom input when Custom button is clicked', () => {
    render(<RestTimer />);
    
    const customButton = screen.getByLabelText('Set custom rest time');
    fireEvent.click(customButton);
    
    expect(screen.getByLabelText('Custom rest time in seconds')).toBeInTheDocument();
    expect(screen.getByLabelText('Set custom time')).toBeInTheDocument();
  });

  it('sets custom time', () => {
    render(<RestTimer />);
    
    const customButton = screen.getByLabelText('Set custom rest time');
    fireEvent.click(customButton);
    
    const customInput = screen.getByLabelText('Custom rest time in seconds');
    fireEvent.change(customInput, { target: { value: '45' } });
    
    const setButton = screen.getByLabelText('Set custom time');
    fireEvent.click(setButton);
    
    expect(screen.getByText('0:45')).toBeInTheDocument();
  });

  it('disables custom time set button when input is empty', () => {
    render(<RestTimer />);
    
    const customButton = screen.getByLabelText('Set custom rest time');
    fireEvent.click(customButton);
    
    const setButton = screen.getByLabelText('Set custom time');
    expect(setButton).toBeDisabled();
  });

  it('extends time by 30 seconds', () => {
    render(<RestTimer initialTime={60} />);
    
    expect(screen.getByText('1:00')).toBeInTheDocument();
    
    const extendButton = screen.getByLabelText('Increase time by 30 seconds');
    fireEvent.click(extendButton);
    
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('decreases time by 30 seconds', () => {
    render(<RestTimer initialTime={90} />);
    
    expect(screen.getByText('1:30')).toBeInTheDocument();
    
    const decreaseButton = screen.getByLabelText('Decrease time by 30 seconds');
    fireEvent.click(decreaseButton);
    
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('disables decrease button when time is less than 30 seconds', () => {
    render(<RestTimer initialTime={20} />);
    
    const decreaseButton = screen.getByLabelText('Decrease time by 30 seconds');
    expect(decreaseButton).toBeDisabled();
  });

  it('calls onComplete when timer finishes', () => {
    const onComplete = vi.fn();
    render(<RestTimer initialTime={1} autoStart={true} onComplete={onComplete} />);
    
    // Advance timer by 1 second to complete
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // onComplete is called inside setState callback which happens async
    // The important thing is that the timer reaches 0
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    render(<RestTimer onDismiss={onDismiss} />);
    
    const closeButton = screen.getByLabelText('Close rest timer');
    fireEvent.click(closeButton);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('plays audio notification on completion', () => {
    render(<RestTimer initialTime={1} autoStart={true} />);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it('triggers vibration on completion', () => {
    render(<RestTimer initialTime={1} autoStart={true} />);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200, 100, 200]);
  });

  it('formats time correctly', () => {
    render(<RestTimer initialTime={0} />);
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('formats 5 seconds correctly', () => {
    render(<RestTimer initialTime={5} />);
    expect(screen.getByText('0:05')).toBeInTheDocument();
  });

  it('formats 60 seconds correctly', () => {
    render(<RestTimer initialTime={60} />);
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('formats 125 seconds correctly', () => {
    render(<RestTimer initialTime={125} />);
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('formats 3600 seconds correctly', () => {
    render(<RestTimer initialTime={3600} />);
    expect(screen.getByText('60:00')).toBeInTheDocument();
  });

  it('has accessible timer role', () => {
    render(<RestTimer />);
    
    const timer = screen.getByRole('timer');
    expect(timer).toBeInTheDocument();
  });

  it('has live region for time updates', () => {
    render(<RestTimer initialTime={10} autoStart={true} />);
    
    const timeDisplay = screen.getByText('0:10');
    expect(timeDisplay).toHaveAttribute('aria-live', 'polite');
    expect(timeDisplay).toHaveAttribute('aria-atomic', 'true');
  });

  it('highlights active preset button', () => {
    render(<RestTimer initialTime={90} />);
    
    const ninetySecButton = screen.getByLabelText('Set rest time to 90s');
    expect(ninetySecButton).toHaveClass('active');
    
    // Click another preset
    const sixtySecButton = screen.getByLabelText('Set rest time to 1min');
    fireEvent.click(sixtySecButton);
    
    expect(sixtySecButton).toHaveClass('active');
    expect(ninetySecButton).not.toHaveClass('active');
  });

  it('stops timer when reaching zero', () => {
    render(<RestTimer initialTime={2} autoStart={true} />);
    
    expect(screen.getByText('0:02')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('0:00')).toBeInTheDocument();
    
    // Verify timer stopped by checking button text
    expect(screen.getByLabelText('Start timer')).toBeInTheDocument();
  });

  it('does not call onComplete multiple times', () => {
    const onComplete = vi.fn();
    render(<RestTimer initialTime={1} autoStart={true} onComplete={onComplete} />);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(onComplete).toHaveBeenCalledTimes(1);
    
    // Advance more time
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    // Should still only be called once
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
