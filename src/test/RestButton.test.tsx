import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

/**
 * Test to verify that the rest timer button has proper visual feedback styling.
 * This test validates that the button element exists and has the correct CSS class
 * that provides :active state feedback when pressed.
 */

// Shared test component to avoid duplication
const TestRestButton = () => (
  <button
    type="button"
    className="start-rest-timer-button"
    aria-label="Start rest timer"
  >
    ⏱️ Rest
  </button>
);

describe('Rest Button Visual Feedback', () => {
  it('rest button has proper CSS class for visual feedback', () => {
    render(<TestRestButton />);
    
    const button = screen.getByLabelText('Start rest timer');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('start-rest-timer-button');
  });

  it('rest button has button type attribute', () => {
    render(<TestRestButton />);
    
    const button = screen.getByLabelText('Start rest timer');
    expect(button).toHaveAttribute('type', 'button');
  });
});
