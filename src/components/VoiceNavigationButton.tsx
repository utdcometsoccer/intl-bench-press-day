import { useVoiceNavigation, VOICE_COMMANDS } from '../hooks/useVoiceNavigation';
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
        className="voice-help-button"
        onClick={() => setShowHelp(!showHelp)}
        aria-label={showHelp ? 'Hide voice commands help' : 'Show voice commands help'}
        aria-expanded={showHelp}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'var(--secondary-button-bg, #6c757d)',
          color: 'white',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ❓
      </button>

      {/* Feedback Message */}
      {(feedback || error) && (
        <div
          className="voice-feedback"
          role={error ? 'alert' : 'status'}
          aria-live="polite"
        >
          {error ? (
            <span style={{ color: '#dc3545' }}>{error}</span>
          ) : (
            <span className="command-text">{feedback}</span>
          )}
        </div>
      )}

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
          className="voice-help-panel"
          role="dialog"
          aria-label="Voice Commands Help"
          style={{
            position: 'fixed',
            bottom: '130px',
            right: '20px',
            maxWidth: '350px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: 'var(--container-bg, white)',
            color: 'var(--text-primary, #213547)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            zIndex: 10001,
            border: '1px solid var(--border-color, #e0e0e0)',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>
            🎤 Voice Commands
          </h3>
          <p style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary, #6c757d)' }}>
            Click the microphone button and say a command:
          </p>
          <div style={{ fontSize: '13px' }}>
            <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Navigation:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'disc' }}>
              {VOICE_COMMANDS
                .filter(cmd => cmd.action === 'navigate')
                .filter((cmd, index, arr) => 
                  arr.findIndex(c => c.description === cmd.description) === index
                )
                .map((cmd) => (
                  <li key={cmd.command} style={{ marginBottom: '4px' }}>
                    <strong>"{cmd.command}"</strong> - {cmd.description}
                  </li>
                ))}
            </ul>
            <h4 style={{ marginTop: '12px', marginBottom: '8px', fontSize: '14px' }}>Other:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'disc' }}>
              <li style={{ marginBottom: '4px' }}>
                <strong>"help"</strong> - Show available commands
              </li>
              <li style={{ marginBottom: '4px' }}>
                <strong>"stop"</strong> - Stop listening
              </li>
            </ul>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: 'var(--primary-button-bg, #007bff)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

export default VoiceNavigationButton;
