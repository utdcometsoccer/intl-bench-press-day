import { type FC, useEffect, useState, useCallback } from 'react';
import { fiveThreeOneStorage } from '../services/fiveThreeOneStorage';
import { workoutResultsStorage } from '../services/workoutResultsStorage';
import type { FiveThreeOneCycle } from '../types';
import type { WorkoutResult } from '../types';
import { getNextWorkout, getCycleProgress, type WorkoutSuggestion, type CycleProgress } from '../services/workoutSuggestionService';
import { convertCycleToPlan } from '../services/workoutPlanStorage';
import TodaysWorkout from './TodaysWorkout';
import QuickLog from './QuickLog';
import ProgressSummary from './ProgressSummary';
import CalendarView from './CalendarView';
import NotificationSettings from './NotificationSettings';
import './Dashboard.css';

interface DashboardProps {
  onNavigateToPlanner: () => void;
  onNavigateToLogger: () => void;
  onNavigateToProgress: () => void;
}

const Dashboard: FC<DashboardProps> = ({
  onNavigateToPlanner,
  onNavigateToLogger,
  onNavigateToProgress,
}) => {
  const [activeCycle, setActiveCycle] = useState<FiveThreeOneCycle | null>(null);
  const [workoutResults, setWorkoutResults] = useState<WorkoutResult[]>([]);
  const [nextWorkout, setNextWorkout] = useState<WorkoutSuggestion | null>(null);
  const [cycleProgress, setCycleProgress] = useState<CycleProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      await fiveThreeOneStorage.initialize();
      await workoutResultsStorage.initialize();

      const cycle = await fiveThreeOneStorage.getActiveCycle();
      setActiveCycle(cycle);

      if (cycle) {
        const results = await workoutResultsStorage.getWorkoutResultsByCycle(cycle.id);
        setWorkoutResults(results);
        
        const plan = convertCycleToPlan(cycle);
        const suggestion = getNextWorkout(plan, results);
        setNextWorkout(suggestion);
        
        const progress = getCycleProgress(plan, results);
        setCycleProgress(progress);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuickLogComplete = async () => {
    setShowQuickLog(false);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="dashboard loading">
        <h2>Dashboard</h2>
        <p className="loading-text">Loading your workout data...</p>
      </div>
    );
  }

  if (!activeCycle) {
    return (
      <div className="dashboard no-cycle">
        <h2>Welcome Back!</h2>
        <div className="no-cycle-card">
          <div className="no-cycle-icon" aria-hidden="true">🏋️</div>
          <h3>No Active Training Cycle</h3>
          <p>You don't have an active training cycle yet. Create a 5/3/1 cycle to unlock powerful features like:</p>
          <ul className="info-message-list">
            <li><strong>Smart workout suggestions</strong> based on your progress</li>
            <li><strong>Automatic weight calculations</strong> for every session</li>
            <li><strong>Progress tracking</strong> with visual charts and statistics</li>
            <li><strong>Calendar view</strong> to plan and track your workouts</li>
          </ul>
          <button className="create-cycle-button" onClick={onNavigateToPlanner} title="Navigate to 5/3/1 Planner to create your first training cycle">
            Create Your First Training Cycle
          </button>
          <p className="help-text">
            💡 <strong>Tip:</strong> You'll need your current one-rep maxes (1RM) for the main lifts. 
            Use the <strong>Exercise Tracker</strong> tab if you need to calculate them first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p className="cycle-name">Active: <strong>{activeCycle.name}</strong></p>
      </div>

      {/* Today's Workout Section */}
      {nextWorkout && (
        <TodaysWorkout
          suggestion={nextWorkout}
          onStartWorkout={() => setShowQuickLog(true)}
          onViewFullLogger={onNavigateToLogger}
        />
      )}

      {/* Quick Log Modal */}
      {showQuickLog && nextWorkout && nextWorkout.workout && (
        <QuickLog
          cycle={activeCycle}
          workout={nextWorkout.workout}
          onComplete={handleQuickLogComplete}
          onCancel={() => setShowQuickLog(false)}
        />
      )}

      {/* Progress Summary */}
      {cycleProgress && (
        <ProgressSummary
          progress={cycleProgress}
          onViewFullProgress={onNavigateToProgress}
        />
      )}

      {/* Calendar Toggle */}
      <div className="calendar-toggle-section">
        <button
          className="calendar-toggle-button"
          onClick={() => setShowCalendar(!showCalendar)}
          aria-expanded={showCalendar}
        >
          {showCalendar ? '📅 Hide Calendar' : '📅 View Calendar'}
        </button>
      </div>

      {/* Calendar View */}
      {showCalendar && (
        <CalendarView
          cycle={activeCycle}
          results={workoutResults}
        />
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-button" onClick={onNavigateToLogger}>
            <span className="action-icon" aria-hidden="true">📝</span>
            <span className="action-label">Log Workout</span>
          </button>
          <button className="action-button" onClick={onNavigateToProgress}>
            <span className="action-icon" aria-hidden="true">📊</span>
            <span className="action-label">View Progress</span>
          </button>
          <button className="action-button" onClick={onNavigateToPlanner}>
            <span className="action-icon" aria-hidden="true">📋</span>
            <span className="action-label">Manage Cycles</span>
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <NotificationSettings />
    </div>
  );
};

export default Dashboard;
