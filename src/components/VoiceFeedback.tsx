import React from 'react';

interface VoiceFeedbackProps {
  feedback?: string | null;
  error?: string | null;
}

const VoiceFeedback: React.FC<VoiceFeedbackProps> = ({ feedback, error }) => {
  if (error) {
    return (
      <div className="voice-feedback" role="alert" aria-live="assertive">
        <span className="voice-error">{error}</span>
      </div>
    );
  }

  if (feedback) {
    return (
      <div className="voice-feedback" role="status" aria-live="polite">
        <span className="command-text">{feedback}</span>
      </div>
    );
  }

  return null;
};

export default VoiceFeedback;
