import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GuidedWorkout from '../components/GuidedWorkout';

describe('GuidedWorkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the guided workout title', () => {
    render(<GuidedWorkout onComplete={() => {}} onSkip={() => {}} />);
    
    expect(screen.getByText(/Guided Workout Tour/i)).toBeInTheDocument();
  });

  it('should display the first step initially', () => {
    render(<GuidedWorkout onComplete={() => {}} onSkip={() => {}} />);
    
    expect(screen.getByText(/Step 1: Warmup Sets/i)).toBeInTheDocument();
  });

  it('should navigate to next step when Next button is clicked', () => {
    render(<GuidedWorkout onComplete={() => {}} onSkip={() => {}} />);
    
    const nextButton = screen.getByRole('button', { name: /Go to next step/i });
    fireEvent.click(nextButton);
    
    expect(screen.getByText(/Step 2: Main Sets/i)).toBeInTheDocument();
  });

  it('should navigate to previous step when Previous button is clicked', () => {
    render(<GuidedWorkout onComplete={() => {}} onSkip={() => {}} />);
    
    // Go to step 2
    const nextButton = screen.getByRole('button', { name: /Go to next step/i });
    fireEvent.click(nextButton);
    
    // Go back to step 1
    const prevButton = screen.getByRole('button', { name: /Go to previous step/i });
    fireEvent.click(prevButton);
    
    expect(screen.getByText(/Step 1: Warmup Sets/i)).toBeInTheDocument();
  });

  it('should call onComplete when completing the last step', () => {
    const onCompleteMock = vi.fn();
    render(<GuidedWorkout onComplete={onCompleteMock} onSkip={() => {}} />);
    
    // Navigate through all steps
    for (let i = 0; i < 4; i++) {
      const nextButton = screen.getByRole('button', { name: /Go to next step/i });
      fireEvent.click(nextButton);
    }
    
    // Complete button on last step
    const completeButton = screen.getByRole('button', { name: /Complete the tour/i });
    fireEvent.click(completeButton);
    
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('should call onSkip when Skip Tour button is clicked', () => {
    const onSkipMock = vi.fn();
    render(<GuidedWorkout onComplete={() => {}} onSkip={onSkipMock} />);
    
    const skipButton = screen.getByRole('button', { name: /Skip the guided tour/i });
    fireEvent.click(skipButton);
    
    expect(onSkipMock).toHaveBeenCalledTimes(1);
  });

  it('should render step progress dots', () => {
    render(<GuidedWorkout onComplete={() => {}} onSkip={() => {}} />);
    
    // Check for progress indicator
    const progressIndicator = screen.getByLabelText(/Step 1 of 5/i);
    expect(progressIndicator).toBeInTheDocument();
  });

  it('should display tips for each step', () => {
    render(<GuidedWorkout onComplete={() => {}} onSkip={() => {}} />);
    
    // Check for tips in step 1
    expect(screen.getByText(/Perform 3 warmup sets/i)).toBeInTheDocument();
  });
});
