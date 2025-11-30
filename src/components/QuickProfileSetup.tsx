import { type FC, useState } from 'react';
import { userPreferencesStorage } from '../services/userPreferencesStorage';
import './QuickProfileSetup.css';

interface QuickProfileSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

const QuickProfileSetup: FC<QuickProfileSetupProps> = ({ onComplete, onSkip }) => {
  const [restTime, setRestTime] = useState<number>(90);
  const [notifications, setNotifications] = useState<boolean>(false);

  const handleComplete = () => {
    userPreferencesStorage.setPreferredRestTime(restTime);
    userPreferencesStorage.setNotificationsEnabled(notifications);
    userPreferencesStorage.completeProfile();
    onComplete();
  };

  const restTimeOptions = [
    { value: 60, label: '60 seconds', description: 'Quick rest for conditioning' },
    { value: 90, label: '90 seconds', description: 'Recommended for most lifters' },
    { value: 120, label: '2 minutes', description: 'More recovery between sets' },
    { value: 180, label: '3 minutes', description: 'Maximum recovery for heavy lifts' },
  ];

  return (
    <div className="quick-profile-setup">
      <div className="profile-content">
        <div className="profile-icon" aria-hidden="true">⚙️</div>
        <h2 className="profile-title">Quick Setup</h2>
        <p className="profile-subtitle">
          Let's personalize your experience
        </p>

        <div className="profile-form">
          {/* Rest Time Preference */}
          <div className="form-group">
            <label className="form-group-label" id="rest-time-label">
              Preferred Rest Time Between Sets
            </label>
            <div 
              className="rest-time-options"
              role="radiogroup"
              aria-labelledby="rest-time-label"
            >
              {restTimeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`rest-time-option ${restTime === option.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="restTime"
                    value={option.value}
                    checked={restTime === option.value}
                    onChange={() => setRestTime(option.value)}
                    className="rest-time-radio"
                  />
                  <div className="rest-time-content">
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="form-group">
            <label className="notification-toggle">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="notification-checkbox"
              />
              <div className="notification-content">
                <strong>Enable Workout Reminders</strong>
                <span>Get notified when it's time for your next workout</span>
              </div>
            </label>
          </div>
        </div>

        <div className="profile-actions">
          <button
            className="profile-continue-button"
            onClick={handleComplete}
            aria-label="Save preferences and continue"
          >
            Continue
          </button>
          <button
            className="profile-skip-button"
            onClick={onSkip}
            aria-label="Skip setup and use default settings"
          >
            Skip for now
          </button>
        </div>

        <p className="profile-note">
          You can change these settings anytime
        </p>
      </div>
    </div>
  );
};

export default QuickProfileSetup;
