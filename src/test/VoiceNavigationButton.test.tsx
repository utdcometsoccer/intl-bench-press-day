import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as useVoiceNavModule from '../hooks/useVoiceNavigation';
import VoiceNavigationButton from '../components/VoiceNavigationButton';

vi.mock('../hooks/useVoiceNavigation', () => ({
  useVoiceNavigation: vi.fn(() => ({
    isListening: false,
    isSupported: true,
    feedback: 'Go to dashboard',
    error: null,
    lastCommand: null,
    toggleListening: vi.fn(),
    startListening: vi.fn(),
    stopListening: vi.fn(),
    registerHandler: vi.fn(() => vi.fn()),
    availableCommands: [],
  })),
  VOICE_COMMANDS: [],
}));

describe('VoiceNavigationButton', () => {
  beforeEach(() => {
    // Reset mocked return to default supported with feedback
    const mockedUseVoiceNavigation = vi.mocked(useVoiceNavModule.useVoiceNavigation);
    mockedUseVoiceNavigation.mockReturnValue({
      isListening: false,
      isSupported: true,
      feedback: 'Go to dashboard',
      error: null,
      lastCommand: null,
      toggleListening: vi.fn(),
      startListening: vi.fn(),
      stopListening: vi.fn(),
      registerHandler: vi.fn(() => vi.fn()),
      availableCommands: [],
    });
  });

  it('renders feedback via VoiceFeedback with polite aria-live', () => {
    render(<VoiceNavigationButton onNavigate={() => {}} />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Go to dashboard')).toHaveClass('command-text');
  });

  it('renders error via VoiceFeedback with assertive aria-live', () => {
    const mockedUseVoiceNavigation = vi.mocked(useVoiceNavModule.useVoiceNavigation);
    mockedUseVoiceNavigation.mockReturnValue({
      isListening: false,
      isSupported: true,
      feedback: null,
      error: 'Microphone access denied',
      lastCommand: null,
      toggleListening: vi.fn(),
      startListening: vi.fn(),
      stopListening: vi.fn(),
      registerHandler: vi.fn(() => vi.fn()),
      availableCommands: [],
    });

    render(<VoiceNavigationButton onNavigate={() => {}} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText('Microphone access denied')).toHaveClass('voice-error');
  });

  it('does not render when voice navigation unsupported', () => {
    const mockedUseVoiceNavigation = vi.mocked(useVoiceNavModule.useVoiceNavigation);
    mockedUseVoiceNavigation.mockReturnValue({
      isListening: false,
      isSupported: false,
      feedback: null,
      error: null,
      lastCommand: null,
      toggleListening: vi.fn(),
      startListening: vi.fn(),
      stopListening: vi.fn(),
      registerHandler: vi.fn(() => vi.fn()),
      availableCommands: [],
    });

    const { container } = render(<VoiceNavigationButton onNavigate={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mic button has type="button" and triggers toggleListening', () => {
    const toggleSpy = vi.fn();
    const mockedUseVoiceNavigation = vi.mocked(useVoiceNavModule.useVoiceNavigation);
    mockedUseVoiceNavigation.mockReturnValue({
      isListening: false,
      isSupported: true,
      feedback: null,
      error: null,
      lastCommand: null,
      toggleListening: toggleSpy,
      startListening: vi.fn(),
      stopListening: vi.fn(),
      registerHandler: vi.fn(() => vi.fn()),
      availableCommands: [],
    });

    render(<VoiceNavigationButton onNavigate={() => {}} />);
    const micButton = screen.getByRole('button', { name: /start voice commands/i });
    expect(micButton).toHaveAttribute('type', 'button');
    fireEvent.click(micButton);
    expect(toggleSpy).toHaveBeenCalledTimes(1);
  });

  it('help button toggles dialog and aria-controls correctly', () => {
    render(<VoiceNavigationButton onNavigate={() => {}} />);
    const helpButton = screen.getByRole('button', { name: /voice commands help/i });
    expect(helpButton).toHaveAttribute('aria-controls', 'voice-help-panel');

    // Dialog should not be visible initially
    expect(screen.queryByRole('dialog')).toBeNull();

    // Click help button to open dialog
    fireEvent.click(helpButton);

    // Ensure dialog is present when open
    let dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = screen.getByRole('heading', { name: /voice commands/i, level: 3 });
    expect(title).toBeInTheDocument();

    // Close via close button
    const closeBtn = screen.getByRole('button', { name: /close voice commands help/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Re-open via help button
    fireEvent.click(helpButton);
    dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('shows listening indicator with polite aria-live when listening', () => {
    const mockedUseVoiceNavigation = vi.mocked(useVoiceNavModule.useVoiceNavigation);
    mockedUseVoiceNavigation.mockReturnValue({
      isListening: true,
      isSupported: true,
      feedback: null,
      error: null,
      lastCommand: null,
      toggleListening: vi.fn(),
      startListening: vi.fn(),
      stopListening: vi.fn(),
      registerHandler: vi.fn(() => vi.fn()),
      availableCommands: [],
    });

    render(<VoiceNavigationButton onNavigate={() => {}} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });
});
