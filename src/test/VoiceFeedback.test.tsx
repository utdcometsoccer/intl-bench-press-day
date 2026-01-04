import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import VoiceFeedback from '../components/VoiceFeedback';

describe('VoiceFeedback', () => {
  it('renders error block with assertive aria-live', () => {
    render(<VoiceFeedback error="Something went wrong" />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    const errorText = screen.getByText('Something went wrong');
    expect(errorText).toHaveClass('voice-error');
  });

  it('renders feedback block with polite aria-live', () => {
    render(<VoiceFeedback feedback="Listening..." />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
    const feedbackText = screen.getByText('Listening...');
    expect(feedbackText).toHaveClass('command-text');
  });

  it('renders nothing when neither error nor feedback provided', () => {
    const { container } = render(<VoiceFeedback />);
    expect(container).toBeEmptyDOMElement();
  });
});
