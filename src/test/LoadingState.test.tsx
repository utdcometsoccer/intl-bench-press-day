import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingState from '../components/LoadingState';

describe('LoadingState', () => {
  it('renders title and default loading message', () => {
    render(<LoadingState title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders title and custom message', () => {
    render(<LoadingState title="Custom Title" message="Please wait..." />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders with correct structure and classes', () => {
    const { container } = render(<LoadingState title="Test" />);
    
    expect(container.querySelector('.five-three-one-planner')).toBeInTheDocument();
    expect(container.querySelector('h2')).toBeInTheDocument();
  });

  it('uses InfoMessage component for displaying message', () => {
    render(<LoadingState title="Test" message="Custom loading message" />);
    
    // The InfoMessage component should render the message
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('renders with different titles', () => {
    const { rerender } = render(<LoadingState title="First Title" />);
    expect(screen.getByText('First Title')).toBeInTheDocument();
    
    rerender(<LoadingState title="Second Title" />);
    expect(screen.getByText('Second Title')).toBeInTheDocument();
    expect(screen.queryByText('First Title')).not.toBeInTheDocument();
  });

  it('renders with different messages', () => {
    const { rerender } = render(<LoadingState title="Test" message="First Message" />);
    expect(screen.getByText('First Message')).toBeInTheDocument();
    
    rerender(<LoadingState title="Test" message="Second Message" />);
    expect(screen.getByText('Second Message')).toBeInTheDocument();
    expect(screen.queryByText('First Message')).not.toBeInTheDocument();
  });
});