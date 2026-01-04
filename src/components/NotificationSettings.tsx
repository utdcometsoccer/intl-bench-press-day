import { type FC, useState, useEffect } from 'react';
import { notificationService, type NotificationPermissionStatus } from '../services/notificationService';
import { userPreferencesStorage } from '../services/userPreferencesStorage';
import './NotificationSettings.css';

interface NotificationSettingsProps {
  inline?: boolean;
  showAutoSave?: boolean;
}

const NotificationSettings: FC<NotificationSettingsProps> = ({ inline = false, showAutoSave = true }) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>({
    granted: false,
    denied: false,
    default: true,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30);
  const [preferredRestTime, setPreferredRestTime] = useState(90);
  const [autoStartRestTimer, setAutoStartRestTimer] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(notificationService.isSupported());
    
    // Get current permission status
    setPermissionStatus(notificationService.getPermissionStatus());
    
    // Get user preferences
    const preferences = userPreferencesStorage.getPreferences();
    setNotificationsEnabled(preferences.notificationsEnabled);
    setAutoSaveEnabled(preferences.autoSaveEnabled);
    setAutoSaveInterval(preferences.autoSaveInterval);
    setPreferredRestTime(preferences.preferredRestTime);
    setAutoStartRestTimer(preferences.autoStartRestTimer);
  }, []);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    
    try {
      const granted = await notificationService.requestPermission();
      setPermissionStatus(notificationService.getPermissionStatus());
      
      if (granted) {
        setNotificationsEnabled(true);
        userPreferencesStorage.setNotificationsEnabled(true);
        
        // Show a test notification
        await notificationService.showNotification(
          'Notifications Enabled! 🎉',
          {
            body: 'You will now receive workout reminders.',
            tag: 'notification-enabled',
          }
        );
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDisableNotifications = () => {
    setNotificationsEnabled(false);
    userPreferencesStorage.setNotificationsEnabled(false);
    notificationService.cancelAllScheduledNotifications();
  };

  const handleToggleNotifications = () => {
    if (notificationsEnabled) {
      handleDisableNotifications();
    } else if (permissionStatus.granted) {
      setNotificationsEnabled(true);
      userPreferencesStorage.setNotificationsEnabled(true);
    } else {
      handleEnableNotifications();
    }
  };

  const handleToggleAutoSave = () => {
    const newValue = !autoSaveEnabled;
    setAutoSaveEnabled(newValue);
    userPreferencesStorage.setAutoSaveEnabled(newValue);
  };

  const handleAutoSaveIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterval = parseInt(event.target.value, 10);
    setAutoSaveInterval(newInterval);
    userPreferencesStorage.setAutoSaveInterval(newInterval);
  };

  const handlePreferredRestTimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newRestTime = parseInt(event.target.value, 10);
    setPreferredRestTime(newRestTime);
    userPreferencesStorage.setPreferredRestTime(newRestTime);
  };

  const handleToggleAutoStartRestTimer = () => {
    const newValue = !autoStartRestTimer;
    setAutoStartRestTimer(newValue);
    userPreferencesStorage.setAutoStartRestTimer(newValue);
  };

  const renderAutoSaveSettings = () => (
    <div className="notification-settings auto-save-settings">
      <div className="notification-header">
        <span className="icon" aria-hidden="true">💾</span>
        <h4>Auto-Save Workout</h4>
      </div>

      <div className="notification-content">
        <div className="notification-enabled-content">
          <label className="notification-toggle">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={handleToggleAutoSave}
              aria-label="Enable auto-save for workout sessions"
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">
              {autoSaveEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
          
          {autoSaveEnabled && (
            <div className="auto-save-interval">
              <label htmlFor="auto-save-interval">
                Save every:
                <select
                  id="auto-save-interval"
                  value={autoSaveInterval}
                  onChange={handleAutoSaveIntervalChange}
                  className="interval-select"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                  <option value={300}>5 minutes</option>
                </select>
              </label>
              <p className="notification-info">
                Your workout session will be automatically saved at this interval. 
                Incomplete sessions older than 3 hours are automatically discarded.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRestTimerSettings = () => (
    <div className="notification-settings rest-timer-settings">
      <div className="notification-header">
        <span className="icon" aria-hidden="true">⏱️</span>
        <h4>Rest Timer</h4>
      </div>

      <div className="notification-content">
        <div className="notification-enabled-content">
          <div className="rest-timer-preference">
            <label htmlFor="rest-timer-duration">
              Preferred rest time:
              <select
                id="rest-timer-duration"
                value={preferredRestTime}
                onChange={handlePreferredRestTimeChange}
                className="interval-select"
              >
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={90}>90 seconds</option>
                <option value={120}>2 minutes</option>
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes</option>
              </select>
            </label>
          </div>

          <label className="notification-toggle">
            <input
              type="checkbox"
              checked={autoStartRestTimer}
              onChange={handleToggleAutoStartRestTimer}
              aria-label="Auto-start rest timer after completing a set"
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">
              Auto-start timer after sets
            </span>
          </label>

          {autoStartRestTimer && (
            <p className="notification-info">
              The rest timer will automatically start after you complete each set during your workout.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (!isSupported) {
    return inline ? null : (
      <div className="notification-settings">
        <div className="notification-unsupported">
          <span className="icon" aria-hidden="true">🔕</span>
          <p>Notifications are not supported in this browser.</p>
        </div>
        {showAutoSave && renderAutoSaveSettings()}
        {renderRestTimerSettings()}
      </div>
    );
  }

  if (permissionStatus.denied) {
    return inline ? null : (
      <div className="notification-settings">
        <div className="notification-denied">
          <span className="icon" aria-hidden="true">⚠️</span>
          <div>
            <strong>Notifications Blocked</strong>
            <p>
              You've blocked notifications for this site. To enable workout reminders,
              please update your browser settings.
            </p>
          </div>
        </div>
        {showAutoSave && renderAutoSaveSettings()}
        {renderRestTimerSettings()}
      </div>
    );
  }

  if (inline) {
    return (
      <label className="notification-toggle-inline">
        <input
          type="checkbox"
          checked={notificationsEnabled && permissionStatus.granted}
          onChange={handleToggleNotifications}
          disabled={isRequesting}
        />
        <span className="toggle-label">
          {isRequesting ? 'Requesting...' : 'Workout Reminders'}
        </span>
      </label>
    );
  }

  return (
    <>
      <div className="notification-settings">
        <div className="notification-header">
          <span className="icon" aria-hidden="true">🔔</span>
          <h4>Workout Reminders</h4>
        </div>

        <div className="notification-content">
          {permissionStatus.granted ? (
            <div className="notification-enabled-content">
              <label className="notification-toggle">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={handleToggleNotifications}
                  aria-label="Enable workout reminder notifications"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
              
              {notificationsEnabled && (
                <p className="notification-info">
                  You'll receive reminders when it's time for your scheduled workouts.
                </p>
              )}
            </div>
          ) : (
            <div className="notification-request-content">
              <p>Get reminded when it's time for your next workout.</p>
              <button
                className="enable-notifications-button"
                onClick={handleEnableNotifications}
                disabled={isRequesting}
                aria-label="Enable workout reminder notifications"
              >
                {isRequesting ? 'Requesting...' : 'Enable Notifications'}
              </button>
            </div>
          )}
        </div>
      </div>
      {showAutoSave && renderAutoSaveSettings()}
      {renderRestTimerSettings()}
    </>
  );
};

export default NotificationSettings;
