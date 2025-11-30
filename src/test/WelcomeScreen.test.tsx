import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WelcomeScreen from '../components/WelcomeScreen';

describe('WelcomeScreen', () => {
  it('should render the welcome title', () => {
    render(<WelcomeScreen onContinue={() => {}} />);
    
    expect(screen.getByText(/Welcome to International Bench Press Day!/i)).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(<WelcomeScreen onContinue={() => {}} />);
    
    expect(screen.getByText(/Your personal 5\/3\/1 strength training companion/i)).toBeInTheDocument();
  });

  it('should render all feature items', () => {
    render(<WelcomeScreen onContinue={() => {}} />);
    
    expect(screen.getByText(/Track Your Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/5\/3\/1 Program/i)).toBeInTheDocument();
    expect(screen.getByText(/Works Offline/i)).toBeInTheDocument();
    expect(screen.getByText(/Plate Calculator/i)).toBeInTheDocument();
  });

  it('should call onContinue when button is clicked', () => {
    const onContinueMock = vi.fn();
    render(<WelcomeScreen onContinue={onContinueMock} />);
    
    const button = screen.getByRole('button', { name: /Get started with the app/i });
    fireEvent.click(button);
    
    expect(onContinueMock).toHaveBeenCalledTimes(1);
  });

  it('should have accessible button', () => {
    render(<WelcomeScreen onContinue={() => {}} />);
    
    const button = screen.getByRole('button', { name: /Get started with the app/i });
    expect(button).toBeInTheDocument();
  });

  it('should display the welcome note', () => {
    render(<WelcomeScreen onContinue={() => {}} />);
    
    expect(screen.getByText(/We'll help you set up your profile and first training cycle/i)).toBeInTheDocument();
  });
});
