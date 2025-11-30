import { type FC, useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import QuickProfileSetup from './QuickProfileSetup';
import GuidedWorkout from './GuidedWorkout';
import FiveThreeOnePlanner from './FiveThreeOnePlanner';
import { userPreferencesStorage } from '../services/userPreferencesStorage';
import './FirstTimeUserWizard.css';

type WizardStep = 'welcome' | 'profile' | 'createCycle' | 'guidedWorkout';

interface FirstTimeUserWizardProps {
  onComplete: () => void;
}

const FirstTimeUserWizard: FC<FirstTimeUserWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [cycleCreated, setCycleCreated] = useState(false);

  const handleWelcomeContinue = () => {
    setCurrentStep('profile');
  };

  const handleProfileComplete = () => {
    setCurrentStep('createCycle');
  };

  const handleProfileSkip = () => {
    setCurrentStep('createCycle');
  };

  const handleCycleCreated = () => {
    setCycleCreated(true);
  };

  const handleContinueToGuide = () => {
    if (cycleCreated) {
      setCurrentStep('guidedWorkout');
    }
  };

  const handleGuidedComplete = () => {
    userPreferencesStorage.completeOnboarding();
    onComplete();
  };

  const handleGuidedSkip = () => {
    userPreferencesStorage.completeOnboarding();
    onComplete();
  };

  const handleSkipAll = () => {
    userPreferencesStorage.completeOnboarding();
    onComplete();
  };

  return (
    <div className="first-time-wizard">
      {/* Progress indicator for full wizard */}
      <div className="wizard-progress" aria-label="Setup progress">
        <div className={`wizard-step ${currentStep === 'welcome' ? 'active' : 'completed'}`}>
          <div className="wizard-step-number">1</div>
          <span className="wizard-step-label">Welcome</span>
        </div>
        <div className="wizard-step-connector" />
        <div className={`wizard-step ${currentStep === 'profile' ? 'active' : ['createCycle', 'guidedWorkout'].includes(currentStep) ? 'completed' : ''}`}>
          <div className="wizard-step-number">2</div>
          <span className="wizard-step-label">Setup</span>
        </div>
        <div className="wizard-step-connector" />
        <div className={`wizard-step ${currentStep === 'createCycle' ? 'active' : currentStep === 'guidedWorkout' ? 'completed' : ''}`}>
          <div className="wizard-step-number">3</div>
          <span className="wizard-step-label">Create Cycle</span>
        </div>
        <div className="wizard-step-connector" />
        <div className={`wizard-step ${currentStep === 'guidedWorkout' ? 'active' : ''}`}>
          <div className="wizard-step-number">4</div>
          <span className="wizard-step-label">Learn</span>
        </div>
      </div>

      {/* Step content */}
      <div className="wizard-content">
        {currentStep === 'welcome' && (
          <WelcomeScreen onContinue={handleWelcomeContinue} />
        )}

        {currentStep === 'profile' && (
          <QuickProfileSetup
            onComplete={handleProfileComplete}
            onSkip={handleProfileSkip}
          />
        )}

        {currentStep === 'createCycle' && (
          <div className="wizard-cycle-step">
            <div className="cycle-step-header">
              <h2>Create Your First Training Cycle</h2>
              <p>Set up your 5/3/1 program with your current training maxes</p>
            </div>
            <div className="cycle-form-container">
              <FiveThreeOnePlanner onCycleCreated={handleCycleCreated} />
            </div>
            {cycleCreated && (
              <div className="cycle-created-actions">
                <div className="cycle-created-message">
                  ✅ Great! Your training cycle is ready.
                </div>
                <button
                  className="continue-to-guide-button"
                  onClick={handleContinueToGuide}
                >
                  Continue to Workout Guide →
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'guidedWorkout' && (
          <GuidedWorkout
            onComplete={handleGuidedComplete}
            onSkip={handleGuidedSkip}
          />
        )}
      </div>

      {/* Skip all button - available on all steps except guided workout */}
      {currentStep !== 'guidedWorkout' && currentStep !== 'welcome' && (
        <button
          className="wizard-skip-all"
          onClick={handleSkipAll}
          aria-label="Skip setup and go directly to the app"
        >
          Skip setup & start using app
        </button>
      )}
    </div>
  );
};

export default FirstTimeUserWizard;
