import { type FC } from 'react';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onContinue: () => void;
}

const WelcomeScreen: FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon" aria-hidden="true">
          🏋️
        </div>
        <h1 className="welcome-title">
          Welcome to International Bench Press Day!
        </h1>
        <p className="welcome-subtitle">
          Your personal 5/3/1 strength training companion
        </p>
        
        <div className="welcome-features">
          <div className="feature-item">
            <span className="feature-icon" aria-hidden="true">📊</span>
            <div className="feature-text">
              <strong>Track Your Progress</strong>
              <p>Log workouts and see your strength gains over time</p>
            </div>
          </div>
          
          <div className="feature-item">
            <span className="feature-icon" aria-hidden="true">🎯</span>
            <div className="feature-text">
              <strong>5/3/1 Program</strong>
              <p>Built-in Jim Wendler's proven strength methodology</p>
            </div>
          </div>
          
          <div className="feature-item">
            <span className="feature-icon" aria-hidden="true">📱</span>
            <div className="feature-text">
              <strong>Works Offline</strong>
              <p>Train anywhere, even without internet connection</p>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-icon" aria-hidden="true">🧮</span>
            <div className="feature-text">
              <strong>Plate Calculator</strong>
              <p>Know exactly what plates to load on the bar</p>
            </div>
          </div>
        </div>

        <button
          className="welcome-continue-button"
          onClick={onContinue}
          aria-label="Get started with the app"
        >
          Let's Get Started!
        </button>

        <p className="welcome-note">
          We'll help you set up your profile and first training cycle
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
