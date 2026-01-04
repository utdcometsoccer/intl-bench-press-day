import { type FC, useState, useEffect, useRef, useCallback } from 'react';
import './RestTimer.css';

export interface RestTimerProps {
  /** Initial time in seconds */
  initialTime?: number;
  /** Callback when timer completes */
  onComplete?: () => void;
  /** Callback when timer is dismissed/skipped */
  onDismiss?: () => void;
  /** Auto-start the timer */
  autoStart?: boolean;
  /** Show the timer component */
  show?: boolean;
}

const PRESET_TIMES = [
  { label: '30s', value: 30 },
  { label: '1min', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
  { label: '5min', value: 300 },
];

const RestTimer: FC<RestTimerProps> = ({
  initialTime = 90,
  onComplete,
  onDismiss,
  autoStart = false,
  show = true,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [selectedPreset, setSelectedPreset] = useState<number>(initialTime);
  const [customTime, setCustomTime] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasCompletedRef = useRef(false);

  const playBeep = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play audio notification:', error);
    }
  };

  const handleTimerComplete = useCallback(() => {
    // Play audio notification
    playBeep();
    
    // Trigger vibration if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    // Call completion callback
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Initialize audio element
  useEffect(() => {
    // Create audio context for beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Store a reference to play beep sound
    audioRef.current = new Audio();
    
    return () => {
      audioContext.close();
    };
  }, []);

  // Timer countdown logic
  useEffect(() => {
    if (!isRunning || !show) {
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            handleTimerComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, show, handleTimerComplete]);

  // Reset completed flag when timer is reset
  useEffect(() => {
    if (timeRemaining > 0) {
      hasCompletedRef.current = false;
    }
  }, [timeRemaining]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(selectedPreset);
    hasCompletedRef.current = false;
  };

  const handlePresetSelect = (seconds: number) => {
    setSelectedPreset(seconds);
    setTimeRemaining(seconds);
    setIsRunning(false);
    setShowCustomInput(false);
    hasCompletedRef.current = false;
  };

  const handleCustomTimeSubmit = () => {
    const seconds = parseInt(customTime, 10);
    if (!isNaN(seconds) && seconds > 0 && seconds <= 3600) {
      setSelectedPreset(seconds);
      setTimeRemaining(seconds);
      setIsRunning(false);
      setShowCustomInput(false);
      setCustomTime('');
      hasCompletedRef.current = false;
    }
  };

  const handleExtendTime = (seconds: number) => {
    setTimeRemaining((prev) => Math.max(0, prev + seconds));
    setSelectedPreset((prev) => prev + seconds);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setTimeRemaining(0);
    hasCompletedRef.current = false;
    if (onDismiss) {
      onDismiss();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return ((selectedPreset - timeRemaining) / selectedPreset) * 100;
  };

  if (!show) {
    return null;
  }

  return (
    <div className="rest-timer-container" role="timer" aria-label="Rest timer">
      <div className="rest-timer-header">
        <h3>Rest Timer</h3>
        <button
          onClick={handleSkip}
          className="rest-timer-close"
          aria-label="Close rest timer"
          type="button"
        >
          ✕
        </button>
      </div>

      <div className="rest-timer-display">
        <div className="timer-circle">
          <svg className="timer-progress" viewBox="0 0 100 100">
            <circle
              className="timer-progress-background"
              cx="50"
              cy="50"
              r="45"
            />
            <circle
              className="timer-progress-bar"
              cx="50"
              cy="50"
              r="45"
              style={{
                strokeDashoffset: `${283 - (283 * getProgressPercentage()) / 100}`,
              }}
            />
          </svg>
          <div className="timer-time" aria-live="polite" aria-atomic="true">
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      <div className="rest-timer-presets">
        {PRESET_TIMES.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetSelect(preset.value)}
            className={`preset-button ${selectedPreset === preset.value ? 'active' : ''}`}
            aria-label={`Set rest time to ${preset.label}`}
            type="button"
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className={`preset-button ${showCustomInput ? 'active' : ''}`}
          aria-label="Set custom rest time"
          type="button"
        >
          Custom
        </button>
      </div>

      {showCustomInput && (
        <div className="rest-timer-custom">
          <label htmlFor="custom-time-input">
            Custom time (seconds):
          </label>
          <div className="custom-time-input-group">
            <input
              id="custom-time-input"
              type="number"
              min="1"
              max="3600"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              placeholder="Enter seconds"
              className="custom-time-input"
              aria-label="Custom rest time in seconds"
            />
            <button
              onClick={handleCustomTimeSubmit}
              className="custom-time-submit"
              disabled={!customTime || parseInt(customTime) <= 0}
              aria-label="Set custom time"
              type="button"
            >
              Set
            </button>
          </div>
        </div>
      )}

      <div className="rest-timer-controls">
        <button
          onClick={handleStartPause}
          className="timer-control-button primary"
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          type="button"
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button
          onClick={handleReset}
          className="timer-control-button"
          aria-label="Reset timer"
          type="button"
        >
          🔄 Reset
        </button>
      </div>

      <div className="rest-timer-adjust">
        <button
          onClick={() => handleExtendTime(-30)}
          className="adjust-button"
          disabled={timeRemaining < 30}
          aria-label="Decrease time by 30 seconds"
          type="button"
        >
          -30s
        </button>
        <button
          onClick={() => handleExtendTime(30)}
          className="adjust-button"
          aria-label="Increase time by 30 seconds"
          type="button"
        >
          +30s
        </button>
      </div>
    </div>
  );
};

export default RestTimer;
