import { useVoiceNavigation, VOICE_COMMANDS } from '../hooks/useVoiceNavigation';
import VoiceFeedback from './VoiceFeedback';
import { useState } from 'react';

interface VoiceNavigationButtonProps {
  onNavigate: (tab: string) => void;
}

const VoiceNavigationButton = ({ onNavigate }: VoiceNavigationButtonProps) => {
  const {
    isListening,
    isSupported,
    feedback,
    error,
    toggleListening,
  } = useVoiceNavigation(onNavigate);
  
  const [showHelp, setShowHelp] = useState(false);

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Voice Navigation Button */}
      <button
        type="button"
        className={`voice-nav-button ${isListening ? 'listening' : ''}`}
        onClick={toggleListening}
        aria-label={isListening ? 'Stop voice commands' : 'Start voice commands'}
        aria-pressed={isListening}
        title={isListening ? 'Stop listening (or say "stop")' : 'Start voice navigation'}
      >
        {isListening ? '🎤' : '🎙️'}
      </button>

      {/* Help Button */}
      <button
        type="button"
        className="voice-help-button"
        onClick={() => setShowHelp(!showHelp)}
        aria-label={showHelp ? 'Hide voice commands help' : 'Show voice commands help'}
        aria-expanded={showHelp}
        aria-controls="voice-help-panel"
        title="Click for voice command help"
      >
        ❓
      </button>

      {/* Feedback Message */}
      <VoiceFeedback feedback={feedback} error={error} />

      {/* Listening Indicator */}
      {isListening && (
        <div
          className="voice-command-indicator listening"
          role="status"
          aria-live="polite"
        >
          <span className="mic-icon">🎤</span>
          <span>Listening...</span>
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div
          id="voice-help-panel"
          className="voice-help-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-help-title"
        >
          <h3 id="voice-help-title">
            🎤 Voice Commands
          </h3>
          <p>
            Click the microphone button and say a command:
          </p>
          <div>
            <h4>Navigation:</h4>
            <ul>
              {VOICE_COMMANDS
                .filter(cmd => cmd.action === 'navigate')
                .filter((cmd, index, arr) => 
                  arr.findIndex(c => c.description === cmd.description) === index
                )
                .map((cmd) => (
                  <li key={cmd.command}>
                    <strong>"{cmd.command}"</strong> - {cmd.description}
                  </li>
                ))}
            </ul>
            <h4>Other:</h4>
            <ul>
              <li>
                <strong>"help"</strong> - Show available commands
              </li>
              <li>
                <strong>"stop"</strong> - Stop listening
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="voice-help-close-button"
            aria-label="Close voice commands help"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

export default VoiceNavigationButton;
