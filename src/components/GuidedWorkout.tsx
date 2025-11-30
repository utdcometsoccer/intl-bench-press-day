import { type FC, useState } from 'react';
import './GuidedWorkout.css';

interface GuidedWorkoutProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: string;
  tips: string[];
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Warmup Sets',
    description: 'Start with lighter weights to prepare your muscles and practice the movement pattern.',
    icon: '🔥',
    tips: [
      'Perform 3 warmup sets at 40%, 50%, and 60% of your training max',
      'Keep reps low (5, 5, 3) to conserve energy',
      'Focus on proper form and range of motion',
    ],
  },
  {
    id: 2,
    title: 'Main Sets',
    description: 'These are your working sets where the real strength building happens.',
    icon: '💪',
    tips: [
      'Follow the prescribed reps and percentages for your current week',
      'Week 1: 5/5/5+, Week 2: 3/3/3+, Week 3: 5/3/1+',
      'The "+" means do as many reps as possible (AMRAP) on your last set',
    ],
  },
  {
    id: 3,
    title: 'AMRAP Set',
    description: 'The final set of main work - push yourself while maintaining good form!',
    icon: '🎯',
    tips: [
      'Leave 1-2 reps in the tank - don\'t go to complete failure',
      'Stop if your form breaks down',
      'This set determines your progress - aim to beat last cycle\'s reps',
    ],
  },
  {
    id: 4,
    title: 'Assistance Work',
    description: 'Supplementary exercises to build muscle and address weaknesses.',
    icon: '🏋️',
    tips: [
      'Pick 2-3 assistance exercises',
      'Aim for 50-100 total reps of push, pull, and single-leg/core work',
      'Keep it simple and consistent',
    ],
  },
  {
    id: 5,
    title: 'Log Your Workout',
    description: 'Record your results to track progress over time.',
    icon: '📝',
    tips: [
      'Log all sets including warmups',
      'Record your AMRAP reps - this tracks your progress',
      'Add notes about how you felt or any form cues',
    ],
  },
];

const GuidedWorkout: FC<GuidedWorkoutProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  
  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="guided-workout">
      <div className="guided-content">
        <div className="guided-header">
          <h2 className="guided-title">Guided Workout Tour</h2>
          <p className="guided-subtitle">
            Learn how a typical 5/3/1 workout is structured
          </p>
        </div>

        {/* Progress indicator */}
        <div className="step-progress" aria-label={`Step ${currentStep + 1} of ${steps.length}`}>
          {steps.map((s, index) => (
            <div
              key={s.id}
              className={`step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Step content */}
        <div className="step-content">
          <div className="step-icon" aria-hidden="true">{step.icon}</div>
          <h3 className="step-title">
            Step {step.id}: {step.title}
          </h3>
          <p className="step-description">{step.description}</p>
          
          <ul className="step-tips" aria-label="Tips">
            {step.tips.map((tip, index) => (
              <li key={index} className="tip-item">
                <span className="tip-bullet" aria-hidden="true">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation buttons */}
        <div className="guided-actions">
          {!isFirstStep && (
            <button
              className="guided-prev-button"
              onClick={handlePrevious}
              aria-label="Go to previous step"
            >
              ← Previous
            </button>
          )}
          
          <button
            className="guided-next-button"
            onClick={handleNext}
            aria-label={isLastStep ? 'Complete the tour' : 'Go to next step'}
          >
            {isLastStep ? 'Start Training!' : 'Next →'}
          </button>
        </div>

        <button
          className="guided-skip-button"
          onClick={onSkip}
          aria-label="Skip the guided tour"
        >
          Skip Tour
        </button>
      </div>
    </div>
  );
};

export default GuidedWorkout;
